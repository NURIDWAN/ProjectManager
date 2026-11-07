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

    /**
     * Return data status invoice:
     * Format: [
     *   ['status' => 'paid', 'label' => 'Lunas', 'color' => string, 'count' => int, 'total' => float],
     *   ...
     * ]
     */
    public function getInvoiceStatusBreakdown(): array
    {
        return Cache::remember('dashboard.invoice-status.v1', self::CACHE_TTL_SECONDS, function () {
            $invoices = Invoice::query()
                ->selectRaw('status, COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total')
                ->groupBy('status')
                ->get()
                ->keyBy('status');

            $statusConfig = [
                Invoice::STATUS_PAID => ['label' => 'Lunas', 'color' => 'hsl(142.1 76.2% 36.3%)'],
                Invoice::STATUS_UNPAID => ['label' => 'Belum Dibayar', 'color' => 'hsl(38 92% 50%)'],
                Invoice::STATUS_OVERDUE => ['label' => 'Jatuh Tempo', 'color' => 'hsl(0 84.2% 60.2%)'],
                Invoice::STATUS_DRAFT => ['label' => 'Draft', 'color' => 'hsl(215.4 16.3% 46.9%)'],
            ];

            $result = [];
            foreach ($statusConfig as $status => $meta) {
                $item = $invoices->get($status);
                $result[] = [
                    'status' => $status,
                    'label' => $meta['label'],
                    'color' => $meta['color'],
                    'count' => $item ? (int) $item->count : 0,
                    'total' => $item ? (float) $item->total : 0.0,
                ];
            }

            return $result;
        });
    }

    /**
     * Return volume laporan kerja per bulan (12 bulan terakhir).
     * Format: [['month' => 'YYYY-MM', 'count' => int], ...]
     */
    public function getMonthlyWorkReports(): array
    {
        return Cache::remember('dashboard.monthly-work-reports.v1', self::CACHE_TTL_SECONDS, function () {
            $now = Carbon::now();
            $startDate = $now->copy()->subMonths(11)->startOfMonth();
            $monthExpression = match (DB::connection()->getDriverName()) {
                'sqlite' => "strftime('%Y-%m', submitted_at)",
                'pgsql' => "TO_CHAR(submitted_at, 'YYYY-MM')",
                default => "DATE_FORMAT(submitted_at, '%Y-%m')",
            };

            $reports = WorkReport::where('status', WorkReport::STATUS_SUBMITTED)
                ->whereNotNull('submitted_at')
                ->where('submitted_at', '>=', $startDate)
                ->selectRaw("{$monthExpression} as month, COUNT(*) as count")
                ->groupBy('month')
                ->orderBy('month')
                ->get()
                ->keyBy('month');

            $result = [];
            for ($i = 11; $i >= 0; $i--) {
                $monthKey = $now->copy()->subMonths($i)->format('Y-m');
                $result[] = [
                    'month' => $monthKey,
                    'count' => (int) ($reports[$monthKey]->count ?? 0),
                ];
            }

            return $result;
        });
    }

    /**
     * Return distribusi laporan kerja per kategori pekerjaan.
     * Format: [['category' => string, 'count' => int], ...]
     */
    public function getCategoryDistribution(): array
    {
        return Cache::remember('dashboard.category-distribution.v1', self::CACHE_TTL_SECONDS, function () {
            return DB::table('work_reports')
                ->join('job_categories', 'work_reports.category_id', '=', 'job_categories.id')
                ->where('work_reports.status', WorkReport::STATUS_SUBMITTED)
                ->selectRaw('job_categories.name as category, COUNT(*) as count')
                ->groupBy('job_categories.name')
                ->orderByDesc('count')
                ->limit(6)
                ->get()
                ->map(fn ($item) => [
                    'category' => (string) $item->category,
                    'count' => (int) $item->count,
                ])
                ->values()
                ->toArray();
        });
    }
}
