<?php

namespace Tests\Unit;

use App\Models\Bap;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\WorkReport;
use App\Services\DashboardAggregationService;
use App\Services\DashboardAggregationServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DashboardAggregationServiceTest extends TestCase
{
    use RefreshDatabase;

    private DashboardAggregationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DashboardAggregationService();
    }

    // --- getKpiData tests ---

    public function test_get_kpi_data_returns_correct_structure(): void
    {
        $result = $this->service->getKpiData();

        $this->assertArrayHasKey('total_active_clients', $result);
        $this->assertArrayHasKey('work_reports_this_month', $result);
        $this->assertArrayHasKey('total_unpaid_amount', $result);
        $this->assertArrayHasKey('overdue_count', $result);
    }

    public function test_get_kpi_data_returns_zero_when_no_data(): void
    {
        $result = $this->service->getKpiData();

        $this->assertEquals(0, $result['total_active_clients']);
        $this->assertEquals(0, $result['work_reports_this_month']);
        $this->assertEquals(0.0, $result['total_unpaid_amount']);
        $this->assertEquals(0, $result['overdue_count']);
    }

    public function test_total_active_clients_counts_only_active(): void
    {
        Client::factory()->count(3)->create(['is_active' => true]);
        Client::factory()->count(2)->create(['is_active' => false]);

        $result = $this->service->getKpiData();

        $this->assertEquals(3, $result['total_active_clients']);
    }

    public function test_work_reports_this_month_counts_only_submitted_in_current_month(): void
    {
        $client = Client::factory()->create();

        // Submitted this month
        WorkReport::factory()->submitted()->count(2)->create([
            'client_id' => $client->id,
            'submitted_at' => Carbon::now(),
        ]);

        // Submitted last month
        WorkReport::factory()->submitted()->create([
            'client_id' => $client->id,
            'submitted_at' => Carbon::now()->subMonth(),
        ]);

        // Draft this month (should not count)
        WorkReport::factory()->create([
            'client_id' => $client->id,
            'status' => WorkReport::STATUS_DRAFT,
        ]);

        $result = $this->service->getKpiData();

        $this->assertEquals(2, $result['work_reports_this_month']);
    }

    public function test_total_unpaid_amount_sums_unpaid_and_overdue_grand_totals(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_UNPAID,
            'grand_total' => 500000,
            'due_date' => now()->addDays(10),
        ]);

        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_OVERDUE,
            'grand_total' => 300000,
            'due_date' => now()->subDays(5),
        ]);

        // Paid invoice should not be included
        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_PAID,
            'grand_total' => 1000000,
            'paid_at' => now(),
            'due_date' => now()->subDays(20),
        ]);

        // Draft invoice should not be included
        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_DRAFT,
            'grand_total' => 200000,
        ]);

        $result = $this->service->getKpiData();

        $this->assertEquals(800000.0, $result['total_unpaid_amount']);
    }

    public function test_overdue_count_counts_only_overdue_invoices(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        Invoice::factory()->count(3)->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_OVERDUE,
            'due_date' => now()->subDays(5),
        ]);

        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_UNPAID,
            'due_date' => now()->addDays(10),
        ]);

        $result = $this->service->getKpiData();

        $this->assertEquals(3, $result['overdue_count']);
    }

    // --- getMonthlyRevenue tests ---

    public function test_get_monthly_revenue_returns_12_months(): void
    {
        $result = $this->service->getMonthlyRevenue();

        $this->assertCount(12, $result);
    }

    public function test_get_monthly_revenue_returns_correct_month_format(): void
    {
        $result = $this->service->getMonthlyRevenue();

        foreach ($result as $entry) {
            $this->assertArrayHasKey('month', $entry);
            $this->assertArrayHasKey('total', $entry);
            $this->assertMatchesRegularExpression('/^\d{4}-\d{2}$/', $entry['month']);
        }
    }

    public function test_get_monthly_revenue_returns_zero_for_months_without_paid_invoices(): void
    {
        $result = $this->service->getMonthlyRevenue();

        foreach ($result as $entry) {
            $this->assertEquals(0.0, $entry['total']);
        }
    }

    public function test_get_monthly_revenue_includes_paid_invoice_totals(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        $currentMonth = Carbon::now()->format('Y-m');

        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_PAID,
            'grand_total' => 1500000,
            'paid_at' => Carbon::now(),
            'due_date' => now()->subDays(5),
        ]);

        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_PAID,
            'grand_total' => 500000,
            'paid_at' => Carbon::now(),
            'due_date' => now()->subDays(3),
        ]);

        $result = $this->service->getMonthlyRevenue();

        $currentMonthData = collect($result)->firstWhere('month', $currentMonth);
        $this->assertEquals(2000000.0, $currentMonthData['total']);
    }

    public function test_get_monthly_revenue_does_not_include_unpaid_invoices(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_UNPAID,
            'grand_total' => 1000000,
            'due_date' => now()->addDays(10),
        ]);

        $result = $this->service->getMonthlyRevenue();

        foreach ($result as $entry) {
            $this->assertEquals(0.0, $entry['total']);
        }
    }

    public function test_get_monthly_revenue_does_not_include_invoices_older_than_12_months(): void
    {
        $client = Client::factory()->create();
        $bap = Bap::factory()->approved()->create(['client_id' => $client->id]);

        Invoice::factory()->create([
            'bap_id' => $bap->id,
            'client_id' => $client->id,
            'status' => Invoice::STATUS_PAID,
            'grand_total' => 1000000,
            'paid_at' => Carbon::now()->subMonths(13),
            'due_date' => now()->subMonths(14),
        ]);

        $result = $this->service->getMonthlyRevenue();

        foreach ($result as $entry) {
            $this->assertEquals(0.0, $entry['total']);
        }
    }

    public function test_get_monthly_revenue_returns_months_in_chronological_order(): void
    {
        $result = $this->service->getMonthlyRevenue();

        $months = array_column($result, 'month');
        $sorted = $months;
        sort($sorted);

        $this->assertEquals($sorted, $months);
    }

    // --- Service binding test ---

    public function test_can_be_resolved_from_container(): void
    {
        $service = app(DashboardAggregationServiceInterface::class);

        $this->assertInstanceOf(DashboardAggregationService::class, $service);
    }
}
