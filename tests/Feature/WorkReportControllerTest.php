<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\JobCategory;
use App\Models\User;
use App\Models\WorkReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WorkReportControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $technician;
    private User $otherTechnician;
    private Client $client;
    private JobCategory $category;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $this->technician = User::factory()->create(['role' => User::ROLE_TECHNICIAN]);
        $this->otherTechnician = User::factory()->create(['role' => User::ROLE_TECHNICIAN]);
        $this->client = Client::factory()->create(['is_active' => true]);
        $this->category = JobCategory::factory()->create();
    }

    // === INDEX ===

    public function test_technician_can_view_own_reports_index(): void
    {
        WorkReport::factory()->create(['technician_id' => $this->technician->id]);
        WorkReport::factory()->create(['technician_id' => $this->otherTechnician->id]);

        $response = $this->actingAs($this->technician)->get('/work-reports');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('WorkReports/Index')
                ->has('workReports.data', 1)
        );
    }

    public function test_admin_can_view_all_reports(): void
    {
        WorkReport::factory()->create(['technician_id' => $this->technician->id]);
        WorkReport::factory()->create(['technician_id' => $this->otherTechnician->id]);

        $response = $this->actingAs($this->admin)->get('/work-reports');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('WorkReports/Index')
                ->has('workReports.data', 2)
        );
    }

    public function test_filter_by_status(): void
    {
        WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'status' => WorkReport::STATUS_DRAFT,
        ]);
        WorkReport::factory()->submitted()->create([
            'technician_id' => $this->technician->id,
        ]);

        $response = $this->actingAs($this->admin)->get('/work-reports?status=draft');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('WorkReports/Index')
                ->has('workReports.data', 1)
        );
    }

    public function test_filter_by_client(): void
    {
        $otherClient = Client::factory()->create();
        WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'client_id' => $this->client->id,
        ]);
        WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'client_id' => $otherClient->id,
        ]);

        $response = $this->actingAs($this->admin)->get("/work-reports?client_id={$this->client->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('WorkReports/Index')
                ->has('workReports.data', 1)
        );
    }

    // === CREATE ===

    public function test_technician_can_view_create_form(): void
    {
        $response = $this->actingAs($this->technician)->get('/work-reports/create');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('WorkReports/Create')
                ->has('clients')
                ->has('categories')
        );
    }

    public function test_create_form_only_shows_active_clients(): void
    {
        Client::factory()->create(['is_active' => false, 'name' => 'Inactive Client']);

        $response = $this->actingAs($this->technician)->get('/work-reports/create');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('WorkReports/Create')
                ->where('clients', function ($clients) {
                    foreach ($clients as $client) {
                        if ($client['name'] === 'Inactive Client') {
                            return false;
                        }
                    }
                    return true;
                })
        );
    }

    // === STORE ===

    public function test_technician_can_store_draft_with_minimal_data(): void
    {
        $response = $this->actingAs($this->technician)->post('/work-reports', [
            'client_id' => null,
            'category_id' => null,
            'description' => null,
        ]);

        $response->assertRedirect(route('work-reports.index'));
        $this->assertDatabaseHas('work_reports', [
            'technician_id' => $this->technician->id,
            'status' => 'draft',
        ]);
    }

    public function test_technician_can_store_draft_with_full_data(): void
    {
        $response = $this->actingAs($this->technician)->post('/work-reports', [
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'description' => 'Test description',
        ]);

        $response->assertRedirect(route('work-reports.index'));
        $this->assertDatabaseHas('work_reports', [
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'description' => 'Test description',
            'technician_id' => $this->technician->id,
            'status' => 'draft',
        ]);
    }

    public function test_store_with_photo_upload(): void
    {
        $photo = UploadedFile::fake()->image('before.jpg', 800, 600)->size(1024);

        $response = $this->actingAs($this->technician)->post('/work-reports', [
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'description' => 'Test',
            'before_photos' => [$photo],
        ]);

        $response->assertRedirect(route('work-reports.index'));

        $report = WorkReport::first();
        $this->assertNotNull($report->before_photos);
        $this->assertCount(1, $report->before_photos);
        Storage::disk('public')->assertExists($report->before_photos[0]);
    }

    public function test_store_rejects_invalid_photo_format(): void
    {
        $file = UploadedFile::fake()->create('document.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->technician)->post('/work-reports', [
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'description' => 'Test',
            'before_photos' => [$file],
        ]);

        $response->assertSessionHasErrors('before_photos.0');
    }

    public function test_store_rejects_photo_over_2mb(): void
    {
        $photo = UploadedFile::fake()->image('large.jpg')->size(3000);

        $response = $this->actingAs($this->technician)->post('/work-reports', [
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'description' => 'Test',
            'after_photos' => [$photo],
        ]);

        $response->assertSessionHasErrors('after_photos.0');
    }

    // === SHOW ===

    public function test_technician_can_view_own_report(): void
    {
        $report = WorkReport::factory()->create(['technician_id' => $this->technician->id]);

        $response = $this->actingAs($this->technician)->get("/work-reports/{$report->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('WorkReports/Show')
        );
    }

    public function test_technician_cannot_view_other_report(): void
    {
        $report = WorkReport::factory()->create(['technician_id' => $this->otherTechnician->id]);

        $response = $this->actingAs($this->technician)->get("/work-reports/{$report->id}");

        $response->assertStatus(403);
    }

    public function test_admin_can_view_any_report(): void
    {
        $report = WorkReport::factory()->create(['technician_id' => $this->technician->id]);

        $response = $this->actingAs($this->admin)->get("/work-reports/{$report->id}");

        $response->assertStatus(200);
    }

    // === EDIT ===

    public function test_technician_can_edit_own_draft_report(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'status' => WorkReport::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->technician)->get("/work-reports/{$report->id}/edit");

        $response->assertStatus(200);
    }

    public function test_technician_cannot_edit_submitted_report(): void
    {
        $report = WorkReport::factory()->submitted()->create([
            'technician_id' => $this->technician->id,
        ]);

        $response = $this->actingAs($this->technician)->get("/work-reports/{$report->id}/edit");

        $response->assertStatus(403);
    }

    public function test_technician_cannot_edit_other_technicians_report(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->otherTechnician->id,
        ]);

        $response = $this->actingAs($this->technician)->get("/work-reports/{$report->id}/edit");

        $response->assertStatus(403);
    }

    // === UPDATE ===

    public function test_technician_can_update_own_draft_report(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'status' => WorkReport::STATUS_DRAFT,
            'description' => 'Old description',
        ]);

        $response = $this->actingAs($this->technician)->put("/work-reports/{$report->id}", [
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'description' => 'New description',
            'existing_before_photos' => [],
            'existing_after_photos' => [],
        ]);

        $response->assertRedirect(route('work-reports.index'));
        $this->assertDatabaseHas('work_reports', [
            'id' => $report->id,
            'description' => 'New description',
        ]);
    }

    public function test_technician_cannot_update_submitted_report(): void
    {
        $report = WorkReport::factory()->submitted()->create([
            'technician_id' => $this->technician->id,
        ]);

        $response = $this->actingAs($this->technician)->put("/work-reports/{$report->id}", [
            'description' => 'Trying to edit',
        ]);

        $response->assertStatus(403);
    }

    // === DESTROY ===

    public function test_technician_can_delete_own_draft_report(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'status' => WorkReport::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->technician)->delete("/work-reports/{$report->id}");

        $response->assertRedirect(route('work-reports.index'));
        $this->assertDatabaseMissing('work_reports', ['id' => $report->id]);
    }

    public function test_technician_cannot_delete_submitted_report(): void
    {
        $report = WorkReport::factory()->submitted()->create([
            'technician_id' => $this->technician->id,
        ]);

        $response = $this->actingAs($this->technician)->delete("/work-reports/{$report->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('work_reports', ['id' => $report->id]);
    }

    public function test_technician_cannot_delete_other_technicians_report(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->otherTechnician->id,
        ]);

        $response = $this->actingAs($this->technician)->delete("/work-reports/{$report->id}");

        $response->assertStatus(403);
    }

    // === SUBMIT ===

    public function test_submit_succeeds_with_complete_data(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'description' => 'Complete description',
            'after_photos' => ['work-reports/photo1.jpg'],
            'status' => WorkReport::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->technician)->post("/work-reports/{$report->id}/submit");

        $response->assertRedirect(route('work-reports.index'));
        $this->assertDatabaseHas('work_reports', [
            'id' => $report->id,
            'status' => 'submitted',
        ]);
        // Verify submitted_at is set
        $report->refresh();
        $this->assertNotNull($report->submitted_at);
    }

    public function test_submit_fails_without_client(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'client_id' => null,
            'category_id' => $this->category->id,
            'description' => 'Test',
            'after_photos' => ['work-reports/photo1.jpg'],
            'status' => WorkReport::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->technician)->post("/work-reports/{$report->id}/submit");

        $response->assertSessionHasErrors('client_id');
        $this->assertDatabaseHas('work_reports', [
            'id' => $report->id,
            'status' => 'draft',
        ]);
    }

    public function test_submit_fails_without_category(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'client_id' => $this->client->id,
            'category_id' => null,
            'description' => 'Test',
            'after_photos' => ['work-reports/photo1.jpg'],
            'status' => WorkReport::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->technician)->post("/work-reports/{$report->id}/submit");

        $response->assertSessionHasErrors('category_id');
    }

    public function test_submit_fails_without_description(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'description' => null,
            'after_photos' => ['work-reports/photo1.jpg'],
            'status' => WorkReport::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->technician)->post("/work-reports/{$report->id}/submit");

        $response->assertSessionHasErrors('description');
    }

    public function test_submit_fails_without_after_photos(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'description' => 'Test description',
            'after_photos' => null,
            'status' => WorkReport::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->technician)->post("/work-reports/{$report->id}/submit");

        $response->assertSessionHasErrors('after_photos');
    }

    public function test_submit_fails_with_empty_after_photos_array(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'description' => 'Test description',
            'after_photos' => [],
            'status' => WorkReport::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->technician)->post("/work-reports/{$report->id}/submit");

        $response->assertSessionHasErrors('after_photos');
    }

    public function test_technician_cannot_submit_other_technicians_report(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->otherTechnician->id,
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'description' => 'Test',
            'after_photos' => ['work-reports/photo1.jpg'],
            'status' => WorkReport::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->technician)->post("/work-reports/{$report->id}/submit");

        $response->assertStatus(403);
    }

    // === DATA ISOLATION ===

    public function test_technician_only_sees_own_reports_in_index(): void
    {
        WorkReport::factory()->count(3)->create(['technician_id' => $this->technician->id]);
        WorkReport::factory()->count(2)->create(['technician_id' => $this->otherTechnician->id]);

        $response = $this->actingAs($this->technician)->get('/work-reports');

        $response->assertInertia(fn ($page) =>
            $page->has('workReports.data', 3)
        );
    }
}
