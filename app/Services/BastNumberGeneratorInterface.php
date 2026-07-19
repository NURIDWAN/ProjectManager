<?php

namespace App\Services;

interface BastNumberGeneratorInterface
{
    /**
     * Generate nomor dokumen BAST.
     * Format: BAST/XXXX/MM/YYYY
     * XXXX = nomor urut 4 digit auto-increment per tahun
     */
    public function generate(\DateTimeInterface $date): string;
}
