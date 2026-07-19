<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBapRequest;
use App\Models\Bap;
use App\Models\Client;
use App\Models\WorkReport;
use App\Services\AcRecapAggregatorInterface;
use App\Services\BapNumberGeneratorInterface;
use App\Services\PdfExportServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class BapController extends Controller
{
    public function __construct(
        private BapNumberGeneratorInterface $numberGenerator,
        private PdfExportServiceInterface $pdfExportService,
        private AcRecapAggregatorInterface $acRecapAggregator
    ) {}

    /**
     * Display a listing of BAPs.
     */
    public function index(Request $request): Response
    {
        $query = Bap::with('client');

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filter by client
        if ($clientId = $request->input('client_id')) {
            $query->where('client_id', $clientId);
        }

        $baps = $query->latest()->paginate(10)->withQueryString();

        $clients = Client::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Baps/Index', [
            'baps' => $baps,
            'clients' => $clients,
            'filters' => [
                'status' => $request->input('status', ''),
                'client_id' => $request->input('client_id', ''),
            ],
        ]);
    }

    /**
     * Show the form for creating a new BAP.
     */
    public function create(Request $request): Response
    {
        $clients = Client::active()->select('id', 'name')->orderBy('name')->get();

        // Get submitted work reports, optionally filtered by client
        $workReportsQuery = WorkReport::with(['client', 'category'])
            ->where('status', WorkReport::STATUS_SUBMITTED);

        if ($clientId = $request->input('client_id')) {
            $workReportsQuery->where('client_id', $clientId);
        }

        $workReports = $workReportsQuery->latest()->get();

        return Inertia::render('Baps/Create', [
            'clients' => $clients,
            'workReports' => $workReports,
            'selectedClientId' => $request->input('client_id', ''),
        ]);
    }

    /**
     * Store a newly created BAP in storage.
     */
    public function store(StoreBapRequest $request): RedirectResponse
    {
        $tanggal = Carbon::parse($request->input('tanggal'));

        $nomorSurat = $this->numberGenerator->generate($tanggal);

        $bap = Bap::create([
            'nomor_surat' => $nomorSurat,
            'client_id' => $request->input('client_id'),
            'tanggal' => $tanggal,
            'status' => Bap::STATUS_DRAFT,
            'work_report_ids' => $request->input('work_report_ids'),
            'signed_by' => null,
        ]);

        return Redirect::route('baps.show', $bap->id)
            ->with('success', 'BAP berhasil dibuat.');
    }

    /**
     * Display the specified BAP.
     */
    public function show($id): Response
    {
        $bap = Bap::with('client')->findOrFail($id);

        // Load the related work reports with detail pekerjaan and photos
        $workReports = WorkReport::with(['client', 'category', 'technician', 'beforePhotoItems', 'afterPhotoItems'])
            ->whereIn('id', $bap->work_report_ids ?? [])
            ->get();

        // Aggregate AC recap data from work reports with AC preset category
        $acRecapRows = $this->acRecapAggregator->aggregate($workReports);

        return Inertia::render('Baps/Show', [
            'bap' => $bap,
            'workReports' => $workReports,
            'acRecapRows' => $acRecapRows,
        ]);
    }

    /**
     * Show the form for editing a BAP.
     */
    public function edit($id): Response
    {
        $bap = Bap::with('client')->findOrFail($id);

        // Status lock REMOVED - allow editing regardless of status

        $clients = Client::active()->select('id', 'name')->orderBy('name')->get();

        $workReportsQuery = WorkReport::with(['client', 'category'])
            ->where('status', WorkReport::STATUS_SUBMITTED);

        $workReports = $workReportsQuery->latest()->get();

        return Inertia::render('Baps/Edit', [
            'bap' => $bap,
            'clients' => $clients,
            'workReports' => $workReports,
        ]);
    }

    /**
     * Update the specified BAP in storage.
     */
    public function update(StoreBapRequest $request, $id): RedirectResponse
    {
        $bap = Bap::findOrFail($id);

        // Status lock REMOVED

        $bap->update([
            'client_id' => $request->input('client_id'),
            'tanggal' => Carbon::parse($request->input('tanggal')),
            'work_report_ids' => $request->input('work_report_ids'),
        ]);

        return Redirect::route('baps.show', $bap->id)
            ->with('success', 'BAP berhasil diperbarui.');
    }

    /**
     * Remove the specified BAP from storage.
     */
    public function destroy($id): RedirectResponse
    {
        $bap = Bap::findOrFail($id);

        // Status lock REMOVED

        $bap->delete();

        return Redirect::route('baps.index')
            ->with('success', 'BAP berhasil dihapus.');
    }

    /**
     * Approve a BAP.
     * Changes status to "approved" and records who signed it.
     * Approved BAPs cannot be modified.
     */
    public function approve(Request $request, $id): RedirectResponse
    {
        $bap = Bap::findOrFail($id);

        // Already approved - cannot modify
        if ($bap->status === Bap::STATUS_APPROVED) {
            abort(403, 'BAP yang sudah di-approve tidak dapat diubah.');
        }

        $request->validate([
            'signed_by' => ['required', 'string', 'max:255'],
        ]);

        $bap->update([
            'status' => Bap::STATUS_APPROVED,
            'signed_by' => $request->input('signed_by'),
        ]);

        return Redirect::route('baps.show', $bap->id)
            ->with('success', 'BAP berhasil di-approve.');
    }

    /**
     * Return BAP PDF inline for the application preview.
     */
    public function previewPdf($id)
    {
        $bap = Bap::findOrFail($id);

        return $this->pdfExportService->generateBapPdf($bap->id);
    }

    /**
     * Download BAP as PDF.
     */
    public function exportPdf($id)
    {
        $bap = Bap::findOrFail($id);

        return $this->pdfExportService->generateBapPdf($bap->id, true);
    }
}
