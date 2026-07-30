<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkReportRequest;
use App\Models\Client;
use App\Models\JobCategory;
use App\Models\User;
use App\Models\WorkReport;
use App\Models\WorkReportPhoto;
use App\Services\AcMeasurementValidatorInterface;
use App\Services\PdfImageOptimizerInterface;
use App\Services\PresetRegistryInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class WorkReportController extends Controller
{
    public function __construct(
        protected PresetRegistryInterface $presetRegistry,
        protected AcMeasurementValidatorInterface $acMeasurementValidator,
        protected PdfImageOptimizerInterface $pdfImageOptimizer,
    ) {}

    /**
     * Display a listing of work reports.
     * Technicians only see their own reports. Admin sees all.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $query = WorkReport::with([
            'client:id,name',
            'category:id,name',
            'technician:id,name',
        ]);

        // Operator data isolation: technician/staff only see own reports
        if ($user->isWorkReportOperator()) {
            $query->where('technician_id', $user->id);
        }

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filter by client
        if ($clientId = $request->input('client_id')) {
            $query->where('client_id', $clientId);
        }

        // Filter by date range
        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $workReports = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('WorkReports/Index', [
            'workReports' => $workReports,
            'clients' => fn () => Client::select('id', 'name')->orderBy('name')->get(),
            'filters' => [
                'status' => $request->input('status', ''),
                'client_id' => $request->input('client_id', ''),
                'date_from' => $request->input('date_from', ''),
                'date_to' => $request->input('date_to', ''),
            ],
        ]);
    }

    /**
     * Show the form for creating a new work report.
     */
    public function create(): Response
    {
        $clients = Client::active()->select('id', 'name')->orderBy('name')->get();
        $categories = JobCategory::select('id', 'name', 'preset_identifier')->orderBy('name')->get();

        // Validate preset identifiers against the registry and flag invalid ones
        $categories = $categories->map(function ($category) {
            $categoryArray = $category->toArray();
            if ($category->preset_identifier && ! $this->presetRegistry->has($category->preset_identifier)) {
                Log::warning("JobCategory ID {$category->id} references unresolvable preset identifier: {$category->preset_identifier}");
                $categoryArray['preset_identifier'] = null;
            }

            return $categoryArray;
        });

        return Inertia::render('WorkReports/Create', [
            'clients' => $clients,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created work report in storage.
     * Always saves as draft. If _submit flag is set, also submits.
     */
    public function store(StoreWorkReportRequest $request): RedirectResponse
    {
        $user = Auth::user();

        // Handle photo uploads
        $beforePhotos = $this->uploadPhotos($request, 'before_photos');
        $afterPhotos = $this->uploadPhotos($request, 'after_photos');

        // Resolve preset_data based on category's preset_identifier
        $presetData = null;
        $categoryId = $request->input('category_id');
        if ($categoryId) {
            $category = JobCategory::find($categoryId);
            if ($category && $category->preset_identifier && $this->presetRegistry->has($category->preset_identifier)) {
                if ($category->preset_identifier === 'ac_maintenance') {
                    $rawPresetData = $request->input('preset_data', []);
                    // FormData sends JSON as a string, decode if needed
                    $entries = is_string($rawPresetData) ? json_decode($rawPresetData, true) ?? [] : $rawPresetData;
                    if (! empty($entries)) {
                        // Throws ValidationException on failure
                        $presetData = $this->acMeasurementValidator->validate($entries);
                    }
                }
            }
        }

        $workReport = WorkReport::create([
            'client_id' => $request->input('client_id'),
            'category_id' => $request->input('category_id'),
            'technician_id' => $user->id,
            'description' => $request->input('description'),
            'area' => $request->input('area'),
            'preset_data' => $presetData,
            'status' => WorkReport::STATUS_DRAFT,
            'before_photos' => $beforePhotos ?: null,
            'after_photos' => $afterPhotos ?: null,
        ]);

        // Save photos to work_report_photos table
        $beforeCaptions = $request->input('before_captions', []);
        $afterCaptions = $request->input('after_captions', []);

        $photoRows = [
            ...$this->buildPhotoRows($workReport->id, WorkReportPhoto::TYPE_BEFORE, $beforePhotos, $beforeCaptions),
            ...$this->buildPhotoRows($workReport->id, WorkReportPhoto::TYPE_AFTER, $afterPhotos, $afterCaptions),
        ];

        if ($photoRows !== []) {
            WorkReportPhoto::insert($photoRows);
        }

        // Save per-unit AC photos
        $this->saveAcUnitPhotos($request, $workReport);

        // If _submit flag is set, auto-submit the report
        if ($request->input('_submit')) {
            $hasAfterPhotos = $workReport->afterPhotoItems()->exists();
            $category = $workReport->category;
            $isAcPreset = $category && $category->preset_identifier === 'ac_maintenance';

            // AC category uses per-unit photos, skip global after_photos requirement
            $canSubmit = $workReport->client_id
                && $workReport->category_id
                && $workReport->description
                && ($isAcPreset || $hasAfterPhotos);

            if ($canSubmit) {
                $workReport->update([
                    'status' => WorkReport::STATUS_SUBMITTED,
                    'submitted_at' => now(),
                ]);

                return Redirect::route('work-reports.index')
                    ->with('success', 'Laporan kerja berhasil disimpan dan disubmit.');
            }
        }

        return Redirect::route('work-reports.index')
            ->with('success', 'Laporan kerja berhasil disimpan sebagai draft.');
    }

    /**
     * Display the specified work report.
     */
    public function show(WorkReport $work_report): Response|RedirectResponse
    {
        $user = Auth::user();

        // Operators can only view their own reports
        if ($user->isWorkReportOperator() && (int) $work_report->technician_id !== (int) $user->id) {
            abort(403, 'Anda tidak memiliki akses ke laporan ini.');
        }

        $work_report->load(['client', 'category', 'technician', 'beforePhotoItems', 'afterPhotoItems']);

        // Append relational photo data for frontend
        $workReportData = $work_report->toArray();
        $workReportData['before_photos_rel'] = $work_report->beforePhotoItems;
        $workReportData['after_photos_rel'] = $work_report->afterPhotoItems;

        // Include preset_data for AC measurement display (Requirement 5.1, 5.3)
        $workReportData['preset_data'] = $work_report->preset_data;

        // Include per-unit AC photos
        $workReportData['ac_unit_photos'] = $this->getAcUnitPhotos($work_report);

        return Inertia::render('WorkReports/Show', [
            'workReport' => $workReportData,
        ]);
    }

    /**
     * Show the form for editing the specified work report.
     */
    public function edit(WorkReport $work_report): Response|RedirectResponse
    {
        $user = Auth::user();

        // Operators can only edit their own reports
        if ($user->isWorkReportOperator() && (int) $work_report->technician_id !== (int) $user->id) {
            abort(403, 'Anda tidak memiliki akses ke laporan ini.');
        }

        // Submitted reports cannot be edited by operators
        if ($user->isWorkReportOperator() && $work_report->status === WorkReport::STATUS_SUBMITTED) {
            abort(403, 'Laporan yang sudah disubmit tidak dapat diubah.');
        }

        $work_report->load(['beforePhotoItems', 'afterPhotoItems']);

        $clients = Client::active()->select('id', 'name')->orderBy('name')->get();
        $categories = JobCategory::select('id', 'name', 'preset_identifier')->orderBy('name')->get();

        // Validate preset identifiers against the registry and flag invalid ones
        $categories = $categories->map(function ($category) {
            $categoryArray = $category->toArray();
            if ($category->preset_identifier && ! $this->presetRegistry->has($category->preset_identifier)) {
                Log::warning("JobCategory ID {$category->id} references unresolvable preset identifier: {$category->preset_identifier}");
                $categoryArray['preset_identifier'] = null;
            }

            return $categoryArray;
        });

        // Append photo data for the frontend
        $workReportData = $work_report->toArray();
        $workReportData['before_photos_data'] = $work_report->beforePhotoItems;
        $workReportData['after_photos_data'] = $work_report->afterPhotoItems;
        $workReportData['preset_data'] = $work_report->preset_data;

        // Build per-unit AC photos for the frontend
        $workReportData['ac_unit_photos'] = $this->getAcUnitPhotos($work_report);

        return Inertia::render('WorkReports/Edit', [
            'workReport' => $workReportData,
            'clients' => $clients,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified work report in storage.
     */
    public function update(StoreWorkReportRequest $request, WorkReport $work_report): RedirectResponse
    {
        $user = Auth::user();

        // Operators can only update their own reports
        if ($user->isWorkReportOperator() && (int) $work_report->technician_id !== (int) $user->id) {
            abort(403, 'Anda tidak memiliki akses ke laporan ini.');
        }

        // Submitted reports cannot be edited by operators
        if ($user->isWorkReportOperator() && $work_report->status === WorkReport::STATUS_SUBMITTED) {
            abort(403, 'Laporan yang sudah disubmit tidak dapat diubah.');
        }

        // Handle existing photos to keep (IDs that the user chose to keep)
        $keepBeforePhotoIds = $request->input('existing_before_photos', []);
        $keepAfterPhotoIds = $request->input('existing_after_photos', []);

        // Delete removed photos from storage and DB
        $photosToRemove = $work_report->photos()
            ->where(function ($query) {
                $query->whereNull('caption')
                    ->orWhere('caption', 'not like', 'ac_unit_%');
            })
            ->whereNotIn('id', array_merge($keepBeforePhotoIds, $keepAfterPhotoIds))
            ->get();

        foreach ($photosToRemove as $photo) {
            $this->deleteStoredPhoto($photo->photo_path);
        }

        if ($photosToRemove->isNotEmpty()) {
            WorkReportPhoto::whereKey($photosToRemove->modelKeys())->delete();
        }

        // Upload new photos
        $newBeforePhotos = $this->uploadPhotos($request, 'before_photos');
        $newAfterPhotos = $this->uploadPhotos($request, 'after_photos');

        $beforeCaptions = $request->input('before_captions', []);
        $afterCaptions = $request->input('after_captions', []);

        // Get current max sort_order for before/after
        $maxBeforeSort = $work_report->beforePhotoItems()->max('sort_order') ?? -1;
        $maxAfterSort = $work_report->afterPhotoItems()->max('sort_order') ?? -1;

        $newPhotoRows = [
            ...$this->buildPhotoRows(
                $work_report->id,
                WorkReportPhoto::TYPE_BEFORE,
                $newBeforePhotos,
                $beforeCaptions,
                $maxBeforeSort + 1,
            ),
            ...$this->buildPhotoRows(
                $work_report->id,
                WorkReportPhoto::TYPE_AFTER,
                $newAfterPhotos,
                $afterCaptions,
                $maxAfterSort + 1,
            ),
        ];

        if ($newPhotoRows !== []) {
            WorkReportPhoto::insert($newPhotoRows);
        }

        // Also update legacy JSON fields for backward compat
        $allBefore = $work_report->beforePhotoItems()->pluck('photo_path')->toArray();
        $allAfter = $work_report->afterPhotoItems()->pluck('photo_path')->toArray();

        // Resolve preset_data based on category's preset_identifier
        $presetData = null;
        $categoryId = $request->input('category_id');
        if ($categoryId) {
            $category = JobCategory::find($categoryId);
            if ($category && $category->preset_identifier && $this->presetRegistry->has($category->preset_identifier)) {
                if ($category->preset_identifier === 'ac_maintenance') {
                    $rawPresetData = $request->input('preset_data', []);
                    // FormData sends JSON as a string, decode if needed
                    $entries = is_string($rawPresetData) ? json_decode($rawPresetData, true) ?? [] : $rawPresetData;
                    if (! empty($entries)) {
                        // Throws ValidationException on failure
                        $presetData = $this->acMeasurementValidator->validate($entries);
                    }
                }
            }
        }

        $work_report->update([
            'client_id' => $request->input('client_id'),
            'category_id' => $request->input('category_id'),
            'description' => $request->input('description'),
            'area' => $request->input('area'),
            'preset_data' => $presetData,
            'before_photos' => $allBefore ?: null,
            'after_photos' => $allAfter ?: null,
        ]);

        // Handle per-unit AC photos for update
        $this->saveAcUnitPhotos($request, $work_report, true);

        return Redirect::route('work-reports.index')
            ->with('success', 'Laporan kerja berhasil diperbarui.');
    }

    /**
     * Remove the specified work report from storage.
     */
    public function destroy(WorkReport $work_report): RedirectResponse
    {
        $user = Auth::user();

        // Operators can only delete their own reports
        if ($user->isWorkReportOperator() && (int) $work_report->technician_id !== (int) $user->id) {
            abort(403, 'Anda tidak memiliki akses ke laporan ini.');
        }

        // Submitted reports cannot be deleted by operators
        if ($user->isWorkReportOperator() && $work_report->status === WorkReport::STATUS_SUBMITTED) {
            abort(403, 'Laporan yang sudah disubmit tidak dapat dihapus.');
        }

        // Clean up photos from storage (both legacy and new table)
        $this->deletePhotos($work_report->before_photos ?? []);
        $this->deletePhotos($work_report->after_photos ?? []);

        foreach ($work_report->photos as $photo) {
            $this->deleteStoredPhoto($photo->photo_path);
        }
        // The photos will be cascade-deleted by the FK constraint

        $work_report->delete();

        return Redirect::route('work-reports.index')
            ->with('success', 'Laporan kerja berhasil dihapus.');
    }

    /**
     * Submit a draft work report.
     * Validates that required fields are filled for submission.
     */
    public function submit(Request $request, $id): RedirectResponse
    {
        $workReport = WorkReport::findOrFail($id);
        $user = Auth::user();

        // Operators can only submit their own reports
        if ($user->isWorkReportOperator() && (int) $workReport->technician_id !== (int) $user->id) {
            abort(403, 'Anda tidak memiliki akses ke laporan ini.');
        }

        // Already submitted
        if ($workReport->status === WorkReport::STATUS_SUBMITTED) {
            return Redirect::back()
                ->with('error', 'Laporan sudah disubmit sebelumnya.');
        }

        // Validate required fields for submission
        $validator = Validator::make($workReport->toArray(), [
            'client_id' => ['required'],
            'category_id' => ['required'],
            'description' => ['required', 'string', 'min:1'],
        ], [
            'client_id.required' => 'Klien wajib dipilih sebelum submit.',
            'category_id.required' => 'Kategori pekerjaan wajib dipilih sebelum submit.',
            'description.required' => 'Deskripsi aktivitas wajib diisi sebelum submit.',
        ]);

        if ($validator->fails()) {
            return Redirect::back()
                ->withErrors($validator)
                ->with('error', 'Laporan tidak dapat disubmit. Lengkapi data yang diperlukan.');
        }

        // Check at least 1 after photo exists (skip for AC category which uses per-unit photos)
        $category = $workReport->category;
        $isAcPreset = $category && $category->preset_identifier === 'ac_maintenance';

        if (! $isAcPreset) {
            $hasAfterPhotos = $workReport->afterPhotoItems()->exists();
            if (! $hasAfterPhotos) {
                // Fallback: check legacy JSON field
                $afterPhotosLegacy = $workReport->after_photos;
                if (empty($afterPhotosLegacy) || count($afterPhotosLegacy) === 0) {
                    return Redirect::back()
                        ->withErrors(['after_photos' => 'Minimal satu foto sesudah harus di-upload sebelum submit.'])
                        ->with('error', 'Laporan tidak dapat disubmit. Upload minimal satu foto sesudah.');
                }
            }
        }

        // Submit the report
        $workReport->update([
            'status' => WorkReport::STATUS_SUBMITTED,
            'submitted_at' => now(),
        ]);

        return Redirect::route('work-reports.index')
            ->with('success', 'Laporan kerja berhasil disubmit.');
    }

    /**
     * Upload photos from request and return array of paths.
     */
    private function uploadPhotos(Request $request, string $field): array
    {
        $paths = [];

        if ($request->hasFile($field)) {
            foreach ($request->file($field) as $photo) {
                $path = $photo->store('work-reports', 'public');
                $this->pdfImageOptimizer->optimize($path);
                $paths[] = $path;
            }
        }

        return $paths;
    }

    /**
     * Build rows for a bulk photo insert.
     */
    private function buildPhotoRows(
        int $workReportId,
        string $type,
        array $paths,
        array $captions,
        int $sortOffset = 0,
    ): array {
        $timestamp = now();

        return array_map(function (string $path, int $index) use (
            $workReportId,
            $type,
            $captions,
            $sortOffset,
            $timestamp,
        ) {
            return [
                'work_report_id' => $workReportId,
                'type' => $type,
                'photo_path' => $path,
                'caption' => $captions[$index] ?? null,
                'sort_order' => $sortOffset + $index,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }, $paths, array_keys($paths));
    }

    /**
     * Build a row for a per-unit AC photo bulk insert.
     */
    private function buildAcPhotoRow(
        WorkReport $workReport,
        string $type,
        string $path,
        int $unitIndex,
        int $sortOrder,
        string $caption,
    ): array {
        $timestamp = now();

        return [
            'work_report_id' => $workReport->id,
            'type' => $type,
            'photo_path' => $path,
            'caption' => "ac_unit_{$unitIndex}:{$caption}",
            'sort_order' => $sortOrder,
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ];
    }

    /**
     * Parse the internal AC unit marker from a photo caption.
     */
    private function parseAcPhotoCaption(?string $caption): ?array
    {
        if (! $caption || ! preg_match('/^ac_unit_(\d+)(?::(.*))?$/s', $caption, $matches)) {
            return null;
        }

        return [
            'unit_index' => (int) $matches[1],
            'caption' => array_key_exists(2, $matches) ? $matches[2] : null,
        ];
    }

    /**
     * Delete photo files from storage.
     */
    private function deletePhotos(array $photos): void
    {
        foreach ($photos as $photo) {
            $this->deleteStoredPhoto($photo);
        }
    }

    private function deleteStoredPhoto(string $path): void
    {
        $this->pdfImageOptimizer->deleteDerivatives($path);
        Storage::disk('public')->delete($path);
    }

    /**
     * Get per-unit AC photos grouped by entry index.
     * Returns array of [{before: [...], after: [...]}] for each unit.
     */
    private function getAcUnitPhotos(WorkReport $workReport): array
    {
        $presetData = $workReport->preset_data;
        if (empty($presetData) || ! is_array($presetData)) {
            return [];
        }

        $entryCount = count($presetData);
        $result = array_fill(0, $entryCount, ['before' => [], 'after' => []]);

        $workReport->loadMissing(['beforePhotoItems', 'afterPhotoItems']);

        foreach ([$workReport->beforePhotoItems, $workReport->afterPhotoItems] as $photos) {
            foreach ($photos as $photo) {
                $parsedCaption = $this->parseAcPhotoCaption($photo->caption);
                if (! $parsedCaption || $parsedCaption['unit_index'] >= $entryCount) {
                    continue;
                }

                $result[$parsedCaption['unit_index']][$photo->type][] = [
                    'id' => $photo->id,
                    'photo_url' => $photo->photo_url,
                    'caption' => $parsedCaption['caption'],
                ];
            }
        }

        return $result;
    }

    /**
     * Save per-unit AC photos from the request.
     * Photos are stored with caption format "ac_unit_{index}" to associate them with specific entries.
     */
    private function saveAcUnitPhotos(Request $request, WorkReport $workReport, bool $isUpdate = false): void
    {
        $presetData = $workReport->preset_data;
        if (empty($presetData) || ! is_array($presetData)) {
            return;
        }

        $entryCount = count($presetData);
        $newPhotoRows = [];

        if ($isUpdate) {
            $keptPhotoIds = [];
            for ($i = 0; $i < $entryCount; $i++) {
                foreach (["ac_existing_before_{$i}", "ac_existing_after_{$i}"] as $field) {
                    $ids = $request->input($field, []);
                    if (is_array($ids)) {
                        $keptPhotoIds = [...$keptPhotoIds, ...array_map('intval', $ids)];
                    }
                }
            }

            $photosToDelete = WorkReportPhoto::where('work_report_id', $workReport->id)
                ->where('caption', 'like', 'ac_unit_%')
                ->when($keptPhotoIds !== [], fn ($query) => $query->whereNotIn('id', $keptPhotoIds))
                ->get();

            foreach ($photosToDelete as $photo) {
                $this->deleteStoredPhoto($photo->photo_path);
            }

            if ($photosToDelete->isNotEmpty()) {
                WorkReportPhoto::whereKey($photosToDelete->modelKeys())->delete();
            }
        }

        for ($i = 0; $i < $entryCount; $i++) {
            // Save new before photos for this unit
            if ($request->hasFile("ac_photos_before_{$i}")) {
                $beforeCaptions = $request->input("ac_captions_before_{$i}", []);
                foreach ($request->file("ac_photos_before_{$i}") as $sortOrder => $photo) {
                    $path = $photo->store('work-reports/ac-units', 'public');
                    $this->pdfImageOptimizer->optimize($path);
                    $newPhotoRows[] = $this->buildAcPhotoRow(
                        $workReport,
                        WorkReportPhoto::TYPE_BEFORE,
                        $path,
                        $i,
                        $sortOrder,
                        $beforeCaptions[$sortOrder] ?? '',
                    );
                }
            }

            // Save new after photos for this unit
            if ($request->hasFile("ac_photos_after_{$i}")) {
                $afterCaptions = $request->input("ac_captions_after_{$i}", []);
                foreach ($request->file("ac_photos_after_{$i}") as $sortOrder => $photo) {
                    $path = $photo->store('work-reports/ac-units', 'public');
                    $this->pdfImageOptimizer->optimize($path);
                    $newPhotoRows[] = $this->buildAcPhotoRow(
                        $workReport,
                        WorkReportPhoto::TYPE_AFTER,
                        $path,
                        $i,
                        $sortOrder,
                        $afterCaptions[$sortOrder] ?? '',
                    );
                }
            }
        }

        if ($newPhotoRows !== []) {
            WorkReportPhoto::insert($newPhotoRows);
        }
    }
}
