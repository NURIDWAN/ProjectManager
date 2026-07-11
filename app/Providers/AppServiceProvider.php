<?php

namespace App\Providers;

use App\Services\BapNumberGenerator;
use App\Services\BapNumberGeneratorInterface;
use App\Services\DashboardAggregationService;
use App\Services\DashboardAggregationServiceInterface;
use App\Services\InvoiceCalculationService;
use App\Services\InvoiceCalculationServiceInterface;
use App\Services\InvoiceNumberGenerator;
use App\Services\InvoiceNumberGeneratorInterface;
use App\Services\OverdueDetectionService;
use App\Services\OverdueDetectionServiceInterface;
use App\Services\PdfExportService;
use App\Services\PdfExportServiceInterface;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(BapNumberGeneratorInterface::class, BapNumberGenerator::class);
        $this->app->bind(DashboardAggregationServiceInterface::class, DashboardAggregationService::class);
        $this->app->bind(InvoiceCalculationServiceInterface::class, InvoiceCalculationService::class);
        $this->app->bind(InvoiceNumberGeneratorInterface::class, InvoiceNumberGenerator::class);
        $this->app->bind(OverdueDetectionServiceInterface::class, OverdueDetectionService::class);
        $this->app->bind(PdfExportServiceInterface::class, PdfExportService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
