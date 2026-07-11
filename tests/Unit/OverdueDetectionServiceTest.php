<?php

namespace Tests\Unit;

use App\Models\Bap;
use App\Models\Client;
use App\Models\Invoice;
use App\Services\OverdueDetectionService;
use App\Services\OverdueDetectionServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OverdueDetectionServiceTest extends TestCase
{
    use RefreshDatabase;

    private OverdueDetectionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new OverdueDetectionService();
    }

    public function test_updates_unpaid_invoices_past_due_date_to_overdue(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        $invoice = Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_UNPAID,
            'due_date' => now()->subDays(3),
        ]);

        $count = $this->service->detectAndUpdateOverdue();

        $this->assertEquals(1, $count);
        $this->assertEquals(Invoice::STATUS_OVERDUE, $invoice->fresh()->status);
    }

    public function test_does_not_update_unpaid_invoices_with_future_due_date(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        $invoice = Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_UNPAID,
            'due_date' => now()->addDays(5),
        ]);

        $count = $this->service->detectAndUpdateOverdue();

        $this->assertEquals(0, $count);
        $this->assertEquals(Invoice::STATUS_UNPAID, $invoice->fresh()->status);
    }

    public function test_does_not_update_unpaid_invoices_due_today(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        $invoice = Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_UNPAID,
            'due_date' => now()->startOfDay(),
        ]);

        $count = $this->service->detectAndUpdateOverdue();

        $this->assertEquals(0, $count);
        $this->assertEquals(Invoice::STATUS_UNPAID, $invoice->fresh()->status);
    }

    public function test_does_not_update_draft_invoices(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        $invoice = Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_DRAFT,
            'due_date' => now()->subDays(5),
        ]);

        $count = $this->service->detectAndUpdateOverdue();

        $this->assertEquals(0, $count);
        $this->assertEquals(Invoice::STATUS_DRAFT, $invoice->fresh()->status);
    }

    public function test_does_not_update_paid_invoices(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        $invoice = Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_PAID,
            'due_date' => now()->subDays(10),
            'paid_at' => now()->subDays(2),
        ]);

        $count = $this->service->detectAndUpdateOverdue();

        $this->assertEquals(0, $count);
        $this->assertEquals(Invoice::STATUS_PAID, $invoice->fresh()->status);
    }

    public function test_does_not_update_already_overdue_invoices(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        $invoice = Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_OVERDUE,
            'due_date' => now()->subDays(10),
        ]);

        $count = $this->service->detectAndUpdateOverdue();

        $this->assertEquals(0, $count);
        $this->assertEquals(Invoice::STATUS_OVERDUE, $invoice->fresh()->status);
    }

    public function test_does_not_update_unpaid_invoices_with_null_due_date(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        $invoice = Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_UNPAID,
            'due_date' => null,
        ]);

        $count = $this->service->detectAndUpdateOverdue();

        $this->assertEquals(0, $count);
        $this->assertEquals(Invoice::STATUS_UNPAID, $invoice->fresh()->status);
    }

    public function test_updates_multiple_overdue_invoices(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_UNPAID,
            'due_date' => now()->subDays(1),
        ]);

        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_UNPAID,
            'due_date' => now()->subDays(10),
        ]);

        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_UNPAID,
            'due_date' => now()->addDays(5),
        ]);

        $count = $this->service->detectAndUpdateOverdue();

        $this->assertEquals(2, $count);
    }

    public function test_returns_zero_when_no_overdue_invoices(): void
    {
        $count = $this->service->detectAndUpdateOverdue();

        $this->assertEquals(0, $count);
    }

    public function test_can_be_resolved_from_container(): void
    {
        $service = app(OverdueDetectionServiceInterface::class);

        $this->assertInstanceOf(OverdueDetectionService::class, $service);
    }
}
