<?php

namespace Tests\Feature;

use App\Models\Bap;
use App\Models\Client;
use App\Models\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckOverdueInvoicesCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_updates_overdue_invoices_and_outputs_count(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_UNPAID,
            'due_date' => now()->subDays(3),
        ]);

        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_UNPAID,
            'due_date' => now()->subDays(1),
        ]);

        $this->artisan('invoice:check-overdue')
            ->expectsOutput('Updated 2 invoices to overdue status.')
            ->assertExitCode(0);

        $this->assertEquals(2, Invoice::where('status', Invoice::STATUS_OVERDUE)->count());
    }

    public function test_command_outputs_zero_when_no_overdue_invoices(): void
    {
        $this->artisan('invoice:check-overdue')
            ->expectsOutput('Updated 0 invoices to overdue status.')
            ->assertExitCode(0);
    }

    public function test_command_does_not_affect_non_unpaid_invoices(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        $draftInvoice = Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_DRAFT,
            'due_date' => now()->subDays(5),
        ]);

        $paidInvoice = Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_PAID,
            'due_date' => now()->subDays(10),
            'paid_at' => now(),
        ]);

        $this->artisan('invoice:check-overdue')
            ->expectsOutput('Updated 0 invoices to overdue status.')
            ->assertExitCode(0);

        $this->assertEquals(Invoice::STATUS_DRAFT, $draftInvoice->fresh()->status);
        $this->assertEquals(Invoice::STATUS_PAID, $paidInvoice->fresh()->status);
    }

    public function test_command_is_scheduled_daily(): void
    {
        $schedule = app(\Illuminate\Console\Scheduling\Schedule::class);
        $events = $schedule->events();

        $overdueEvent = collect($events)->first(function ($event) {
            return str_contains($event->command, 'invoice:check-overdue');
        });

        $this->assertNotNull($overdueEvent, 'The invoice:check-overdue command is not scheduled.');
        $this->assertEquals('1 0 * * *', $overdueEvent->expression);
    }
}
