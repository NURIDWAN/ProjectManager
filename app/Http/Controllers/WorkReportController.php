<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkReportRequest;
use App\Models\Client;
use App\Models\JobCategory;
use App\Models\User;
use App\Models\WorkReport;
use App\Models\WorkReportPhoto;
use App\Services\AcMeasurementValidatorInterface;
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
    ) {}

    /**
     * Display a listing of work reports.
     * Technicians only see their own reports. Admin sees all.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $query = WorkReport::with(['client', 'category', 'technician']);

        // Technician data isolation: only see own reports
        if ($user->isTechnician()) {
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

        // Get clients for filter dropdown
        $clients = Client::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('WorkReports/Index', [
            'workReports' => $workReports,
            'clients' => $clients,
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
            if ($category->preset_identifier && !$this->presetRegistry->has($category->preset_identifier)) {
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
                    if (!empty($entries)) {
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

        foreach ($beforePhotos as $index => $path) {
            WorkReportPhoto::create([
                'work_report_id' => $workReport->id,
                'type' => WorkReportPhoto::TYPE_BEFORE,
                'photo_path' => $path,
                'caption' => $beforeCaptions[$index] ?? null,
                'sort_order' => $index,
            ]);
        }

        foreach ($afterPhotos as $index => $path) {
            WorkReportPhoto::create([
                'work_report_id' => $workReport->id,
                'type' => WorkReportPhoto::TYPE_AFTER,
                'photo_path' => $path,
                'caption' => $afterCaptions[$index] ?? null,
                'sort_order' => $index,
            ]);
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

        // Technician can only view their own reports
        if ($user->isTechnician() && $work_report->technician_id !== $user->id) {
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

        // Technician can only edit their own reports
        if ($user->isTechnician() && $work_report->technician_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses ke laporan ini.');
        }

        // Submitted reports cannot be edited by technician
        if ($user->isTechnician() && $work_report->status === WorkReport::STATUS_SUBMITTED) {
            abort(403, 'Laporan yang sudah disubmit tidak dapat diubah.');
        }

        $work_report->load(['beforePhotoItems', 'afterPhotoItems']);

        $clients = Client::active()->select('id', 'name')->orderBy('name')->get();
        $categories = JobCategory::select('id', 'name', 'preset_identifier')->orderBy('name')->get();

        // Validate preset identifiers against the registry and flag invalid ones
        $categories = $categories->map(function ($category) {
            $categoryArray = $category->toArray();
            if ($category->preset_identifier && !$this->presetRegistry->has($category->preset_identifier)) {
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

        // Technician can only update their own reports
        if ($user->isTechnician() && $work_report->technician_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses ke laporan ini.');
        }

        // Submitted reports cannot be edited by technician
        if ($user->isTechnician() && $work_report->status === WorkReport::STATUS_SUBMITTED) {
            abort(403, 'Laporan yang sudah disubmit tidak dapat diubah.');
        }

        // Handle existing photos to keep (IDs that the user chose to keep)
        $keepBeforePhotoIds = $request->input('existing_before_photos', []);
        $keepAfterPhotoIds = $request->input('existing_after_photos', []);

        // Delete removed photos from storage and DB
        $photosToRemove = $work_report->photos()
            ->whereNotIn('id', array_merge($keepBeforePhotoIds, $keepAfterPhotoIds))
            ->get();

        foreach ($photosToRemove as $photo) {
            Storage::disk('public')->delete($photo->photo_path);
            $photo->delete();
        }

        // Upload new photos
        $newBeforePhotos = $this->uploadPhotos($request, 'before_photos');
        $newAfterPhotos = $this->uploadPhotos($request, 'after_photos');

        $beforeCaptions = $request->input('before_captions', []);
        $afterCaptions = $request->input('after_captions', []);

        // Get current max sort_order for before/after
        $maxBeforeSort = $work_report->beforePhotoItems()->max('sort_order') ?? -1;
        $maxAfterSort = $work_report->afterPhotoItems()->max('sort_order') ?? -1;

        foreach ($newBeforePhotos as $index => $path) {
            WorkReportPhoto::create([
                'work_report_id' => $work_report->id,
                'type' => WorkReportPhoto::TYPE_BEFORE,
                'photo_path' => $path,
                'caption' => $beforeCaptions[$index] ?? null,
                'sort_order' => $maxBeforeSort + $index + 1,
            ]);
        }

        foreach ($newAfterPhotos as $index => $path) {
            WorkReportPhoto::create([
                'work_report_id' => $work_report->id,
                'type' => WorkReportPhoto::TYPE_AFTER,
                'photo_path' => $path,
                'caption' => $afterCaptions[$index] ?? null,
                'sort_order' => $maxAfterSort + $index + 1,
            ]);
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
                    if (!empty($entries)) {
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

        // Technician can only delete their own reports
        if ($user->isTechnician() && $work_report->technician_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses ke laporan ini.');
        }

        // Submitted reports cannot be deleted by technician
        if ($user->isTechnician() && $work_report->status === WorkReport::STATUS_SUBMITTED) {
            abort(403, 'Laporan yang sudah disubmit tidak dapat dihapus.');
        }

        // Clean up photos from storage (both legacy and new table)
        $this->deletePhotos($work_report->before_photos ?? []);
        $this->deletePhotos($work_report->after_photos ?? []);

        foreach ($work_report->photos as $photo) {
            Storage::disk('public')->delete($photo->photo_path);
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

        // Technician can only submit their own reports
        if ($user->isTechnician() && $workReport->technician_id !== $user->id) {
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

        if (!$isAcPreset) {
            $hasAfterPhotos = $workReport->afterPhotoItems()->exists();
            if (!$hasAfterPhotos) {
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
                $paths[] = $path;
            }
        }

        return $paths;
    }

    /**
     * Remove photos from storage that are no longer referenced.
     */
    private function cleanupRemovedPhotos(array $oldPhotos, array $newPhotos): void
    {
        $removedPhotos = array_diff($oldPhotos, $newPhotos);

        foreach ($removedPhotos as $photo) {
            Storage::disk('public')->delete($photo);
        }
    }

    /**
     * Delete photo files from storage.
     */
    private function deletePhotos(array $photos): void
    {
        foreach ($photos as $photo) {
            Storage::disk('public')->delete($photo);
        }
    }

    /**
     * Get per-unit AC photos grouped by entry index.
     * Returns array of [{before: [...], after: [...]}] for each unit.
     */
    private function getAcUnitPhotos(WorkReport $workReport): array
    {
        $presetData = $workReport->preset_data;
        if (empty($presetData) || !is_array($presetData)) {
            return [];
        }

        $entryCount = count($presetData);
        $result = [];

        for ($i = 0; $i < $entryCount; $i++) {
            $prefix = "ac_unit_{$i}";

            $beforePhotos = WorkReportPhoto::where('work_report_id', $workReport->id)
                ->where('type', WorkReportPhoto::TYPE_BEFORE)
                ->where('caption', 'LIKE', $prefix . '%')
                ->orderBy('sort_order')
                ->get()
                ->map(function ($p) use ($prefix) {
                    $userCaption = str_starts_with($p->caption, $prefix . ':')
                        ? substr($p->caption, strlen($prefix) + 1)
                        : null;
                    return ['id' => $p->id, 'photo_url' => $p->photo_url, 'caption' => $userCaption];
                })
                ->values()
                ->toArray();

            $afterPhotos = WorkReportPhoto::where('work_report_id', $workReport->id)
                ->where('type', WorkReportPhoto::TYPE_AFTER)
                ->where('caption', 'LIKE', $prefix . '%')
                ->orderBy('sort_order')
                ->get()
                ->map(function ($p) use ($prefix) {
                    $userCaption = str_starts_with($p->caption, $prefix . ':')
                        ? substr($p->caption, strlen($prefix) + 1)
                        : null;
                    return ['id' => $p->id, 'photo_url' => $p->photo_url, 'caption' => $userCaption];
                })
                ->values()
                ->toArray();

            $result[] = ['before' => $beforePhotos, 'after' => $afterPhotos];
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
        if (empty($presetData) || !is_array($presetData)) {
            return;
        }

        $entryCount = count($presetData);

        for ($i = 0; $i < $entryCount; $i++) {
            // On update: remove AC unit photos that are no longer kept
            if ($isUpdate) {
                $existingBeforeIds = [];
                $existingAfterIds = [];

                $rawBefore = $request->input("ac_existing_before_{$i}", []);
                if (is_array($rawBefore)) {
                    $existingBeforeIds = array_map('intval', $rawBefore);
                }
                $rawAfter = $request->input("ac_existing_after_{$i}", []);
                if (is_array($rawAfter)) {
                    $existingAfterIds = array_map('intval', $rawAfter);
                }

                // Delete AC unit photos not in the kept list
                $photosToDelete = WorkReportPhoto::where('work_report_id', $workReport->id)
                    ->where('caption', 'LIKE', "ac_unit_{$i}%")
                    ->whereNotIn('id', array_merge($existingBeforeIds, $existingAfterIds))
                    ->get();

                foreach ($photosToDelete as $photo) {
                    Storage::disk('public')->delete($photo->photo_path);
                    $photo->delete();
                }
            }

            // Save new before photos for this unit
            if ($request->hasFile("ac_photos_before_{$i}")) {
                $beforeCaptions = $request->input("ac_captions_before_{$i}", []);
                foreach ($request->file("ac_photos_before_{$i}") as $sortOrder => $photo) {
                    $path = $photo->store('work-reports/ac-units', 'public');
                    $userCaption = $beforeCaptions[$sortOrder] ?? '';
                    WorkReportPhoto::create([
                        'work_report_id' => $workReport->id,
                        'type' => WorkReportPhoto::TYPE_BEFORE,
                        'photo_path' => $path,
                        'caption' => "ac_unit_{$i}:" . $userCaption,
                        'sort_order' => $sortOrder,
                    ]);
                }
            }

            // Save new after photos for this unit
            if ($request->hasFile("ac_photos_after_{$i}")) {
                $afterCaptions = $request->input("ac_captions_after_{$i}", []);
                foreach ($request->file("ac_photos_after_{$i}") as $sortOrder => $photo) {
                    $path = $photo->store('work-reports/ac-units', 'public');
                    $userCaption = $afterCaptions[$sortOrder] ?? '';
                    WorkReportPhoto::create([
                        'work_report_id' => $workReport->id,
                        'type' => WorkReportPhoto::TYPE_AFTER,
                        'photo_path' => $path,
                        'caption' => "ac_unit_{$i}:" . $userCaption,
                        'sort_order' => $sortOrder,
                    ]);
                }
            }
        }
    }
}
