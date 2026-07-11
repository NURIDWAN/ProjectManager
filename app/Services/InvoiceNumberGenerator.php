<?php

namespace App\Services;

use App\Models\Invoice;

class InvoiceNumberGenerator implements InvoiceNumberGeneratorInterface
{
    /**
     * Generate nomor invoice unik.
     * Format: INV/XXXX/MM/YYYY
     * XXXX = nomor urut 4 digit auto-increment per tahun, reset setiap tahun baru.
     */
    public function generate(\DateTimeInterface $date): string
    {
        $year = $date->format('Y');
        $month = $date->format('m');

        $lastInvoice = Invoice::whereYear('created_at', $year)
            ->orderByDesc('invoice_number')
            ->first();

        $nextNumber = 1;

        if ($lastInvoice) {
            // Extract the XXXX portion (positions 4-7, i.e. after "INV/")
            $nextNumber = (int) substr($lastInvoice->invoice_number, 4, 4) + 1;
        }

        return sprintf('INV/%04d/%s/%s', $nextNumber, $month, $year);
    }
}
