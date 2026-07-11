<?php

namespace App\Services;

interface InvoiceNumberGeneratorInterface
{
    /**
     * Generate nomor invoice unik.
     * Format: INV/XXXX/MM/YYYY
     * XXXX = nomor urut 4 digit auto-increment per tahun, reset setiap tahun baru.
     */
    public function generate(\DateTimeInterface $date): string;
}
