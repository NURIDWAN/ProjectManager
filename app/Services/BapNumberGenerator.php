<?php

namespace App\Services;

use App\Models\Bap;

class BapNumberGenerator implements BapNumberGeneratorInterface
{
    /**
     * Generate nomor surat BAP.
     * Format: BAP/XXXX/MM/YYYY
     * XXXX = nomor urut 4 digit auto-increment per tahun, reset setiap tahun baru.
     */
    public function generate(\DateTimeInterface $date): string
    {
        $year = $date->format('Y');
        $month = $date->format('m');

        $lastBap = Bap::whereYear('tanggal', $year)
            ->orderByDesc('nomor_surat')
            ->first();

        $nextNumber = 1;

        if ($lastBap) {
            // Extract the XXXX portion (positions 4-7, i.e. after "BAP/")
            $nextNumber = (int) substr($lastBap->nomor_surat, 4, 4) + 1;
        }

        return sprintf('BAP/%04d/%s/%s', $nextNumber, $month, $year);
    }
}
