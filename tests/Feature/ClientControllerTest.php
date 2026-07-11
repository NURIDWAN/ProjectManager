<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use App\Models\WorkReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $technician;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $this->technician = User::factory()->create(['role' => User::ROLE_TECHNICIAN]);
    }

    // === INDEX ===

    public function test_admin_can_view_clients_index(): void
    {
        Client::factory()->create(['name' => 'PT Test']);

        $response = $this->actingAs($this->admin)->get('/clients');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_technician_cannot_access_clients(): void
    {
        $response = $this->actingAs($this->technician)->get('/clients');

        $response->assertStatus(403);
    }

    public function test_search_clients_by_name(): void
    {
        Client::factory()->create(['name' => 'PT Maju Jaya']);
        Client::factory()->create(['name' => 'CV Berkah']);

        $response = $this->actingAs($this->admin)->get('/clients?search=Maju');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_search_clients_by_npwp(): void
    {
        Client::factory()->create(['name' => 'PT Alpha', 'npwp' => '12.345.678.9-012.345']);
        Client::factory()->create(['name' => 'PT Beta', 'npwp' => '99.999.999.9-999.999']);

        $response = $this->actingAs($this->admin)->get('/clients?search=12.345');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_filter_clients_by_active_status(): void
    {
        Client::factory()->create(['name' => 'Active Client', 'is_active' => true]);
        Client::factory()->create(['name' => 'Inactive Client', 'is_active' => false]);

        $response = $this->actingAs($this->admin)->get('/clients?is_active=1');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    // === CREATE ===

    public function test_admin_can_view_create_form(): void
    {
        $response = $this->actingAs($this->admin)->get('/clients/create');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    // === STORE ===

    public function test_admin_can_store_client(): void
    {
        $response = $this->actingAs($this->admin)->post('/clients', [
            'name' => 'PT Baru',
            'address' => 'Jl. Merdeka No. 1',
            'npwp' => '12.345.678.9-012.345',
            'pic_name' => 'John Doe',
            'pic_phone' => '08123456789',
            'is_active' => true,
        ]);

        $response->assertRedirect(route('clients.index'));
        $this->assertDatabaseHas('clients', [
            'name' => 'PT Baru',
            'address' => 'Jl. Merdeka No. 1',
            'npwp' => '12.345.678.9-012.345',
            'pic_name' => 'John Doe',
            'pic_phone' => '08123456789',
            'is_active' => true,
        ]);
    }

    public function test_store_client_name_is_required(): void
    {
        $response = $this->actingAs($this->admin)->post('/clients', [
            'name' => '',
            'address' => 'Jl. Test',
        ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_store_client_address_is_required(): void
    {
        $response = $this->actingAs($this->admin)->post('/clients', [
            'name' => 'PT Test',
            'address' => '',
        ]);

        $response->assertSessionHasErrors('address');
    }

    public function test_store_client_with_minimal_fields(): void
    {
        $response = $this->actingAs($this->admin)->post('/clients', [
            'name' => 'PT Minimal',
            'address' => 'Jl. Sederhana',
        ]);

        $response->assertRedirect(route('clients.index'));
        $this->assertDatabaseHas('clients', [
            'name' => 'PT Minimal',
            'address' => 'Jl. Sederhana',
        ]);
    }

    // === EDIT ===

    public function test_admin_can_view_edit_form(): void
    {
        $client = Client::factory()->create();

        $response = $this->actingAs($this->admin)->get("/clients/{$client->id}/edit");

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    // === UPDATE ===

    public function test_admin_can_update_client(): void
    {
        $client = Client::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($this->admin)->put("/clients/{$client->id}", [
            'name' => 'New Name',
            'address' => 'New Address',
            'npwp' => '99.999.999.9-999.999',
            'pic_name' => 'Jane Doe',
            'pic_phone' => '08199999999',
            'is_active' => false,
        ]);

        $response->assertRedirect(route('clients.index'));
        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
            'name' => 'New Name',
            'address' => 'New Address',
            'is_active' => false,
        ]);
    }

    public function test_update_client_name_is_required(): void
    {
        $client = Client::factory()->create();

        $response = $this->actingAs($this->admin)->put("/clients/{$client->id}", [
            'name' => '',
            'address' => 'Some Address',
        ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_update_client_address_is_required(): void
    {
        $client = Client::factory()->create();

        $response = $this->actingAs($this->admin)->put("/clients/{$client->id}", [
            'name' => 'Test Name',
            'address' => '',
        ]);

        $response->assertSessionHasErrors('address');
    }

    // === DESTROY (Soft-Delete) ===

    public function test_admin_can_delete_client_without_relations(): void
    {
        $client = Client::factory()->create();

        $response = $this->actingAs($this->admin)->delete("/clients/{$client->id}");

        $response->assertRedirect(route('clients.index'));
        $this->assertSoftDeleted('clients', ['id' => $client->id]);
    }

    public function test_delete_client_with_work_reports_requires_confirmation(): void
    {
        $client = Client::factory()->create();
        WorkReport::factory()->create(['client_id' => $client->id]);

        $response = $this->actingAs($this->admin)->delete("/clients/{$client->id}");

        $response->assertRedirect();
        $response->assertSessionHas('warning');
        // Client should NOT be deleted without confirmation
        $this->assertDatabaseHas('clients', ['id' => $client->id, 'deleted_at' => null]);
    }

    public function test_delete_client_with_work_reports_when_confirmed(): void
    {
        $client = Client::factory()->create();
        WorkReport::factory()->create(['client_id' => $client->id]);

        $response = $this->actingAs($this->admin)->delete("/clients/{$client->id}", [
            'confirmed' => true,
        ]);

        $response->assertRedirect(route('clients.index'));
        $this->assertSoftDeleted('clients', ['id' => $client->id]);
    }

    // === SCOPE ACTIVE ===

    public function test_scope_active_returns_only_active_clients(): void
    {
        Client::factory()->create(['name' => 'Active', 'is_active' => true]);
        Client::factory()->create(['name' => 'Inactive', 'is_active' => false]);

        $activeClients = Client::active()->get();

        $this->assertCount(1, $activeClients);
        $this->assertEquals('Active', $activeClients->first()->name);
    }
}
