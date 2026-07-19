<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBastRequest;
use App\Models\Bap;
use App\Models\Bast;
use App\Models\Client;
use App\Models\WorkReport;
use App\Services\BastNumberGeneratorInterface;
use App\Services\PdfExportServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class BastController extends Controller
{
    public function __construct(
        private BastNumberGeneratorInterface $numberGenerator,
        private PdfExportServiceInterface $pdfExportService
    ) {}

    /**
     * Display a listing of BASTs.
     */
    public function index(Request $request): Response
    {
        $query = Bast::with(['client', 'bap']);

        // Filter by client
        if ($clientId = $request->input('client_id')) {
            $query->where('client_id', $clientId);
        }

        $basts = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        $clients = Client::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Basts/Index', [
            'basts' => $basts,
            'clients' => $clients,
            'filters' => [
                'client_id' => $request->input('client_id', ''),
            ],
        ]);
    }

    /**
     * Show the form for creating a new BAST.
     */
    public function create(Request $request): Response
    {
        // Load approved BAPs that don't already have a BAST
        $availableBaps = Bap::where('status', 'approved')
            ->doesntHave('bast')
            ->with('client')
            ->get();

        return Inertia::render('Basts/Create', [
            'availableBaps' => $availableBaps,
        ]);
    }

    /**
     * Store a newly created BAST in storage.
     */
    public function store(StoreBastRequest $request): RedirectResponse
    {
        $tanggal = Carbon::parse($request->input('tanggal'));

        $documentNumber = $this->numberGenerator->generate($tanggal);

        // Get client_id from the associated BAP
        $bap = Bap::findOrFail($request->input('bap_id'));

        // Normalize work items with sequential numbering
        $workItems = collect($request->input('work_items'))->values()->map(function ($item, $index) {
            return [
                'no' => $index + 1,
                'uraian_pekerjaan' => $item['uraian_pekerjaan'],
                'satuan' => $item['satuan'],
                'jumlah' => (int) $item['jumlah'],
                'keterangan' => $item['keterangan'] ?? '',
            ];
        })->toArray();

        $bast = Bast::create([
            'bap_id' => $bap->id,
            'document_number' => $documentNumber,
            'tanggal' => $tanggal,
            'client_id' => $bap->client_id,
            'work_items' => $workItems,
        ]);

        return Redirect::route('basts.show', $bast->id)
            ->with('success', 'BAST berhasil dibuat.');
    }

    /**
     * Display the specified BAST.
     */
    public function show($id): Response
    {
        $bast = Bast::with(['client', 'bap'])->findOrFail($id);

        // Load work reports from BAP's work_report_ids (if BAP exists)
        $workReports = [];
        if ($bast->bap) {
            $workReports = WorkReport::with(['client', 'category', 'technician', 'beforePhotoItems', 'afterPhotoItems'])
                ->whereIn('id', $bast->bap->work_report_ids ?? [])
                ->get();
        }

        // Use stored work items (manual input)
        $workItems = $bast->work_items ?? [];

        return Inertia::render('Basts/Show', [
            'bast' => $bast,
            'workReports' => $workReports,
            'workItems' => $workItems,
        ]);
    }

    /**
     * Show the form for editing the specified BAST.
     */
    public function edit($id): Response
    {
        $bast = Bast::with(['client', 'bap'])->findOrFail($id);

        // Load approved BAPs for selection (include current BAP even if no longer approved)
        $availableBaps = Bap::where('status', 'approved')
            ->doesntHave('bast')
            ->orWhere('id', $bast->bap_id)
            ->with('client')
            ->get();

        return Inertia::render('Basts/Edit', [
            'bast' => $bast,
            'availableBaps' => $availableBaps,
        ]);
    }

    /**
     * Update the specified BAST in storage.
     */
    public function update(StoreBastRequest $request, $id): RedirectResponse
    {
        $bast = Bast::findOrFail($id);

        $tanggal = Carbon::parse($request->input('tanggal'));
        $bap = Bap::findOrFail($request->input('bap_id'));

        // Normalize work items with sequential numbering
        $workItems = collect($request->input('work_items'))->values()->map(function ($item, $index) {
            return [
                'no' => $index + 1,
                'uraian_pekerjaan' => $item['uraian_pekerjaan'],
                'satuan' => $item['satuan'],
                'jumlah' => (int) $item['jumlah'],
                'keterangan' => $item['keterangan'] ?? '',
            ];
        })->toArray();

        $bast->update([
            'bap_id' => $bap->id,
            'tanggal' => $tanggal,
            'client_id' => $bap->client_id,
            'work_items' => $workItems,
        ]);

        return Redirect::route('basts.show', $bast->id)
            ->with('success', 'BAST berhasil diperbarui.');
    }

    /**
     * Remove the specified BAST from storage.
     * Does not delete the associated BAP.
     */
    public function destroy($id): RedirectResponse
    {
        $bast = Bast::findOrFail($id);

        $bast->delete();

        return Redirect::route('basts.index')
            ->with('success', 'BAST berhasil dihapus.');
    }

    /**
     * Return BAST PDF inline for the application preview.
     */
    public function previewPdf($id)
    {
        $bast = Bast::findOrFail($id);

        return $this->pdfExportService->generateBastPdf($bast->id);
    }

    /**
     * Download BAST as PDF.
     */
    public function exportPdf($id)
    {
        $bast = Bast::findOrFail($id);

        return $this->pdfExportService->generateBastPdf($bast->id, true);
    }

}
