<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WorkReport;
use App\Models\WorkReportPhoto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WorkReportAutosaveTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $technician;

    private User $otherTechnician;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $this->technician = User::factory()->create(['role' => User::ROLE_TECHNICIAN]);
        $this->otherTechnician = User::factory()->create(['role' => User::ROLE_TECHNICIAN]);
        $this->staff = User::factory()->create(['role' => User::ROLE_STAFF]);
    }

    // === AUTOSAVE: CREATE ===

    public function test_autosave_creates_new_draft_and_returns_id(): void
    {
        $response = $this->actingAs($this->technician)->postJson('/work-reports/autosave', [
            'description' => 'Pengecekan AC lantai 1',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['id', 'status', 'saved_at'])
            ->assertJsonPath('status', 'draft');

        $report = WorkReport::find($response->json('id'));
        $this->assertNotNull($report);
        $this->assertEquals($this->technician->id, $report->technician_id);
        $this->assertEquals(WorkReport::STATUS_DRAFT, $report->status);
        $this->assertEquals('Pengecekan AC lantai 1', $report->description);
    }

    public function test_autosave_can_create_completely_empty_draft(): void
    {
        $response = $this->actingAs($this->technician)->postJson('/work-reports/autosave', []);

        $response->assertStatus(200);
        $report = WorkReport::find($response->json('id'));
        $this->assertNull($report->client_id);
        $this->assertNull($report->description);
    }

    public function test_autosave_updates_existing_draft_with_id(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
            'description' => 'Versi awal',
        ]);

        $response = $this->actingAs($this->technician)->postJson('/work-reports/autosave', [
            'id' => $report->id,
            'description' => 'Versi tersimpan otomatis',
        ]);

        $response->assertStatus(200);
        $report->refresh();
        $this->assertEquals('Versi tersimpan otomatis', $report->description);
        $this->assertEquals(WorkReport::STATUS_DRAFT, $report->status);
        $this->assertCount(1, WorkReport::all());
    }

    // === AUTOSAVE: AUTHORIZATION ===

    public function test_any_operator_can_collaborate_on_other_technicians_draft(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->otherTechnician->id,
            'description' => 'draft awal',
        ]);

        // Open collaboration: any operator can autosave any draft
        $response = $this->actingAs($this->technician)->postJson('/work-reports/autosave', [
            'id' => $report->id,
            'description' => 'dilanjutkan teknisi lain',
        ]);

        $response->assertStatus(200);
        $report->refresh();
        $this->assertEquals('dilanjutkan teknisi lain', $report->description);
        // Ownership stays with the original creator
        $this->assertEquals($this->otherTechnician->id, $report->technician_id);
    }

    public function test_autosave_cannot_update_submitted_report(): void
    {
        $report = WorkReport::factory()->create([
            'technician_id' => $this->technician->id,
        ])->refresh();
        $report->update(['status' => WorkReport::STATUS_SUBMITTED, 'submitted_at' => now()]);

        $response = $this->actingAs($this->technician)->postJson('/work-reports/autosave', [
            'id' => $report->id,
            'description' => 'ubah setelah submit',
        ]);

        $response->assertStatus(403);
        $report->refresh();
        $this->assertNotEquals('ubah setelah submit', $report->description);
    }

    public function test_admin_can_autosave_own_draft(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/work-reports/autosave', [
            'description' => 'draft admin',
        ]);

        $response->assertStatus(200);
        $report = WorkReport::find($response->json('id'));
        $this->assertEquals($this->admin->id, $report->technician_id);
    }

    // === AUTOSAVE: PRESET DATA ===

    public function test_autosave_saves_partial_ac_data(): void
    {
        $category = \App\Models\JobCategory::factory()->create([
            'preset_identifier' => 'ac_maintenance',
        ]);

        // Half-filled AC entry: user is still typing. Autosave must succeed.
        $response = $this->actingAs($this->technician)->postJson('/work-reports/autosave', [
            'category_id' => $category->id,
            'preset_data' => json_encode([
                ['lokasi' => 'Ruang Meeting', 'tipe_ac' => 'Splitwall'],
            ]),
        ]);

        $response->assertStatus(200);
        $report = WorkReport::find($response->json('id'));
        $this->assertNotNull($report);

        $saved = is_string($report->preset_data)
            ? json_decode($report->preset_data, true)
            : $report->preset_data;
        $this->assertCount(1, $saved);
        $this->assertEquals('Ruang Meeting', $saved[0]['lokasi']);
    }

    public function test_autosave_saves_ac_data_with_empty_optional_fields(): void
    {
        $category = \App\Models\JobCategory::factory()->create([
            'preset_identifier' => 'ac_maintenance',
        ]);

        // Empty strings (what the form sends for untouched inputs) must not fail.
        $response = $this->actingAs($this->technician)->postJson('/work-reports/autosave', [
            'category_id' => $category->id,
            'preset_data' => json_encode([
                [
                    'lokasi' => 'Lobby',
                    'tipe_ac' => '',
                    'merek' => '',
                    'kapasitas' => '',
                    'suhu_before' => '',
                    'ampere_input_count' => '',
                ],
            ]),
        ]);

        $response->assertStatus(200);
        $report = WorkReport::find($response->json('id'));
        $this->assertNotNull($report);
    }

    public function test_autosave_still_rejects_malformed_ac_data(): void
    {
        $category = \App\Models\JobCategory::factory()->create([
            'preset_identifier' => 'ac_maintenance',
        ]);

        // Partial is fine, but a provided value must still be well-formed.
        $response = $this->actingAs($this->technician)->postJson('/work-reports/autosave', [
            'category_id' => $category->id,
            'preset_data' => json_encode([
                ['lokasi' => 'Ruang Server', 'kapasitas' => 'bukan-angka'],
            ]),
        ]);

        $response->assertStatus(422);
    }

    public function test_autosave_still_rejects_unknown_ac_type(): void
    {
        $category = \App\Models\JobCategory::factory()->create([
            'preset_identifier' => 'ac_maintenance',
        ]);

        $response = $this->actingAs($this->technician)->postJson('/work-reports/autosave', [
            'category_id' => $category->id,
            'preset_data' => json_encode([
                ['lokasi' => 'Gudang', 'tipe_ac' => 'Window'],
            ]),
        ]);

        $response->assertStatus(422);
    }

    // === PHOTO ENDPOINTS ===

    public function test_upload_photo_to_draft_stores_photo_and_returns_url(): void
    {
        $report = WorkReport::factory()->create(['technician_id' => $this->technician->id]);

        $response = $this->actingAs($this->technician)->postJson("/work-reports/{$report->id}/photos", [
            'photo' => UploadedFile::fake()->image('before.jpg', 800, 600),
            'type' => 'before',
            'caption' => 'Kondisi awal',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['id', 'photo_url', 'type', 'caption']);

        $photo = WorkReportPhoto::find($response->json('id'));
        $this->assertNotNull($photo);
        $this->assertEquals($report->id, $photo->work_report_id);
        $this->assertEquals('before', $photo->type);
        Storage::disk('public')->assertExists($photo->photo_path);

        // Legacy JSON field is synced
        $report->refresh();
        $this->assertContains($photo->photo_path, $report->before_photos ?? []);
    }

    public function test_upload_ac_unit_photo_uses_caption_marker(): void
    {
        $report = WorkReport::factory()->create(['technician_id' => $this->technician->id]);

        $response = $this->actingAs($this->technician)->postJson("/work-reports/{$report->id}/photos", [
            'photo' => UploadedFile::fake()->image('unit.jpg'),
            'type' => 'after',
            'unit_index' => 2,
            'caption' => 'Unit 3',
        ]);

        $response->assertStatus(201);
        $photo = WorkReportPhoto::find($response->json('id'));
        $this->assertStringStartsWith('ac_unit_2:', $photo->caption);
        $this->assertStringEndsWith('Unit 3', $photo->caption);
    }

    public function test_upload_photo_rejected_on_submitted_report(): void
    {
        $report = WorkReport::factory()->create(['technician_id' => $this->technician->id]);
        $report->update(['status' => WorkReport::STATUS_SUBMITTED, 'submitted_at' => now()]);

        $response = $this->actingAs($this->technician)->postJson("/work-reports/{$report->id}/photos", [
            'photo' => UploadedFile::fake()->image('x.jpg'),
            'type' => 'before',
        ]);

        $response->assertStatus(403);
    }

    public function test_upload_photo_allowed_for_non_owner_draft(): void
    {
        $report = WorkReport::factory()->create(['technician_id' => $this->otherTechnician->id]);

        // Open collaboration: any operator can add photos to any draft
        $response = $this->actingAs($this->technician)->postJson("/work-reports/{$report->id}/photos", [
            'photo' => UploadedFile::fake()->image('x.jpg'),
            'type' => 'before',
        ]);

        $response->assertStatus(201);
        $photo = WorkReportPhoto::find($response->json('id'));
        $this->assertNotNull($photo);
        $this->assertEquals($report->id, $photo->work_report_id);
    }

    public function test_upload_photo_validates_file_type(): void
    {
        $report = WorkReport::factory()->create(['technician_id' => $this->technician->id]);

        $response = $this->actingAs($this->technician)->postJson("/work-reports/{$report->id}/photos", [
            'photo' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
            'type' => 'before',
        ]);

        $response->assertStatus(422);
    }

    public function test_delete_photo_removes_file_and_row(): void
    {
        $report = WorkReport::factory()->create(['technician_id' => $this->technician->id]);
        $photo = WorkReportPhoto::create([
            'work_report_id' => $report->id,
            'type' => 'before',
            'photo_path' => 'work-reports/test-delete.jpg',
            'sort_order' => 0,
        ]);
        Storage::disk('public')->put('work-reports/test-delete.jpg', 'content');

        $response = $this->actingAs($this->technician)
            ->deleteJson("/work-reports/{$report->id}/photos/{$photo->id}");

        $response->assertStatus(200)
            ->assertJsonPath('deleted', true);
        $this->assertDatabaseMissing('work_report_photos', ['id' => $photo->id]);
        Storage::disk('public')->assertMissing('work-reports/test-delete.jpg');
    }

    public function test_delete_photo_rejects_photo_from_other_report(): void
    {
        $report = WorkReport::factory()->create(['technician_id' => $this->technician->id]);
        $otherReport = WorkReport::factory()->create(['technician_id' => $this->otherTechnician->id]);
        $photo = WorkReportPhoto::create([
            'work_report_id' => $otherReport->id,
            'type' => 'before',
            'photo_path' => 'work-reports/other.jpg',
            'sort_order' => 0,
        ]);

        $response = $this->actingAs($this->technician)
            ->deleteJson("/work-reports/{$report->id}/photos/{$photo->id}");

        $response->assertStatus(404);
        $this->assertDatabaseHas('work_report_photos', ['id' => $photo->id]);
    }

    // === EDIT PAGE DATA ===

    public function test_edit_page_forbidden_for_submitted_report(): void
    {
        $report = WorkReport::factory()->create(['technician_id' => $this->technician->id]);
        $report->update(['status' => WorkReport::STATUS_SUBMITTED, 'submitted_at' => now()]);

        $this->actingAs($this->technician)
            ->get("/work-reports/{$report->id}/edit")
            ->assertStatus(403);
    }
}
