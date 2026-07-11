<?php

namespace App\Services;

interface BapNumberGeneratorInterface
{
    /**
     * Generate nomor surat BAP.
     * Format: BAP/XXXX/MM/YYYY
     * XXXX = nomor urut 4 digit auto-increment per tahun
     */
    public function generate(\DateTimeInterface $date): string;
}
