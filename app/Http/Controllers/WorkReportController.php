<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkReportRequest;
use App\Models\Client;
use App\Models\JobCategory;
use App\Models\User;
use App\Models\WorkReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class WorkReportController extends Controller
{
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
        $categories = JobCategory::select('id', 'name')->orderBy('name')->get();

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

        $workReport = WorkReport::create([
            'client_id' => $request->input('client_id'),
            'category_id' => $request->input('category_id'),
            'technician_id' => $user->id,
            'description' => $request->input('description'),
            'status' => WorkReport::STATUS_DRAFT,
            'before_photos' => $beforePhotos ?: null,
            'after_photos' => $afterPhotos ?: null,
        ]);

        // If _submit flag is set, auto-submit the report
        if ($request->input('_submit')) {
            $afterPhotosForValidation = $workReport->after_photos;
            $canSubmit = $workReport->client_id
                && $workReport->category_id
                && $workReport->description
                && !empty($afterPhotosForValidation);

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

        $work_report->load(['client', 'category', 'technician']);

        return Inertia::render('WorkReports/Show', [
            'workReport' => $work_report,
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

        $clients = Client::active()->select('id', 'name')->orderBy('name')->get();
        $categories = JobCategory::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('WorkReports/Edit', [
            'workReport' => $work_report,
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

        // Handle photo uploads - merge with existing
        $existingBeforePhotos = $request->input('existing_before_photos', []);
        $existingAfterPhotos = $request->input('existing_after_photos', []);

        $newBeforePhotos = $this->uploadPhotos($request, 'before_photos');
        $newAfterPhotos = $this->uploadPhotos($request, 'after_photos');

        $beforePhotos = array_merge($existingBeforePhotos ?? [], $newBeforePhotos);
        $afterPhotos = array_merge($existingAfterPhotos ?? [], $newAfterPhotos);

        // Remove deleted photos from storage
        $this->cleanupRemovedPhotos(
            $work_report->before_photos ?? [],
            $beforePhotos
        );
        $this->cleanupRemovedPhotos(
            $work_report->after_photos ?? [],
            $afterPhotos
        );

        $work_report->update([
            'client_id' => $request->input('client_id'),
            'category_id' => $request->input('category_id'),
            'description' => $request->input('description'),
            'before_photos' => $beforePhotos ?: null,
            'after_photos' => $afterPhotos ?: null,
        ]);

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

        // Clean up photos from storage
        $this->deletePhotos($work_report->before_photos ?? []);
        $this->deletePhotos($work_report->after_photos ?? []);

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

        // Check at least 1 after photo exists
        $afterPhotos = $workReport->after_photos;
        if (empty($afterPhotos) || count($afterPhotos) === 0) {
            return Redirect::back()
                ->withErrors(['after_photos' => 'Minimal satu foto sesudah harus di-upload sebelum submit.'])
                ->with('error', 'Laporan tidak dapat disubmit. Upload minimal satu foto sesudah.');
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
}
