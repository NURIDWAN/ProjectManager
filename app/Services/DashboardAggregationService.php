<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\WorkReport;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardAggregationService implements DashboardAggregationServiceInterface
{
    private const CACHE_TTL_SECONDS = 60;

    /**
     * Return array KPI data:
     * - total_active_clients: int
     * - work_reports_this_month: int
     * - total_unpaid_amount: float (invoice unpaid + overdue)
     * - overdue_count: int
     */
    public function getKpiData(): array
    {
        return Cache::remember('dashboard.kpi.v1', self::CACHE_TTL_SECONDS, function () {
            $now = Carbon::now();
            $totalActiveClients = Client::where('is_active', true)->count();

            $workReportsThisMonth = WorkReport::where('status', WorkReport::STATUS_SUBMITTED)
                ->whereBetween('submitted_at', [
                    $now->copy()->startOfMonth(),
                    $now->copy()->endOfMonth(),
                ])
                ->count();

            $invoiceTotals = Invoice::query()
                ->selectRaw(
                    'COALESCE(SUM(CASE WHEN status IN (?, ?) THEN grand_total ELSE 0 END), 0) AS total_unpaid_amount',
                    [Invoice::STATUS_UNPAID, Invoice::STATUS_OVERDUE],
                )
                ->selectRaw(
                    'SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS overdue_count',
                    [Invoice::STATUS_OVERDUE],
                )
                ->first();

            return [
                'total_active_clients' => $totalActiveClients,
                'work_reports_this_month' => $workReportsThisMonth,
                'total_unpaid_amount' => (float) $invoiceTotals->total_unpaid_amount,
                'overdue_count' => (int) $invoiceTotals->overdue_count,
            ];
        });
    }

    /**
     * Return data pendapatan per bulan (12 bulan terakhir).
     * Format: [['month' => 'YYYY-MM', 'total' => float], ...]
     */
    public function getMonthlyRevenue(): array
    {
        return Cache::remember('dashboard.monthly-revenue.v1', self::CACHE_TTL_SECONDS, function () {
            $now = Carbon::now();
            $startDate = $now->copy()->subMonths(11)->startOfMonth();
            $monthExpression = match (DB::connection()->getDriverName()) {
                'sqlite' => "strftime('%Y-%m', paid_at)",
                'pgsql' => "TO_CHAR(paid_at, 'YYYY-MM')",
                default => "DATE_FORMAT(paid_at, '%Y-%m')",
            };

            $revenues = Invoice::where('status', Invoice::STATUS_PAID)
                ->whereNotNull('paid_at')
                ->where('paid_at', '>=', $startDate)
                ->selectRaw("{$monthExpression} as month, SUM(grand_total) as total")
                ->groupBy('month')
                ->orderBy('month')
                ->get()
                ->keyBy('month');

            $result = [];
            for ($i = 11; $i >= 0; $i--) {
                $monthKey = $now->copy()->subMonths($i)->format('Y-m');
                $result[] = [
                    'month' => $monthKey,
                    'total' => (float) ($revenues[$monthKey]->total ?? 0),
                ];
            }

            return $result;
        });
    }
}
