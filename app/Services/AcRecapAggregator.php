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

                $ampereInputCount = $this->resolveAmpereInputCount($entry);
                $rows[] = [
                    'no' => $sequentialNumber,
                    'tanggal' => $tanggal,
                    'lokasi' => $entry['lokasi'] ?? '',
                    'tipe_ac' => $entry['tipe_ac'] ?? '',
                    'merek' => $entry['merek'] ?? '',
                    'kapasitas' => $entry['kapasitas'] ?? 0,
                    'suhu_before' => $this->resolveTemperature($entry, 'before'),
                    'suhu_after' => $this->resolveTemperature($entry, 'after'),
                    'ampere_input_count' => $ampereInputCount,
                    'ampere_before_r' => $entry['ampere_before_r'] ?? null,
                    'ampere_before_s' => $ampereInputCount >= 2 ? ($entry['ampere_before_s'] ?? null) : null,
                    'ampere_before_t' => $ampereInputCount >= 3 ? ($entry['ampere_before_t'] ?? null) : null,
                    'ampere_after_r' => $entry['ampere_after_r'] ?? null,
                    'ampere_after_s' => $ampereInputCount >= 2 ? ($entry['ampere_after_s'] ?? null) : null,
                    'ampere_after_t' => $ampereInputCount >= 3 ? ($entry['ampere_after_t'] ?? null) : null,
                    'freon_before' => $entry['freon_before'] ?? null,
                    'freon_after' => $entry['freon_after'] ?? null,
                    'keterangan' => $entry['keterangan'] ?? null,
                ];

                $sequentialNumber++;
            }
        }

        return $rows;
    }

    private function resolveTemperature(array $entry, string $timing): mixed
    {
        $newKey = "suhu_{$timing}";
        if (array_key_exists($newKey, $entry) && $entry[$newKey] !== '' && $entry[$newKey] !== null) {
            return $entry[$newKey];
        }

        foreach (['r', 's', 't'] as $phase) {
            $legacyKey = "{$newKey}_{$phase}";
            if (array_key_exists($legacyKey, $entry) && $entry[$legacyKey] !== '' && $entry[$legacyKey] !== null) {
                return $entry[$legacyKey];
            }
        }

        return null;
    }

    private function resolveAmpereInputCount(array $entry): int
    {
        $count = (int) ($entry['ampere_input_count'] ?? 0);
        if (in_array($count, [1, 2, 3], true)) {
            return $count;
        }

        foreach (['t' => 3, 's' => 2, 'r' => 1] as $phase => $inferredCount) {
            if (($entry["ampere_before_{$phase}"] ?? null) !== null && ($entry["ampere_before_{$phase}"] ?? '') !== ''
                || ($entry["ampere_after_{$phase}"] ?? null) !== null && ($entry["ampere_after_{$phase}"] ?? '') !== '') {
                return $inferredCount;
            }
        }

        return 1;
    }
}
