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

    /**
     * Return data status invoice:
     * Format: [
     *   ['status' => 'paid', 'label' => 'Lunas', 'count' => int, 'total' => float],
     *   ['status' => 'unpaid', 'label' => 'Belum Dibayar', 'count' => int, 'total' => float],
     *   ['status' => 'overdue', 'label' => 'Jatuh Tempo', 'count' => int, 'total' => float],
     *   ['status' => 'draft', 'label' => 'Draft', 'count' => int, 'total' => float],
     * ]
     */
    public function getInvoiceStatusBreakdown(): array;

    /**
     * Return volume laporan kerja per bulan (12 bulan terakhir).
     * Format: [['month' => 'YYYY-MM', 'count' => int], ...]
     */
    public function getMonthlyWorkReports(): array;

    /**
     * Return distribusi laporan kerja per kategori pekerjaan.
     * Format: [['category' => string, 'count' => int], ...]
     */
    public function getCategoryDistribution(): array;
}
