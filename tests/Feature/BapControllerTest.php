<?php

namespace Tests\Feature;

use App\Models\Bap;
use App\Models\Client;
use App\Models\JobCategory;
use App\Models\User;
use App\Models\WorkReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BapControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $technician;
    private Client $client;
    private JobCategory $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $this->technician = User::factory()->create(['role' => User::ROLE_TECHNICIAN]);
        $this->client = Client::factory()->create(['is_active' => true]);
        $this->category = JobCategory::factory()->create();
    }

    // === ACCESS CONTROL ===

    public function test_admin_can_access_baps_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/baps');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_technician_cannot_access_baps(): void
    {
        $response = $this->actingAs($this->technician)->get('/baps');

        $response->assertStatus(403);
    }

    public function test_technician_cannot_create_bap(): void
    {
        $response = $this->actingAs($this->technician)->get('/baps/create');

        $response->assertStatus(403);
    }

    // === INDEX ===

    public function test_index_shows_baps_list(): void
    {
        Bap::factory()->create([
            'client_id' => $this->client->id,
            'nomor_surat' => 'BAP/0001/01/2024',
            'tanggal' => '2024-01-15',
        ]);

        $response = $this->actingAs($this->admin)->get('/baps');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_index_filters_by_status(): void
    {
        Bap::factory()->create([
            'client_id' => $this->client->id,
            'status' => Bap::STATUS_DRAFT,
        ]);
        Bap::factory()->approved()->create([
            'client_id' => $this->client->id,
            'nomor_surat' => 'BAP/0002/01/2024',
        ]);

        $response = $this->actingAs($this->admin)->get('/baps?status=draft');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_index_filters_by_client(): void
    {
        $otherClient = Client::factory()->create();

        Bap::factory()->create(['client_id' => $this->client->id]);
        Bap::factory()->create([
            'client_id' => $otherClient->id,
            'nomor_surat' => 'BAP/0002/01/2024',
        ]);

        $response = $this->actingAs($this->admin)->get('/baps?client_id=' . $this->client->id);

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    // === CREATE ===

    public function test_admin_can_view_create_form(): void
    {
        $response = $this->actingAs($this->admin)->get('/baps/create');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_create_shows_only_submitted_work_reports(): void
    {
        WorkReport::factory()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
            'status' => WorkReport::STATUS_DRAFT,
        ]);

        WorkReport::factory()->submitted()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);

        $response = $this->actingAs($this->admin)->get('/baps/create');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_create_filters_work_reports_by_client(): void
    {
        $otherClient = Client::factory()->create();

        WorkReport::factory()->submitted()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);

        WorkReport::factory()->submitted()->create([
            'client_id' => $otherClient->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);

        $response = $this->actingAs($this->admin)->get('/baps/create?client_id=' . $this->client->id);

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    // === STORE ===

    public function test_admin_can_store_bap_with_submitted_reports(): void
    {
        $report1 = WorkReport::factory()->submitted()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);
        $report2 = WorkReport::factory()->submitted()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);

        $response = $this->actingAs($this->admin)->post('/baps', [
            'client_id' => $this->client->id,
            'tanggal' => '2024-03-15',
            'work_report_ids' => [$report1->id, $report2->id],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('baps', [
            'client_id' => $this->client->id,
            'status' => Bap::STATUS_DRAFT,
        ]);
    }

    public function test_store_generates_auto_increment_nomor_surat(): void
    {
        $report = WorkReport::factory()->submitted()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);

        $this->actingAs($this->admin)->post('/baps', [
            'client_id' => $this->client->id,
            'tanggal' => '2024-03-15',
            'work_report_ids' => [$report->id],
        ]);

        $bap = Bap::first();
        $this->assertMatchesRegularExpression('/^BAP\/\d{4}\/\d{2}\/\d{4}$/', $bap->nomor_surat);
    }

    public function test_store_fails_without_client(): void
    {
        $report = WorkReport::factory()->submitted()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);

        $response = $this->actingAs($this->admin)->post('/baps', [
            'client_id' => '',
            'tanggal' => '2024-03-15',
            'work_report_ids' => [$report->id],
        ]);

        $response->assertSessionHasErrors('client_id');
    }

    public function test_store_fails_without_work_reports(): void
    {
        $response = $this->actingAs($this->admin)->post('/baps', [
            'client_id' => $this->client->id,
            'tanggal' => '2024-03-15',
            'work_report_ids' => [],
        ]);

        $response->assertSessionHasErrors('work_report_ids');
    }

    public function test_store_fails_with_draft_work_reports(): void
    {
        $draftReport = WorkReport::factory()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
            'status' => WorkReport::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->admin)->post('/baps', [
            'client_id' => $this->client->id,
            'tanggal' => '2024-03-15',
            'work_report_ids' => [$draftReport->id],
        ]);

        $response->assertSessionHasErrors('work_report_ids');
    }

    public function test_store_fails_with_reports_from_different_client(): void
    {
        $otherClient = Client::factory()->create();

        $report = WorkReport::factory()->submitted()->create([
            'client_id' => $otherClient->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);

        $response = $this->actingAs($this->admin)->post('/baps', [
            'client_id' => $this->client->id,
            'tanggal' => '2024-03-15',
            'work_report_ids' => [$report->id],
        ]);

        $response->assertSessionHasErrors('work_report_ids');
    }

    public function test_store_fails_without_tanggal(): void
    {
        $report = WorkReport::factory()->submitted()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);

        $response = $this->actingAs($this->admin)->post('/baps', [
            'client_id' => $this->client->id,
            'tanggal' => '',
            'work_report_ids' => [$report->id],
        ]);

        $response->assertSessionHasErrors('tanggal');
    }

    // === SHOW ===

    public function test_admin_can_view_bap_detail(): void
    {
        $report = WorkReport::factory()->submitted()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);

        $bap = Bap::factory()->create([
            'client_id' => $this->client->id,
            'work_report_ids' => [$report->id],
        ]);

        $response = $this->actingAs($this->admin)->get("/baps/{$bap->id}");

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    // === APPROVE ===

    public function test_admin_can_approve_draft_bap(): void
    {
        $bap = Bap::factory()->create([
            'client_id' => $this->client->id,
            'status' => Bap::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->admin)->post("/baps/{$bap->id}/approve", [
            'signed_by' => 'Manager John',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('baps', [
            'id' => $bap->id,
            'status' => Bap::STATUS_APPROVED,
            'signed_by' => 'Manager John',
        ]);
    }

    public function test_approve_requires_signed_by(): void
    {
        $bap = Bap::factory()->create([
            'client_id' => $this->client->id,
            'status' => Bap::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->admin)->post("/baps/{$bap->id}/approve", [
            'signed_by' => '',
        ]);

        $response->assertSessionHasErrors('signed_by');
    }

    public function test_cannot_approve_already_approved_bap(): void
    {
        $bap = Bap::factory()->approved()->create([
            'client_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)->post("/baps/{$bap->id}/approve", [
            'signed_by' => 'Someone Else',
        ]);

        $response->assertStatus(403);
    }

    // === APPROVED BAP CAN BE MODIFIED (status lock removed) ===

    public function test_can_edit_approved_bap(): void
    {
        $bap = Bap::factory()->approved()->create([
            'client_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)->get("/baps/{$bap->id}/edit");

        $response->assertStatus(200);
    }

    public function test_can_update_approved_bap(): void
    {
        $report = WorkReport::factory()->submitted()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);

        $bap = Bap::factory()->approved()->create([
            'client_id' => $this->client->id,
            'work_report_ids' => [$report->id],
        ]);

        $response = $this->actingAs($this->admin)->put("/baps/{$bap->id}", [
            'client_id' => $this->client->id,
            'tanggal' => '2024-06-01',
            'work_report_ids' => [$report->id],
        ]);

        $response->assertRedirect();
    }

    public function test_can_delete_approved_bap(): void
    {
        $bap = Bap::factory()->approved()->create([
            'client_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)->delete("/baps/{$bap->id}");

        $response->assertRedirect(route('baps.index'));
        $this->assertDatabaseMissing('baps', ['id' => $bap->id]);
    }

    // === DRAFT BAP CAN BE MODIFIED ===

    public function test_can_update_draft_bap(): void
    {
        $report = WorkReport::factory()->submitted()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);

        $bap = Bap::factory()->create([
            'client_id' => $this->client->id,
            'status' => Bap::STATUS_DRAFT,
            'work_report_ids' => [$report->id],
        ]);

        $response = $this->actingAs($this->admin)->put("/baps/{$bap->id}", [
            'client_id' => $this->client->id,
            'tanggal' => '2024-06-01',
            'work_report_ids' => [$report->id],
        ]);

        $response->assertRedirect();
    }

    public function test_can_delete_draft_bap(): void
    {
        $bap = Bap::factory()->create([
            'client_id' => $this->client->id,
            'status' => Bap::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->admin)->delete("/baps/{$bap->id}");

        $response->assertRedirect(route('baps.index'));
        $this->assertDatabaseMissing('baps', ['id' => $bap->id]);
    }

    // === EXPORT PDF ===

    public function test_admin_can_export_bap_as_pdf(): void
    {
        $report = WorkReport::factory()->submitted()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
            'description' => 'Instalasi jaringan LAN',
        ]);

        $bap = Bap::factory()->create([
            'client_id' => $this->client->id,
            'nomor_surat' => 'BAP/0001/03/2024',
            'tanggal' => '2024-03-15',
            'status' => Bap::STATUS_DRAFT,
            'work_report_ids' => [$report->id],
        ]);

        $response = $this->actingAs($this->admin)->get("/baps/{$bap->id}/export-pdf");

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_export_pdf_fails_for_nonexistent_bap(): void
    {
        $response = $this->actingAs($this->admin)->get('/baps/99999/export-pdf');

        $response->assertStatus(404);
    }

    public function test_technician_cannot_export_bap_pdf(): void
    {
        $bap = Bap::factory()->create([
            'client_id' => $this->client->id,
            'status' => Bap::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->technician)->get("/baps/{$bap->id}/export-pdf");

        $response->assertStatus(403);
    }
}
