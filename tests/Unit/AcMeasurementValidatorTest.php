<?php

namespace Tests\Unit;

use App\Services\AcMeasurementValidator;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AcMeasurementValidatorTest extends TestCase
{
    public function test_accepts_single_temperature_values_and_optional_freon(): void
    {
        $validated = app(AcMeasurementValidator::class)->validate([
            $this->validEntry([
                'suhu_before' => 25.5,
                'suhu_after' => 18.2,
                'freon_before' => null,
                'freon_after' => null,
            ]),
        ]);

        $this->assertSame(25.5, $validated[0]['suhu_before']);
        $this->assertSame(18.2, $validated[0]['suhu_after']);
        $this->assertNull($validated[0]['freon_before']);
        $this->assertNull($validated[0]['freon_after']);
    }

    public function test_normalizes_legacy_temperature_and_infers_ampere_count(): void
    {
        $entry = $this->validEntry();
        unset($entry['suhu_before'], $entry['suhu_after'], $entry['ampere_input_count']);
        $entry['suhu_before_r'] = 24;
        $entry['suhu_after_s'] = 17;
        $entry['ampere_before_t'] = 3.2;

        $validated = app(AcMeasurementValidator::class)->validate([$entry]);

        $this->assertSame(24, $validated[0]['suhu_before']);
        $this->assertSame(17, $validated[0]['suhu_after']);
        $this->assertSame(3, $validated[0]['ampere_input_count']);
    }

    public function test_clears_ampere_phases_above_selected_count(): void
    {
        $validated = app(AcMeasurementValidator::class)->validate([
            $this->validEntry([
                'ampere_input_count' => 1,
                'ampere_before_s' => 2.1,
                'ampere_before_t' => 3.1,
                'ampere_after_s' => 2.2,
                'ampere_after_t' => 3.2,
            ]),
        ]);

        $this->assertNull($validated[0]['ampere_before_s']);
        $this->assertNull($validated[0]['ampere_before_t']);
        $this->assertNull($validated[0]['ampere_after_s']);
        $this->assertNull($validated[0]['ampere_after_t']);
    }

    public function test_rejects_invalid_ampere_count(): void
    {
        $this->expectException(ValidationException::class);

        app(AcMeasurementValidator::class)->validate([
            $this->validEntry(['ampere_input_count' => 4]),
        ]);
    }

    public function test_rejects_freon_outside_allowed_range(): void
    {
        $this->expectException(ValidationException::class);

        app(AcMeasurementValidator::class)->validate([
            $this->validEntry(['freon_before' => 801]),
        ]);
    }

    private function validEntry(array $overrides = []): array
    {
        return array_replace([
            'lokasi' => 'Ruang Server',
            'tipe_ac' => 'Cassette',
            'merek' => 'Daikin',
            'kapasitas' => 2,
            'suhu_before' => null,
            'suhu_after' => null,
            'ampere_input_count' => 1,
            'ampere_before_r' => null,
            'ampere_before_s' => null,
            'ampere_before_t' => null,
            'ampere_after_r' => null,
            'ampere_after_s' => null,
            'ampere_after_t' => null,
            'freon_before' => null,
            'freon_after' => null,
            'keterangan' => null,
        ], $overrides);
    }
}
