<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\WorkReport;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardAggregationService implements DashboardAggregationServiceInterface
{
    /**
     * Return array KPI data:
     * - total_active_clients: int
     * - work_reports_this_month: int
     * - total_unpaid_amount: float (invoice unpaid + overdue)
     * - overdue_count: int
     */
    public function getKpiData(): array
    {
        $totalActiveClients = Client::where('is_active', true)->count();

        $workReportsThisMonth = WorkReport::where('status', WorkReport::STATUS_SUBMITTED)
            ->whereMonth('submitted_at', Carbon::now()->month)
            ->whereYear('submitted_at', Carbon::now()->year)
            ->count();

        $totalUnpaidAmount = (float) Invoice::whereIn('status', [Invoice::STATUS_UNPAID, Invoice::STATUS_OVERDUE])
            ->sum('grand_total');

        $overdueCount = Invoice::where('status', Invoice::STATUS_OVERDUE)->count();

        return [
            'total_active_clients' => $totalActiveClients,
            'work_reports_this_month' => $workReportsThisMonth,
            'total_unpaid_amount' => $totalUnpaidAmount,
            'overdue_count' => $overdueCount,
        ];
    }

    /**
     * Return data pendapatan per bulan (12 bulan terakhir).
     * Format: [['month' => 'YYYY-MM', 'total' => float], ...]
     */
    public function getMonthlyRevenue(): array
    {
        $startDate = Carbon::now()->subMonths(11)->startOfMonth();

        $revenues = Invoice::where('status', Invoice::STATUS_PAID)
            ->whereNotNull('paid_at')
            ->where('paid_at', '>=', $startDate)
            ->selectRaw("strftime('%Y-%m', paid_at) as month, SUM(grand_total) as total")
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        // Build complete 12-month array (fill missing months with 0)
        $result = [];
        for ($i = 11; $i >= 0; $i--) {
            $monthKey = Carbon::now()->subMonths($i)->format('Y-m');
            $result[] = [
                'month' => $monthKey,
                'total' => (float) ($revenues[$monthKey]->total ?? 0),
            ];
        }

        return $result;
    }
}
