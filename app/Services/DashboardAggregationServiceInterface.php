<?php

namespace App\Services;

interface DashboardAggregationServiceInterface
{
    /**
     * Return array KPI data:
     * - total_active_clients: int
     * - work_reports_this_month: int
     * - total_unpaid_amount: float (invoice unpaid + overdue)
     * - overdue_count: int
     */
    public function getKpiData(): array;

    /**
     * Return data pendapatan per bulan (12 bulan terakhir).
     * Format: [['month' => 'YYYY-MM', 'total' => float], ...]
     */
    public function getMonthlyRevenue(): array;
}
