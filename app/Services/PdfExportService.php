<?php

namespace App\Services;

use App\Models\Bap;
use App\Models\Bast;
use App\Models\CompanySetting;
use App\Models\Invoice;
use App\Models\WorkReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class PdfExportService implements PdfExportServiceInterface
{
    public function __construct(
        private AcRecapAggregatorInterface $acRecapAggregator
    ) {}

    /**
     * Generate PDF for a BAP document.
     */
    public function generateBapPdf(int $bapId, bool $download = false): Response
    {
        $bap = Bap::with('client')->findOrFail($bapId);

        $workReports = WorkReport::with(['category', 'technician', 'beforePhotoItems', 'afterPhotoItems'])
            ->whereIn('id', $bap->work_report_ids ?? [])
            ->get();

        // Aggregate AC recap data from work reports with AC preset category
        $acRecapRows = $this->acRecapAggregator->aggregate($workReports);

        $settings = \App\Models\CompanySetting::allSettings();

        $pdf = Pdf::loadView('pdf.bap', [
            'bap' => $bap,
            'client' => $bap->client,
            'workReports' => $workReports,
            'acRecapRows' => $acRecapRows,
            'settings' => $settings,
        ]);

        $pdf->setPaper('A4', 'landscape');

        $filename = 'BAP_' . str_replace('/', '-', $bap->nomor_surat) . '.pdf';

        return $this->pdfResponse($pdf->output(), $filename, $download);
    }

    /**
     * Generate PDF for an Invoice document.
     */
    public function generateInvoicePdf(int $invoiceId, bool $download = false): Response
    {
        $invoice = Invoice::with(['client', 'bap', 'items.service'])->findOrFail($invoiceId);

        $settings = \App\Models\CompanySetting::allSettings();

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'client' => $invoice->client,
            'items' => $invoice->items,
            'settings' => $settings,
        ]);

        $pdf->setPaper('A4', 'portrait');

        $filename = 'Invoice_' . str_replace('/', '-', $invoice->invoice_number) . '.pdf';

        return $this->pdfResponse($pdf->output(), $filename, $download);
    }

    /**
     * Generate PDF for a BAST document.
     */
    public function generateBastPdf(int $bastId, bool $download = false): \Symfony\Component\HttpFoundation\Response
    {
        $bast = Bast::with(['client', 'bap'])->findOrFail($bastId);
        $bap = $bast->bap;

        // Load work reports from BAP's work_report_ids (if BAP exists)
        $workReports = collect();
        if ($bap) {
            $workReports = WorkReport::with(['category', 'technician', 'beforePhotoItems', 'afterPhotoItems'])
                ->whereIn('id', $bap->work_report_ids ?? [])
                ->get();
        }

        // Use stored manual work items
        $workItems = $bast->work_items ?? [];

        // AC recap rows (reuse existing aggregator)
        $acRecapRows = $this->acRecapAggregator->aggregate($workReports);

        $settings = CompanySetting::allSettings();

        // Render Blade templates
        $coverHtml = view('pdf.bast.cover', [
            'bast' => $bast,
            'client' => $bast->client,
            'settings' => $settings,
        ])->render();

        $suratHtml = view('pdf.bast.surat', [
            'bast' => $bast,
            'client' => $bast->client,
            'workItems' => $workItems,
            'settings' => $settings,
        ])->render();

        $laporanHtml = view('pdf.bast.laporan', [
            'bast' => $bast,
            'client' => $bast->client,
            'workReports' => $workReports,
            'acRecapRows' => $acRecapRows,
            'settings' => $settings,
        ])->render();

        // Generate Portrait PDF (Cover + Surat)
        $portraitHtml = view('pdf.bast.layout-portrait', [
            'bast' => $bast,
            'coverHtml' => $coverHtml,
            'suratHtml' => $suratHtml,
        ])->render();

        $portraitPdf = Pdf::loadHTML($portraitHtml);
        $portraitPdf->setPaper('A4', 'portrait');

        // Generate Landscape PDF (Laporan)
        $landscapeHtml = view('pdf.bast.layout-landscape', [
            'bast' => $bast,
            'laporanHtml' => $laporanHtml,
        ])->render();

        $landscapePdf = Pdf::loadHTML($landscapeHtml);
        $landscapePdf->setPaper('A4', 'landscape');

        // Save both to temp files
        $tempPortrait = tempnam(sys_get_temp_dir(), 'bast_portrait_') . '.pdf';
        $tempLandscape = tempnam(sys_get_temp_dir(), 'bast_landscape_') . '.pdf';

        file_put_contents($tempPortrait, $portraitPdf->output());
        file_put_contents($tempLandscape, $landscapePdf->output());

        // Merge using FPDI
        $merger = new \setasign\Fpdi\Fpdi();

        // Import portrait pages
        $pageCount = $merger->setSourceFile($tempPortrait);
        for ($i = 1; $i <= $pageCount; $i++) {
            $tplId = $merger->importPage($i);
            $size = $merger->getTemplateSize($tplId);
            $merger->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $merger->useTemplate($tplId);
        }

        // Import landscape pages
        $pageCount = $merger->setSourceFile($tempLandscape);
        for ($i = 1; $i <= $pageCount; $i++) {
            $tplId = $merger->importPage($i);
            $size = $merger->getTemplateSize($tplId);
            $merger->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $merger->useTemplate($tplId);
        }

        // Clean up temp files
        @unlink($tempPortrait);
        @unlink($tempLandscape);

        $filename = 'BAST_' . str_replace('/', '-', $bast->document_number) . '.pdf';

        return $this->pdfResponse($merger->Output('S'), $filename, $download);
    }

    private function pdfResponse(string $content, string $filename, bool $download): Response
    {
        return response($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => ($download ? 'attachment' : 'inline') . '; filename="' . $filename . '"',
            'Cache-Control' => 'private, no-store, max-age=0',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

}
