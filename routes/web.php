<?php

use App\Http\Controllers\BapController;
use App\Http\Controllers\BastController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\JobCategoryController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\WorkReportController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard (admin only)
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('role:admin')->name('dashboard');

    // Master Data (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::resource('clients', ClientController::class)->except(['show']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::resource('job-categories', JobCategoryController::class);
        Route::resource('services', ServiceController::class);
    });

    // Work Reports (both roles - admin and technician)
    Route::resource('work-reports', WorkReportController::class);
    Route::post('work-reports/{id}/submit', [WorkReportController::class, 'submit'])->name('work-reports.submit');

    // BAP (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::resource('baps', BapController::class);
        Route::post('baps/{id}/approve', [BapController::class, 'approve'])->name('baps.approve');
        Route::get('baps/{id}/pdf-preview', [BapController::class, 'previewPdf'])
            ->withoutMiddleware([\App\Http\Middleware\HandleInertiaRequests::class, \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class])
            ->name('baps.pdf-preview');
        Route::get('baps/{id}/export-pdf', [BapController::class, 'exportPdf'])
            ->withoutMiddleware([\App\Http\Middleware\HandleInertiaRequests::class, \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class])
            ->name('baps.export-pdf');
    });

    // BAST (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::resource('basts', BastController::class)->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']);
        Route::get('basts/{id}/pdf-preview', [BastController::class, 'previewPdf'])
            ->withoutMiddleware([\App\Http\Middleware\HandleInertiaRequests::class, \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class])
            ->name('basts.pdf-preview');
        Route::get('basts/{id}/export-pdf', [BastController::class, 'exportPdf'])
            ->withoutMiddleware([\App\Http\Middleware\HandleInertiaRequests::class, \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class])
            ->name('basts.export-pdf');
    });

    // Invoice (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::resource('invoices', InvoiceController::class)->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']);
        Route::post('invoices/{id}/mark-unpaid', [InvoiceController::class, 'markUnpaid'])->name('invoices.mark-unpaid');
        Route::post('invoices/{id}/mark-paid', [InvoiceController::class, 'markPaid'])->name('invoices.mark-paid');
        Route::get('invoices/{id}/pdf-preview', [InvoiceController::class, 'previewPdf'])
            ->withoutMiddleware([\App\Http\Middleware\HandleInertiaRequests::class, \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class])
            ->name('invoices.pdf-preview');
        Route::get('invoices/{id}/export-pdf', [InvoiceController::class, 'exportPdf'])
            ->withoutMiddleware([\App\Http\Middleware\HandleInertiaRequests::class, \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class])
            ->name('invoices.export-pdf');
    });

    // Company Settings (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('settings/company', [CompanySettingController::class, 'edit'])->name('settings.company');
        Route::post('settings/company', [CompanySettingController::class, 'update'])->name('settings.company.update');
        Route::delete('settings/company/logo', [CompanySettingController::class, 'removeLogo'])->name('settings.company.remove-logo');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
