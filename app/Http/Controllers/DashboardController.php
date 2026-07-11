<?php

namespace App\Http\Controllers;

use App\Services\DashboardAggregationServiceInterface;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardAggregationServiceInterface $dashboardService
    ) {}

    public function index(): Response
    {
        $kpiData = $this->dashboardService->getKpiData();
        $monthlyRevenue = $this->dashboardService->getMonthlyRevenue();

        return Inertia::render('Dashboard', [
            'kpiData' => $kpiData,
            'monthlyRevenue' => $monthlyRevenue,
        ]);
    }
}
