<?php

namespace App\Services;

use App\Models\Bast;

class BastNumberGenerator implements BastNumberGeneratorInterface
{
    /**
     * Generate nomor dokumen BAST.
     * Format: BAST/XXXX/MM/YYYY
     * XXXX = nomor urut 4 digit auto-increment per tahun, reset setiap tahun baru.
     */
    public function generate(\DateTimeInterface $date): string
    {
        $year = $date->format('Y');
        $month = $date->format('m');

        $lastBast = Bast::whereYear('tanggal', $year)
            ->orderByDesc('document_number')
            ->first();

        $nextNumber = 1;

        if ($lastBast) {
            // Extract the XXXX portion (positions 5-8, after "BAST/")
            $nextNumber = (int) substr($lastBast->document_number, 5, 4) + 1;
        }

        return sprintf('BAST/%04d/%s/%s', $nextNumber, $month, $year);
    }
}
