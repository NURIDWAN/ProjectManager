<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInvoiceRequest;
use App\Models\Bap;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Service;
use App\Models\WorkReport;
use App\Services\InvoiceCalculationServiceInterface;
use App\Services\InvoiceNumberGeneratorInterface;
use App\Services\PdfExportServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function __construct(
        private InvoiceCalculationServiceInterface $calculationService,
        private InvoiceNumberGeneratorInterface $numberGenerator,
        private PdfExportServiceInterface $pdfExportService
    ) {}

    /**
     * Display a listing of invoices.
     * Filterable by status and client.
     */
    public function index(Request $request): Response
    {
        $query = Invoice::with(['client', 'bap']);

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filter by client
        if ($clientId = $request->input('client_id')) {
            $query->where('client_id', $clientId);
        }

        $invoices = $query->latest()->paginate(10)->withQueryString();

        $clients = Client::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'clients' => $clients,
            'filters' => [
                'status' => $request->input('status', ''),
                'client_id' => $request->input('client_id', ''),
            ],
        ]);
    }

    /**
     * Show the form for creating a new invoice.
     * Auto-populates items from services related to the BAP's work report categories.
     */
    public function create(Request $request): Response
    {
        // Get approved BAPs that don't have an invoice yet
        $baps = Bap::with('client')
            ->where('status', Bap::STATUS_APPROVED)
            ->whereDoesntHave('invoice')
            ->latest()
            ->get();

        $suggestedItems = [];

        // If a bap_id is provided, auto-populate items
        if ($bapId = $request->input('bap_id')) {
            $bap = Bap::find($bapId);

            if ($bap) {
                $suggestedItems = $this->getAutoPopulatedItems($bap);
            }
        }

        $services = Service::active()->orderBy('name')->get();

        return Inertia::render('Invoices/Create', [
            'baps' => $baps,
            'suggestedItems' => $suggestedItems,
            'services' => $services,
            'selectedBapId' => $request->input('bap_id', ''),
        ]);
    }

    /**
     * Store a newly created invoice in storage.
     */
    public function store(StoreInvoiceRequest $request): RedirectResponse
    {
        $bap = Bap::findOrFail($request->input('bap_id'));

        $invoiceNumber = $this->numberGenerator->generate(Carbon::now());

        // Calculate totals from items
        $items = $request->input('items', []);
        $lineTotals = [];

        foreach ($items as $item) {
            $lineTotal = $this->calculationService->calculateLineTotal(
                (float) $item['quantity'],
                (float) $item['unit_price'],
                (float) ($item['discount_percent'] ?? 0)
            );
            $lineTotals[] = $lineTotal;
        }

        $subtotal = $this->calculationService->calculateSubtotal($lineTotals);
        $discountTotal = 0; // No overall discount at this level for now
        $ppn = $this->calculationService->calculatePpn($subtotal, $discountTotal);
        $grandTotal = $this->calculationService->calculateGrandTotal($subtotal, $discountTotal, $ppn);

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'bap_id' => $bap->id,
            'client_id' => $bap->client_id,
            'subtotal' => $subtotal,
            'discount_total' => $discountTotal,
            'ppn' => $ppn,
            'grand_total' => $grandTotal,
            'status' => Invoice::STATUS_DRAFT,
            'due_date' => null,
            'paid_at' => null,
        ]);

        // Create invoice items
        foreach ($items as $index => $item) {
            $invoice->items()->create([
                'service_id' => $item['service_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'discount_percent' => $item['discount_percent'] ?? 0,
                'line_total' => $lineTotals[$index],
            ]);
        }

        return Redirect::route('invoices.show', $invoice->id)
            ->with('success', 'Invoice berhasil dibuat.');
    }

    /**
     * Display the specified invoice.
     */
    public function show($id): Response
    {
        $invoice = Invoice::with(['client', 'bap', 'items.service'])->findOrFail($id);

        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Mark invoice as unpaid.
     * Requires due_date. Transitions from draft → unpaid.
     */
    public function markUnpaid(Request $request, $id): RedirectResponse
    {
        $invoice = Invoice::findOrFail($id);

        // Only draft invoices can be marked as unpaid
        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            abort(422, 'Hanya invoice berstatus "draft" yang dapat diubah ke "unpaid".');
        }

        $request->validate([
            'due_date' => ['required', 'date', 'after_or_equal:today'],
        ], [
            'due_date.required' => 'Tanggal jatuh tempo wajib diisi.',
            'due_date.date' => 'Format tanggal jatuh tempo tidak valid.',
            'due_date.after_or_equal' => 'Tanggal jatuh tempo harus hari ini atau setelahnya.',
        ]);

        $invoice->update([
            'status' => Invoice::STATUS_UNPAID,
            'due_date' => $request->input('due_date'),
        ]);

        return Redirect::route('invoices.show', $invoice->id)
            ->with('success', 'Invoice berhasil diubah ke status "unpaid".');
    }

    /**
     * Mark invoice as paid.
     * Transitions from unpaid/overdue → paid.
     * Records paid_at timestamp.
     */
    public function markPaid(Request $request, $id): RedirectResponse
    {
        $invoice = Invoice::findOrFail($id);

        // Only unpaid or overdue invoices can be marked as paid
        if (!in_array($invoice->status, [Invoice::STATUS_UNPAID, Invoice::STATUS_OVERDUE])) {
            abort(422, 'Hanya invoice berstatus "unpaid" atau "overdue" yang dapat ditandai sebagai "paid".');
        }

        $invoice->update([
            'status' => Invoice::STATUS_PAID,
            'paid_at' => Carbon::now(),
        ]);

        return Redirect::route('invoices.show', $invoice->id)
            ->with('success', 'Invoice berhasil ditandai sebagai "paid".');
    }

    /**
     * Export invoice as PDF.
     */
    public function exportPdf($id)
    {
        $invoice = Invoice::with(['client', 'bap', 'items.service'])->findOrFail($id);

        return $this->pdfExportService->generateInvoicePdf($invoice->id);
    }

    /**
     * Auto-populate items from active services related to the BAP's work report categories.
     */
    private function getAutoPopulatedItems(Bap $bap): array
    {
        // Get work reports from BAP
        $workReportIds = $bap->work_report_ids ?? [];
        $workReports = WorkReport::whereIn('id', $workReportIds)->get();

        // Get unique category IDs from work reports
        $categoryIds = $workReports->pluck('category_id')->unique()->values()->toArray();

        // Get active services - since there's no direct pivot between categories and services,
        // we return all active services for the admin to select/adjust
        $services = Service::active()->orderBy('name')->get();

        return $services->map(function ($service) {
            return [
                'service_id' => $service->id,
                'service_name' => $service->name,
                'unit' => $service->unit,
                'quantity' => 1,
                'unit_price' => (float) $service->price,
                'discount_percent' => 0,
            ];
        })->toArray();
    }
}
