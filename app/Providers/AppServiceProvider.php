<?php

namespace App\Providers;

use App\Services\AcRecapAggregator;
use App\Services\AcRecapAggregatorInterface;
use App\Services\AcMeasurementValidator;
use App\Services\AcMeasurementValidatorInterface;
use App\Services\BapNumberGenerator;
use App\Services\BapNumberGeneratorInterface;
use App\Services\BastNumberGenerator;
use App\Services\BastNumberGeneratorInterface;
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
use App\Services\PresetRegistry;
use App\Services\PresetRegistryInterface;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(AcMeasurementValidatorInterface::class, AcMeasurementValidator::class);
        $this->app->bind(AcRecapAggregatorInterface::class, AcRecapAggregator::class);
        $this->app->bind(BapNumberGeneratorInterface::class, BapNumberGenerator::class);
        $this->app->bind(BastNumberGeneratorInterface::class, BastNumberGenerator::class);
        $this->app->bind(DashboardAggregationServiceInterface::class, DashboardAggregationService::class);
        $this->app->bind(InvoiceCalculationServiceInterface::class, InvoiceCalculationService::class);
        $this->app->bind(InvoiceNumberGeneratorInterface::class, InvoiceNumberGenerator::class);
        $this->app->bind(OverdueDetectionServiceInterface::class, OverdueDetectionService::class);
        $this->app->bind(PdfExportServiceInterface::class, PdfExportService::class);
        $this->app->bind(PresetRegistryInterface::class, PresetRegistry::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
