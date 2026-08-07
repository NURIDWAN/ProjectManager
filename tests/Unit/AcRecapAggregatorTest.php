<?php

namespace Tests\Unit;

use App\Models\JobCategory;
use App\Models\WorkReport;
use App\Services\AcRecapAggregator;
use Illuminate\Support\Collection;
use Tests\TestCase;

class AcRecapAggregatorTest extends TestCase
{
    public function test_aggregates_new_shape_and_leaves_unselected_measurements_empty(): void
    {
        $report = $this->reportWithPresetData([
            [
                'lokasi' => 'Lobby',
                'suhu_before' => 25,
                'suhu_after' => 18,
                'ampere_input_count' => 1,
                'ampere_before_r' => 2.1,
                'ampere_before_s' => 99,
                'freon_before' => 120,
                'freon_after' => null,
            ],
        ]);

        $rows = app(AcRecapAggregator::class)->aggregate(new Collection([$report]));

        $this->assertSame(25, $rows[0]['suhu_before']);
        $this->assertSame(18, $rows[0]['suhu_after']);
        $this->assertSame(1, $rows[0]['ampere_input_count']);
        $this->assertNull($rows[0]['ampere_before_s']);
        $this->assertSame(120, $rows[0]['freon_before']);
        $this->assertNull($rows[0]['freon_after']);
    }

    public function test_aggregates_legacy_shape_using_first_available_temperature_and_inferred_count(): void
    {
        $report = $this->reportWithPresetData([
            [
                'lokasi' => 'Lobby',
                'suhu_before_s' => 24,
                'suhu_after_r' => 17,
                'ampere_after_t' => 3.3,
            ],
        ]);

        $rows = app(AcRecapAggregator::class)->aggregate(new Collection([$report]));

        $this->assertSame(24, $rows[0]['suhu_before']);
        $this->assertSame(17, $rows[0]['suhu_after']);
        $this->assertSame(3, $rows[0]['ampere_input_count']);
    }

    private function reportWithPresetData(array $presetData): WorkReport
    {
        $category = new JobCategory(['preset_identifier' => 'ac_maintenance']);
        $report = new WorkReport([
            'preset_data' => $presetData,
            'submitted_at' => '2026-07-31 10:00:00',
        ]);
        $report->setRelation('category', $category);

        return $report;
    }
}
