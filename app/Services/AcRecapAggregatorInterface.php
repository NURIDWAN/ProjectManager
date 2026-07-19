<?php

namespace App\Services;

use Illuminate\Support\Collection;

interface AcRecapAggregatorInterface
{
    /**
     * Aggregate AC measurement entries from a collection of work reports.
     * Filters to only AC-category reports with valid preset_data.
     * Orders by work report date ascending, then entry order.
     * Returns a flat array of rows with sequential numbering.
     *
     * @param Collection $workReports Collection of WorkReport models (with category loaded)
     * @return array Array of aggregated row data with keys: no, tanggal, lokasi, tipe_ac, merek, kapasitas, suhu_before_r/s/t, suhu_after_r/s/t, ampere_before_r/s/t, ampere_after_r/s/t, freon_before, freon_after, keterangan
     */
    public function aggregate(Collection $workReports): array;
}
