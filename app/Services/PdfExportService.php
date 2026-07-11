<?php

namespace App\Services;

use App\Models\Bap;
use App\Models\Invoice;
use App\Models\WorkReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class PdfExportService implements PdfExportServiceInterface
{
    /**
     * Generate PDF for a BAP document.
     */
    public function generateBapPdf(int $bapId): Response
    {
        $bap = Bap::with('client')->findOrFail($bapId);

        $workReports = WorkReport::with(['category', 'technician'])
            ->whereIn('id', $bap->work_report_ids ?? [])
            ->get();

        $pdf = Pdf::loadView('pdf.bap', [
            'bap' => $bap,
            'client' => $bap->client,
            'workReports' => $workReports,
        ]);

        $pdf->setPaper('A4', 'portrait');

        $filename = 'BAP_' . str_replace('/', '-', $bap->nomor_surat) . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Generate PDF for an Invoice document.
     */
    public function generateInvoicePdf(int $invoiceId): Response
    {
        $invoice = Invoice::with(['client', 'bap', 'items.service'])->findOrFail($invoiceId);

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'client' => $invoice->client,
            'items' => $invoice->items,
        ]);

        $pdf->setPaper('A4', 'portrait');

        $filename = 'Invoice_' . str_replace('/', '-', $invoice->invoice_number) . '.pdf';

        return $pdf->download($filename);
    }
}
