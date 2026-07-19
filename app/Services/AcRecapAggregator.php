<?php

namespace App\Services;

use Illuminate\Support\Collection;

class AcRecapAggregator implements AcRecapAggregatorInterface
{
    /**
     * Aggregate AC measurement entries from a collection of work reports.
     * Filters to only AC-category reports with valid preset_data.
     * Orders by work report date ascending, then entry order.
     * Returns a flat array of rows with sequential numbering.
     *
     * @param Collection $workReports Collection of WorkReport models (with category loaded)
     * @return array Array of aggregated row data
     */
    public function aggregate(Collection $workReports): array
    {
        $acReports = $workReports
            ->filter(function ($report) {
                // Only include reports with AC preset category
                if (!$report->relationLoaded('category') || !$report->category) {
                    return false;
                }

                if ($report->category->preset_identifier !== 'ac_maintenance') {
                    return false;
                }

                // Exclude reports with null/empty/malformed preset_data
                $presetData = $report->preset_data;

                if (is_null($presetData) || !is_array($presetData) || empty($presetData)) {
                    return false;
                }

                return true;
            })
            ->sortBy(function ($report) {
                // Order by work report date ascending
                return $report->submitted_at
                    ? $report->submitted_at->timestamp
                    : 0;
            })
            ->values();

        $rows = [];
        $sequentialNumber = 1;

        foreach ($acReports as $report) {
            $tanggal = $report->submitted_at
                ? $report->submitted_at->format('d/m/Y')
                : '';

            foreach ($report->preset_data as $entry) {
                // Skip malformed entries (must be arrays with required fields)
                if (!is_array($entry)) {
                    continue;
                }

                $rows[] = [
                    'no' => $sequentialNumber,
                    'tanggal' => $tanggal,
                    'lokasi' => $entry['lokasi'] ?? '',
                    'tipe_ac' => $entry['tipe_ac'] ?? '',
                    'merek' => $entry['merek'] ?? '',
                    'kapasitas' => $entry['kapasitas'] ?? 0,
                    'suhu_before_r' => $entry['suhu_before_r'] ?? 0,
                    'suhu_before_s' => $entry['suhu_before_s'] ?? 0,
                    'suhu_before_t' => $entry['suhu_before_t'] ?? 0,
                    'suhu_after_r' => $entry['suhu_after_r'] ?? 0,
                    'suhu_after_s' => $entry['suhu_after_s'] ?? 0,
                    'suhu_after_t' => $entry['suhu_after_t'] ?? 0,
                    'ampere_before_r' => $entry['ampere_before_r'] ?? 0,
                    'ampere_before_s' => $entry['ampere_before_s'] ?? 0,
                    'ampere_before_t' => $entry['ampere_before_t'] ?? 0,
                    'ampere_after_r' => $entry['ampere_after_r'] ?? 0,
                    'ampere_after_s' => $entry['ampere_after_s'] ?? 0,
                    'ampere_after_t' => $entry['ampere_after_t'] ?? 0,
                    'freon_before' => $entry['freon_before'] ?? 0,
                    'freon_after' => $entry['freon_after'] ?? 0,
                    'keterangan' => $entry['keterangan'] ?? null,
                ];

                $sequentialNumber++;
            }
        }

        return $rows;
    }
}
