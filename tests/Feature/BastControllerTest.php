<?php

namespace Tests\Feature;

use App\Models\Bap;
use App\Models\Bast;
use App\Models\Client;
use App\Models\JobCategory;
use App\Models\User;
use App\Models\WorkReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BastControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_show_includes_current_ac_recap_and_work_report_data(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $technician = User::factory()->create(['role' => User::ROLE_TECHNICIAN]);
        $client = Client::factory()->create();
        $category = JobCategory::factory()->create([
            'preset_identifier' => 'ac_maintenance',
        ]);
        $report = WorkReport::factory()->submitted()->create([
            'client_id' => $client->id,
            'category_id' => $category->id,
            'technician_id' => $technician->id,
            'preset_data' => [[
                'lokasi' => 'Ruang Server',
                'tipe_ac' => 'Cassette',
                'merek' => 'Daikin',
                'kapasitas' => 2,
                'suhu_before' => 25,
                'suhu_after' => 18,
                'ampere_input_count' => 2,
                'ampere_before_r' => 2.1,
                'ampere_before_s' => 2.2,
                'ampere_before_t' => null,
                'ampere_after_r' => 1.8,
                'ampere_after_s' => 1.9,
                'ampere_after_t' => null,
                'freon_before' => 120,
                'freon_after' => null,
                'keterangan' => null,
            ]],
        ]);
        $bap = Bap::factory()->approved()->create([
            'client_id' => $client->id,
            'work_report_ids' => [$report->id],
        ]);
        $bast = Bast::create([
            'bap_id' => $bap->id,
            'document_number' => 'BAST/0001/07/2026',
            'tanggal' => '2026-07-31',
            'client_id' => $client->id,
            'work_items' => [],
        ]);

        $response = $this->actingAs($admin)->get("/basts/{$bast->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Basts/Show')
            ->has('workReports', 1)
            ->where('workReports.0.preset_data.0.lokasi', 'Ruang Server')
            ->has('acRecapRows', 1)
            ->where('acRecapRows.0.suhu_before', 25)
            ->where('acRecapRows.0.suhu_after', 18)
            ->where('acRecapRows.0.ampere_input_count', 2)
            ->where('acRecapRows.0.ampere_before_t', null)
            ->where('acRecapRows.0.freon_after', null)
        );
    }
}
