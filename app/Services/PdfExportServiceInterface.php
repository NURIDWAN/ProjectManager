<?php

namespace App\Services;

use Illuminate\Http\Response;

interface PdfExportServiceInterface
{
    /**
     * Generate PDF for a BAP document.
     *
     * @param int $bapId
     * @return \Illuminate\Http\Response PDF download response
     */
    public function generateBapPdf(int $bapId, bool $download = false): Response;

    /**
     * Generate PDF for an Invoice document.
     *
     * @param int $invoiceId
     * @return \Illuminate\Http\Response PDF download response
     */
    public function generateInvoicePdf(int $invoiceId, bool $download = false): Response;

    /**
     * Generate PDF for a BAST document.
     *
     * @param int $bastId
     * @return \Symfony\Component\HttpFoundation\Response PDF download response
     */
    public function generateBastPdf(int $bastId, bool $download = false): \Symfony\Component\HttpFoundation\Response;
}
