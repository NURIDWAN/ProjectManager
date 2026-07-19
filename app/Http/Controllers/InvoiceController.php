<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInvoiceRequest;
use App\Models\Client;
use App\Models\CompanySetting;
use App\Models\Invoice;
use App\Models\Service;
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
     * Linked directly to a client (not BAP).
     */
    public function create(Request $request): Response
    {
        $clients = Client::select('id', 'name', 'address', 'pic_name', 'npwp')->orderBy('name')->get();
        $services = Service::active()->orderBy('name')->get();
        $settings = CompanySetting::allSettings();

        return Inertia::render('Invoices/Create', [
            'clients' => $clients,
            'services' => $services,
            'settings' => $settings,
        ]);
    }

    /**
     * Store a newly created invoice in storage.
     */
    public function store(StoreInvoiceRequest $request): RedirectResponse
    {
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
        $discountTotal = (float) ($request->input('discount_total') ?? 0);
        $taxPercent = (float) ($request->input('tax_percent') ?? 11);
        $shippingCost = (float) ($request->input('shipping_cost') ?? 0);

        // Custom tax calculation: ppn = (subtotal - discountTotal) * (taxPercent / 100)
        $ppn = round(($subtotal - $discountTotal) * ($taxPercent / 100), 2);

        // Grand total = subtotal - discount + tax + shipping
        $grandTotal = round($subtotal - $discountTotal + $ppn + $shippingCost, 2);

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'bap_id' => null,
            'client_id' => $request->input('client_id'),
            'subtotal' => $subtotal,
            'discount_total' => $discountTotal,
            'tax_percent' => $taxPercent,
            'ppn' => $ppn,
            'shipping_cost' => $shippingCost,
            'grand_total' => $grandTotal,
            'status' => Invoice::STATUS_DRAFT,
            'due_date' => $request->input('due_date'),
            'paid_at' => null,
            'notes' => $request->input('notes'),
            'terms' => $request->input('terms'),
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
     * Show the form for editing the specified invoice.
     */
    public function edit($id): Response
    {
        $invoice = Invoice::with(['client', 'items.service'])->findOrFail($id);

        $clients = Client::select('id', 'name', 'address', 'pic_name', 'npwp')->orderBy('name')->get();
        $services = Service::active()->orderBy('name')->get();
        $settings = CompanySetting::allSettings();

        return Inertia::render('Invoices/Edit', [
            'invoice' => $invoice,
            'clients' => $clients,
            'services' => $services,
            'settings' => $settings,
        ]);
    }

    /**
     * Update the specified invoice in storage.
     */
    public function update(StoreInvoiceRequest $request, $id): RedirectResponse
    {
        $invoice = Invoice::findOrFail($id);

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
        $discountTotal = (float) ($request->input('discount_total') ?? 0);
        $taxPercent = (float) ($request->input('tax_percent') ?? 11);
        $shippingCost = (float) ($request->input('shipping_cost') ?? 0);

        $ppn = round(($subtotal - $discountTotal) * ($taxPercent / 100), 2);
        $grandTotal = round($subtotal - $discountTotal + $ppn + $shippingCost, 2);

        $invoice->update([
            'client_id' => $request->input('client_id'),
            'subtotal' => $subtotal,
            'discount_total' => $discountTotal,
            'tax_percent' => $taxPercent,
            'ppn' => $ppn,
            'shipping_cost' => $shippingCost,
            'grand_total' => $grandTotal,
            'due_date' => $request->input('due_date'),
            'notes' => $request->input('notes'),
            'terms' => $request->input('terms'),
        ]);

        // Sync items: delete existing and recreate
        $invoice->items()->delete();

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
            ->with('success', 'Invoice berhasil diperbarui.');
    }

    /**
     * Remove the specified invoice from storage.
     */
    public function destroy($id): RedirectResponse
    {
        $invoice = Invoice::findOrFail($id);

        // Cascade: delete items first, then invoice
        $invoice->items()->delete();
        $invoice->delete();

        return Redirect::route('invoices.index')
            ->with('success', 'Invoice berhasil dihapus.');
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
     * Return invoice PDF inline for the application preview.
     */
    public function previewPdf($id)
    {
        $invoice = Invoice::findOrFail($id);

        return $this->pdfExportService->generateInvoicePdf($invoice->id);
    }

    /**
     * Download invoice as PDF.
     */
    public function exportPdf($id)
    {
        $invoice = Invoice::findOrFail($id);

        return $this->pdfExportService->generateInvoicePdf($invoice->id, true);
    }
}
