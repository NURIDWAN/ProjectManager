<?php

namespace Tests\Unit;

use App\Models\Bast;
use Tests\TestCase;

class BastPdfViewTest extends TestCase
{
    public function test_bast_letter_keeps_party_signatures_without_internal_job_titles(): void
    {
        $bast = new Bast([
            'document_number' => 'BAST/0001/07/2026',
            'tanggal' => '2026-07-31',
        ]);

        $html = view('pdf.bast.surat', [
            'bast' => $bast,
            'client' => (object) ['name' => 'Hachi', 'address' => 'Jakarta'],
            'workItems' => [],
            'settings' => ['company_name' => 'PT Maju Jaya'],
        ])->render();

        $this->assertStringContainsString('Demikian Berita Acara Penyelesaian Pekerjaan', $html);
        $this->assertStringContainsString('<u>Pihak Pertama</u>', $html);
        $this->assertStringContainsString('<u>Pihak Kedua</u>', $html);
        $this->assertStringNotContainsString('Project Coordinator', $html);
        $this->assertStringNotContainsString('Maintenance Manager', $html);
        $this->assertStringNotContainsString('Operational Manager', $html);
        $this->assertStringNotContainsString('Chief Engineering', $html);
    }
}
