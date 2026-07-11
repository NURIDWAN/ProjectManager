<?php

namespace Tests\Feature;

use App\Models\Bap;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\JobCategory;
use App\Models\Service;
use App\Models\User;
use App\Models\WorkReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $technician;
    private Client $client;
    private JobCategory $category;
    private Bap $approvedBap;
    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $this->technician = User::factory()->create(['role' => User::ROLE_TECHNICIAN]);
        $this->client = Client::factory()->create(['is_active' => true]);
        $this->category = JobCategory::factory()->create();
        $this->service = Service::factory()->create(['is_active' => true, 'price' => 500000]);

        // Create a submitted work report
        $workReport = WorkReport::factory()->submitted()->create([
            'client_id' => $this->client->id,
            'category_id' => $this->category->id,
            'technician_id' => $this->technician->id,
        ]);

        // Create an approved BAP
        $this->approvedBap = Bap::factory()->approved()->create([
            'client_id' => $this->client->id,
            'work_report_ids' => [$workReport->id],
        ]);
    }

    // === ACCESS CONTROL ===

    public function test_admin_can_access_invoices_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/invoices');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_technician_cannot_access_invoices(): void
    {
        $response = $this->actingAs($this->technician)->get('/invoices');

        $response->assertStatus(403);
    }

    public function test_technician_cannot_create_invoice(): void
    {
        $response = $this->actingAs($this->technician)->get('/invoices/create');

        $response->assertStatus(403);
    }

    public function test_technician_cannot_store_invoice(): void
    {
        $response = $this->actingAs($this->technician)->post('/invoices', [
            'bap_id' => $this->approvedBap->id,
            'items' => [
                [
                    'service_id' => $this->service->id,
                    'quantity' => 1,
                    'unit_price' => 500000,
                    'discount_percent' => 0,
                ],
            ],
        ]);

        $response->assertStatus(403);
    }

    // === INDEX ===

    public function test_index_shows_invoices_list(): void
    {
        Invoice::factory()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)->get('/invoices');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_index_filters_by_status(): void
    {
        $bap2 = Bap::factory()->approved()->create([
            'client_id' => $this->client->id,
            'nomor_surat' => 'BAP/0002/01/2024',
        ]);

        Invoice::factory()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
            'status' => Invoice::STATUS_DRAFT,
        ]);
        Invoice::factory()->unpaid()->create([
            'bap_id' => $bap2->id,
            'client_id' => $this->client->id,
            'invoice_number' => 'INV/0002/01/2024',
        ]);

        $response = $this->actingAs($this->admin)->get('/invoices?status=draft');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_index_filters_by_client(): void
    {
        $otherClient = Client::factory()->create();
        $otherBap = Bap::factory()->approved()->create([
            'client_id' => $otherClient->id,
            'nomor_surat' => 'BAP/0003/01/2024',
        ]);

        Invoice::factory()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
        ]);
        Invoice::factory()->create([
            'bap_id' => $otherBap->id,
            'client_id' => $otherClient->id,
            'invoice_number' => 'INV/0002/01/2024',
        ]);

        $response = $this->actingAs($this->admin)->get('/invoices?client_id=' . $this->client->id);

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    // === CREATE ===

    public function test_admin_can_view_create_form(): void
    {
        $response = $this->actingAs($this->admin)->get('/invoices/create');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_create_shows_only_approved_baps_without_invoice(): void
    {
        // The approved BAP from setUp doesn't have an invoice yet
        $response = $this->actingAs($this->admin)->get('/invoices/create');

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_create_auto_populates_items_when_bap_id_provided(): void
    {
        $response = $this->actingAs($this->admin)->get('/invoices/create?bap_id=' . $this->approvedBap->id);

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    // === STORE ===

    public function test_admin_can_store_invoice(): void
    {
        $response = $this->actingAs($this->admin)->post('/invoices', [
            'bap_id' => $this->approvedBap->id,
            'items' => [
                [
                    'service_id' => $this->service->id,
                    'quantity' => 2,
                    'unit_price' => 500000,
                    'discount_percent' => 10,
                ],
            ],
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('invoices', [
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
            'status' => Invoice::STATUS_DRAFT,
        ]);

        // Check invoice items were created
        $invoice = Invoice::where('bap_id', $this->approvedBap->id)->first();
        $this->assertNotNull($invoice);
        $this->assertEquals(1, $invoice->items()->count());

        // Check calculations: 2 * 500000 * (1 - 10/100) = 900000
        $item = $invoice->items()->first();
        $this->assertEquals(900000, (float) $item->line_total);
    }

    public function test_store_generates_auto_invoice_number(): void
    {
        $this->actingAs($this->admin)->post('/invoices', [
            'bap_id' => $this->approvedBap->id,
            'items' => [
                [
                    'service_id' => $this->service->id,
                    'quantity' => 1,
                    'unit_price' => 500000,
                    'discount_percent' => 0,
                ],
            ],
        ]);

        $invoice = Invoice::first();
        $this->assertMatchesRegularExpression('/^INV\/\d{4}\/\d{2}\/\d{4}$/', $invoice->invoice_number);
    }

    public function test_store_calculates_totals_correctly(): void
    {
        $this->actingAs($this->admin)->post('/invoices', [
            'bap_id' => $this->approvedBap->id,
            'items' => [
                [
                    'service_id' => $this->service->id,
                    'quantity' => 2,
                    'unit_price' => 1000000,
                    'discount_percent' => 0,
                ],
            ],
        ]);

        $invoice = Invoice::first();
        // subtotal = 2 * 1000000 = 2000000
        $this->assertEquals(2000000, (float) $invoice->subtotal);
        // ppn = 2000000 * 0.11 = 220000
        $this->assertEquals(220000, (float) $invoice->ppn);
        // grand_total = 2000000 + 220000 = 2220000
        $this->assertEquals(2220000, (float) $invoice->grand_total);
    }

    public function test_store_fails_without_bap_id(): void
    {
        $response = $this->actingAs($this->admin)->post('/invoices', [
            'bap_id' => '',
            'items' => [
                [
                    'service_id' => $this->service->id,
                    'quantity' => 1,
                    'unit_price' => 500000,
                    'discount_percent' => 0,
                ],
            ],
        ]);

        $response->assertSessionHasErrors('bap_id');
    }

    public function test_store_fails_without_items(): void
    {
        $response = $this->actingAs($this->admin)->post('/invoices', [
            'bap_id' => $this->approvedBap->id,
            'items' => [],
        ]);

        $response->assertSessionHasErrors('items');
    }

    public function test_store_fails_with_draft_bap(): void
    {
        $draftBap = Bap::factory()->create([
            'client_id' => $this->client->id,
            'status' => Bap::STATUS_DRAFT,
            'nomor_surat' => 'BAP/0010/01/2024',
        ]);

        $response = $this->actingAs($this->admin)->post('/invoices', [
            'bap_id' => $draftBap->id,
            'items' => [
                [
                    'service_id' => $this->service->id,
                    'quantity' => 1,
                    'unit_price' => 500000,
                    'discount_percent' => 0,
                ],
            ],
        ]);

        $response->assertSessionHasErrors('bap_id');
    }

    public function test_store_fails_if_bap_already_has_invoice(): void
    {
        // Create an invoice for the approvedBap first
        Invoice::factory()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)->post('/invoices', [
            'bap_id' => $this->approvedBap->id,
            'items' => [
                [
                    'service_id' => $this->service->id,
                    'quantity' => 1,
                    'unit_price' => 500000,
                    'discount_percent' => 0,
                ],
            ],
        ]);

        $response->assertSessionHasErrors('bap_id');
    }

    public function test_store_fails_with_invalid_item_quantity(): void
    {
        $response = $this->actingAs($this->admin)->post('/invoices', [
            'bap_id' => $this->approvedBap->id,
            'items' => [
                [
                    'service_id' => $this->service->id,
                    'quantity' => 0,
                    'unit_price' => 500000,
                    'discount_percent' => 0,
                ],
            ],
        ]);

        $response->assertSessionHasErrors('items.0.quantity');
    }

    public function test_store_fails_with_discount_over_100(): void
    {
        $response = $this->actingAs($this->admin)->post('/invoices', [
            'bap_id' => $this->approvedBap->id,
            'items' => [
                [
                    'service_id' => $this->service->id,
                    'quantity' => 1,
                    'unit_price' => 500000,
                    'discount_percent' => 150,
                ],
            ],
        ]);

        $response->assertSessionHasErrors('items.0.discount_percent');
    }

    // === SHOW ===

    public function test_admin_can_view_invoice_detail(): void
    {
        $invoice = Invoice::factory()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)->get("/invoices/{$invoice->id}");

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    public function test_show_returns_404_for_nonexistent_invoice(): void
    {
        $response = $this->actingAs($this->admin)->get('/invoices/99999');

        $response->assertStatus(404);
    }

    // === MARK UNPAID ===

    public function test_admin_can_mark_draft_invoice_as_unpaid(): void
    {
        $invoice = Invoice::factory()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
            'status' => Invoice::STATUS_DRAFT,
        ]);

        $dueDate = now()->addDays(30)->format('Y-m-d');

        $response = $this->actingAs($this->admin)->post("/invoices/{$invoice->id}/mark-unpaid", [
            'due_date' => $dueDate,
        ]);

        $response->assertRedirect();
        $invoice->refresh();
        $this->assertEquals(Invoice::STATUS_UNPAID, $invoice->status);
        $this->assertEquals($dueDate, $invoice->due_date->format('Y-m-d'));
    }

    public function test_mark_unpaid_requires_due_date(): void
    {
        $invoice = Invoice::factory()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
            'status' => Invoice::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->admin)->post("/invoices/{$invoice->id}/mark-unpaid", [
            'due_date' => '',
        ]);

        $response->assertSessionHasErrors('due_date');
        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => Invoice::STATUS_DRAFT,
        ]);
    }

    public function test_mark_unpaid_fails_for_non_draft_invoice(): void
    {
        $invoice = Invoice::factory()->unpaid()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)->post("/invoices/{$invoice->id}/mark-unpaid", [
            'due_date' => now()->addDays(30)->format('Y-m-d'),
        ]);

        $response->assertStatus(422);
    }

    // === MARK PAID ===

    public function test_admin_can_mark_unpaid_invoice_as_paid(): void
    {
        $invoice = Invoice::factory()->unpaid()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)->post("/invoices/{$invoice->id}/mark-paid");

        $response->assertRedirect();
        $invoice->refresh();
        $this->assertEquals(Invoice::STATUS_PAID, $invoice->status);
        $this->assertNotNull($invoice->paid_at);
    }

    public function test_admin_can_mark_overdue_invoice_as_paid(): void
    {
        $invoice = Invoice::factory()->overdue()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)->post("/invoices/{$invoice->id}/mark-paid");

        $response->assertRedirect();
        $invoice->refresh();
        $this->assertEquals(Invoice::STATUS_PAID, $invoice->status);
        $this->assertNotNull($invoice->paid_at);
    }

    public function test_mark_paid_fails_for_draft_invoice(): void
    {
        $invoice = Invoice::factory()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
            'status' => Invoice::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->admin)->post("/invoices/{$invoice->id}/mark-paid");

        $response->assertStatus(422);
    }

    public function test_mark_paid_fails_for_already_paid_invoice(): void
    {
        $invoice = Invoice::factory()->paid()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)->post("/invoices/{$invoice->id}/mark-paid");

        $response->assertStatus(422);
    }

    // === LOCK PAID INVOICE ===

    public function test_paid_invoice_cannot_be_modified_mark_unpaid(): void
    {
        $invoice = Invoice::factory()->paid()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->admin)->post("/invoices/{$invoice->id}/mark-unpaid", [
            'due_date' => now()->addDays(30)->format('Y-m-d'),
        ]);

        // Should fail because paid invoice is not "draft"
        $response->assertStatus(422);
    }

    // === EXPORT PDF ===

    public function test_admin_can_export_invoice_as_pdf(): void
    {
        $invoice = Invoice::factory()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
        ]);

        InvoiceItem::factory()->create([
            'invoice_id' => $invoice->id,
            'service_id' => $this->service->id,
        ]);

        $response = $this->actingAs($this->admin)->get("/invoices/{$invoice->id}/export-pdf");

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_export_pdf_fails_for_nonexistent_invoice(): void
    {
        $response = $this->actingAs($this->admin)->get('/invoices/99999/export-pdf');

        $response->assertStatus(404);
    }

    public function test_technician_cannot_export_invoice_pdf(): void
    {
        $invoice = Invoice::factory()->create([
            'bap_id' => $this->approvedBap->id,
            'client_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->technician)->get("/invoices/{$invoice->id}/export-pdf");

        $response->assertStatus(403);
    }
}
