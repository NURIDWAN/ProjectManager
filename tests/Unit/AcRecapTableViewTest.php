<?php

namespace Tests\Unit;

use Tests\TestCase;

class AcRecapTableViewTest extends TestCase
{
    public function test_pdf_hides_ampere_group_when_all_ampere_values_are_empty(): void
    {
        $html = $this->renderTable([$this->row()]);

        $this->assertStringNotContainsString('>AMPERE<', $html);
    }

    public function test_pdf_only_renders_ampere_phases_that_have_data(): void
    {
        $html = $this->renderTable([
            $this->row([
                'ampere_before_r' => 2.1,
                'ampere_after_r' => 1.8,
            ]),
        ]);

        $this->assertStringContainsString('>AMPERE<', $html);
        $this->assertSame(2, substr_count($html, '>R</th>'));
        $this->assertStringNotContainsString('>S</th>', $html);
        $this->assertStringNotContainsString('>T</th>', $html);
    }

    public function test_pdf_uses_combined_populated_phases_across_multiple_rows(): void
    {
        $html = $this->renderTable([
            $this->row(['ampere_before_r' => 2.1, 'ampere_after_r' => 1.8]),
            $this->row(['no' => 2, 'ampere_before_s' => 2.2, 'ampere_after_s' => 1.9]),
        ]);

        $this->assertSame(2, substr_count($html, '>R</th>'));
        $this->assertSame(2, substr_count($html, '>S</th>'));
        $this->assertStringNotContainsString('>T</th>', $html);
    }

    private function renderTable(array $rows): string
    {
        return view('pdf.partials.ac-recap-table', [
            'acRecapRows' => $rows,
            'client' => (object) ['name' => 'Hachi'],
        ])->render();
    }

    private function row(array $overrides = []): array
    {
        return array_replace([
            'no' => 1,
            'tanggal' => '31/07/2026',
            'lokasi' => 'Lantai 1',
            'tipe_ac' => 'Splitduct',
            'merek' => 'Panasonic',
            'kapasitas' => 2,
            'suhu_before' => 30,
            'suhu_after' => 19.9,
            'ampere_before_r' => null,
            'ampere_before_s' => null,
            'ampere_before_t' => null,
            'ampere_after_r' => null,
            'ampere_after_s' => null,
            'ampere_after_t' => null,
            'freon_before' => 20,
            'freon_after' => 19,
            'keterangan' => null,
        ], $overrides);
    }
}
