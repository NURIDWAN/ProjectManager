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
    public function generateBapPdf(int $bapId): Response;

    /**
     * Generate PDF for an Invoice document.
     *
     * @param int $invoiceId
     * @return \Illuminate\Http\Response PDF download response
     */
    public function generateInvoicePdf(int $invoiceId): Response;
}
