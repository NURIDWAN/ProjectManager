<?php

namespace Tests\Feature;

use App\Models\Bap;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\JobCategory;
use App\Models\Service;
use App\Models\User;
use App\Models\WorkReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Comprehensive role-based access control tests.
 *
 * Validates:
 * - Requirements 1.3: Redirect after login based on role
 * - Requirements 1.5: Admin-only routes reject technicians (403)
 * - Requirements 1.6: Unauthenticated users redirected to login
 */
class RoleBasedAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $technician;
    private Client $client;
    private JobCategory $jobCategory;
    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'password' => bcrypt('password'),
        ]);

        $this->technician = User::factory()->create([
            'role' => User::ROLE_TECHNICIAN,
            'password' => bcrypt('password'),
        ]);

        $this->client = Client::create([
            'name' => 'Test Client',
            'address' => 'Test Address',
            'is_active' => true,
        ]);

        $this->jobCategory = JobCategory::create([
            'name' => 'Test Category',
        ]);

        $this->service = Service::create([
            'code' => 'SVC-TEST',
            'name' => 'Test Service',
            'unit' => 'unit',
            'price' => 100000,
            'type' => 'service',
            'is_active' => true,
        ]);
    }

    // =====================================================
    // LOGIN REDIRECT TESTS (Requirement 1.3)
    // =====================================================

    public function test_admin_login_redirects_to_dashboard(): void
    {
        $response = $this->post('/login', [
            'email' => $this->admin->email,
            'password' => 'password',
        ]);

        $response->assertRedirect('/dashboard');
    }

    public function test_technician_login_redirects_to_work_reports(): void
    {
        $response = $this->post('/login', [
            'email' => $this->technician->email,
            'password' => 'password',
        ]);

        $response->assertRedirect('/work-reports');
    }

    // =====================================================
    // ADMIN-ONLY ROUTE ACCESS TESTS (Requirement 1.5)
    // Technician must receive 403 on all admin-only routes
    // =====================================================

    // --- Dashboard ---

    public function test_technician_cannot_access_dashboard(): void
    {
        $response = $this->actingAs($this->technician)->get('/dashboard');
        $response->assertStatus(403);
    }

    public function test_admin_can_access_dashboard(): void
    {
        $response = $this->actingAs($this->admin)->get('/dashboard');
        $this->assertNotEquals(403, $response->getStatusCode());
    }

    // --- Clients CRUD ---

    public function test_technician_cannot_access_clients_index(): void
    {
        $response = $this->actingAs($this->technician)->get('/clients');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_access_clients_create(): void
    {
        $response = $this->actingAs($this->technician)->get('/clients/create');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_store_client(): void
    {
        $response = $this->actingAs($this->technician)->post('/clients', [
            'name' => 'Test Client',
            'address' => 'Test Address',
        ]);
        $response->assertStatus(403);
    }

    public function test_technician_cannot_access_clients_edit(): void
    {
        $response = $this->actingAs($this->technician)->get('/clients/' . $this->client->id . '/edit');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_update_client(): void
    {
        $response = $this->actingAs($this->technician)->put('/clients/' . $this->client->id, [
            'name' => 'Updated',
            'address' => 'Updated',
        ]);
        $response->assertStatus(403);
    }

    public function test_technician_cannot_delete_client(): void
    {
        $response = $this->actingAs($this->technician)->delete('/clients/' . $this->client->id);
        $response->assertStatus(403);
    }

    // --- Job Categories CRUD ---

    public function test_technician_cannot_access_job_categories_index(): void
    {
        $response = $this->actingAs($this->technician)->get('/job-categories');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_access_job_categories_create(): void
    {
        $response = $this->actingAs($this->technician)->get('/job-categories/create');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_store_job_category(): void
    {
        $response = $this->actingAs($this->technician)->post('/job-categories', [
            'name' => 'Test Category',
        ]);
        $response->assertStatus(403);
    }

    public function test_technician_cannot_access_job_categories_edit(): void
    {
        $response = $this->actingAs($this->technician)->get('/job-categories/' . $this->jobCategory->id . '/edit');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_update_job_category(): void
    {
        $response = $this->actingAs($this->technician)->put('/job-categories/' . $this->jobCategory->id, [
            'name' => 'Updated',
        ]);
        $response->assertStatus(403);
    }

    public function test_technician_cannot_delete_job_category(): void
    {
        $response = $this->actingAs($this->technician)->delete('/job-categories/' . $this->jobCategory->id);
        $response->assertStatus(403);
    }

    // --- Services CRUD ---

    public function test_technician_cannot_access_services_index(): void
    {
        $response = $this->actingAs($this->technician)->get('/services');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_access_services_create(): void
    {
        $response = $this->actingAs($this->technician)->get('/services/create');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_store_service(): void
    {
        $response = $this->actingAs($this->technician)->post('/services', [
            'code' => 'SVC-001',
            'name' => 'Test Service',
            'unit' => 'unit',
            'price' => 100000,
            'type' => 'service',
        ]);
        $response->assertStatus(403);
    }

    public function test_technician_cannot_access_services_edit(): void
    {
        $response = $this->actingAs($this->technician)->get('/services/' . $this->service->id . '/edit');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_update_service(): void
    {
        $response = $this->actingAs($this->technician)->put('/services/' . $this->service->id, [
            'name' => 'Updated',
        ]);
        $response->assertStatus(403);
    }

    public function test_technician_cannot_delete_service(): void
    {
        $response = $this->actingAs($this->technician)->delete('/services/' . $this->service->id);
        $response->assertStatus(403);
    }

    // --- BAPs ---

    public function test_technician_cannot_access_baps_index(): void
    {
        $response = $this->actingAs($this->technician)->get('/baps');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_access_baps_create(): void
    {
        $response = $this->actingAs($this->technician)->get('/baps/create');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_store_bap(): void
    {
        $response = $this->actingAs($this->technician)->post('/baps', [
            'client_id' => 1,
            'work_report_ids' => [1],
        ]);
        $response->assertStatus(403);
    }

    public function test_technician_cannot_access_baps_show(): void
    {
        $response = $this->actingAs($this->technician)->get('/baps/1');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_approve_bap(): void
    {
        $response = $this->actingAs($this->technician)->post('/baps/1/approve');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_export_bap_pdf(): void
    {
        $response = $this->actingAs($this->technician)->get('/baps/1/export-pdf');
        $response->assertStatus(403);
    }

    // --- Invoices ---

    public function test_technician_cannot_access_invoices_index(): void
    {
        $response = $this->actingAs($this->technician)->get('/invoices');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_access_invoices_create(): void
    {
        $response = $this->actingAs($this->technician)->get('/invoices/create');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_store_invoice(): void
    {
        $response = $this->actingAs($this->technician)->post('/invoices', [
            'bap_id' => 1,
        ]);
        $response->assertStatus(403);
    }

    public function test_technician_cannot_access_invoices_show(): void
    {
        $response = $this->actingAs($this->technician)->get('/invoices/1');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_mark_invoice_unpaid(): void
    {
        $response = $this->actingAs($this->technician)->post('/invoices/1/mark-unpaid');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_mark_invoice_paid(): void
    {
        $response = $this->actingAs($this->technician)->post('/invoices/1/mark-paid');
        $response->assertStatus(403);
    }

    public function test_technician_cannot_export_invoice_pdf(): void
    {
        $response = $this->actingAs($this->technician)->get('/invoices/1/export-pdf');
        $response->assertStatus(403);
    }

    // =====================================================
    // TECHNICIAN-ACCESSIBLE ROUTES (Requirement 1.5)
    // Technician CAN access work-reports
    // =====================================================

    public function test_technician_can_access_work_reports_index(): void
    {
        $response = $this->actingAs($this->technician)->get('/work-reports');
        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_technician_can_access_work_reports_create(): void
    {
        $response = $this->actingAs($this->technician)->get('/work-reports/create');
        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_admin_can_access_work_reports_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/work-reports');
        $this->assertNotEquals(403, $response->getStatusCode());
    }

    // =====================================================
    // UNAUTHENTICATED USER TESTS (Requirement 1.6)
    // Unauthenticated users must be redirected to /login
    // =====================================================

    public function test_unauthenticated_user_redirected_from_dashboard(): void
    {
        $response = $this->get('/dashboard');
        $response->assertRedirect('/login');
    }

    public function test_unauthenticated_user_redirected_from_clients(): void
    {
        $response = $this->get('/clients');
        $response->assertRedirect('/login');
    }

    public function test_unauthenticated_user_redirected_from_job_categories(): void
    {
        $response = $this->get('/job-categories');
        $response->assertRedirect('/login');
    }

    public function test_unauthenticated_user_redirected_from_services(): void
    {
        $response = $this->get('/services');
        $response->assertRedirect('/login');
    }

    public function test_unauthenticated_user_redirected_from_work_reports(): void
    {
        $response = $this->get('/work-reports');
        $response->assertRedirect('/login');
    }

    public function test_unauthenticated_user_redirected_from_baps(): void
    {
        $response = $this->get('/baps');
        $response->assertRedirect('/login');
    }

    public function test_unauthenticated_user_redirected_from_invoices(): void
    {
        $response = $this->get('/invoices');
        $response->assertRedirect('/login');
    }

    // =====================================================
    // ADMIN ACCESS CONFIRMATION TESTS
    // Admin can access all admin-only routes without 403
    // =====================================================

    public function test_admin_can_access_clients_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/clients');
        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_admin_can_access_job_categories_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/job-categories');
        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_admin_can_access_services_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/services');
        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_admin_can_access_baps_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/baps');
        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_admin_can_access_invoices_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/invoices');
        $this->assertNotEquals(403, $response->getStatusCode());
    }
}
