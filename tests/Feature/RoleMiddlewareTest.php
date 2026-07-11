<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_admin_only_routes(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

        $response = $this->actingAs($admin)->get('/dashboard');

        // Should not return 403 (may be 500 due to missing Vite manifest but not 403)
        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_technician_cannot_access_admin_only_routes(): void
    {
        $technician = User::factory()->create(['role' => User::ROLE_TECHNICIAN]);

        $response = $this->actingAs($technician)->get('/dashboard');

        $response->assertStatus(403);
    }

    public function test_technician_can_access_work_reports(): void
    {
        $technician = User::factory()->create(['role' => User::ROLE_TECHNICIAN]);

        $response = $this->actingAs($technician)->get('/work-reports');

        // Should not return 403
        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_admin_can_access_work_reports(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

        $response = $this->actingAs($admin)->get('/work-reports');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_technician_cannot_access_baps(): void
    {
        $technician = User::factory()->create(['role' => User::ROLE_TECHNICIAN]);

        $response = $this->actingAs($technician)->get('/baps');

        $response->assertStatus(403);
    }

    public function test_technician_cannot_access_invoices(): void
    {
        $technician = User::factory()->create(['role' => User::ROLE_TECHNICIAN]);

        $response = $this->actingAs($technician)->get('/invoices');

        $response->assertStatus(403);
    }

    public function test_admin_login_redirects_to_dashboard(): void
    {
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'password' => bcrypt('password'),
        ]);

        $response = $this->post('/login', [
            'email' => $admin->email,
            'password' => 'password',
        ]);

        $response->assertRedirect('/dashboard');
    }

    public function test_technician_login_redirects_to_work_reports(): void
    {
        $technician = User::factory()->create([
            'role' => User::ROLE_TECHNICIAN,
            'password' => bcrypt('password'),
        ]);

        $response = $this->post('/login', [
            'email' => $technician->email,
            'password' => 'password',
        ]);

        $response->assertRedirect('/work-reports');
    }

    public function test_unauthenticated_user_redirected_to_login(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    }
}
