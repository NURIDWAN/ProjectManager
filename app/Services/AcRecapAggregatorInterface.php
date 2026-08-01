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
     * @return array Array of aggregated rows using one before/after temperature,
     *               a 1-3 Ampere input count, optional R/S/T values, and optional Freon values.
     */
    public function aggregate(Collection $workReports): array;
}
