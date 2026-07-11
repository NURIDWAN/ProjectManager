<?php

use App\Http\Controllers\BapController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\JobCategoryController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\WorkReportController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
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
        Route::get('baps/{id}/export-pdf', [BapController::class, 'exportPdf'])->name('baps.export-pdf');
    });

    // Invoice (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::resource('invoices', InvoiceController::class)->only(['index', 'create', 'store', 'show']);
        Route::post('invoices/{id}/mark-unpaid', [InvoiceController::class, 'markUnpaid'])->name('invoices.mark-unpaid');
        Route::post('invoices/{id}/mark-paid', [InvoiceController::class, 'markPaid'])->name('invoices.mark-paid');
        Route::get('invoices/{id}/export-pdf', [InvoiceController::class, 'exportPdf'])->name('invoices.export-pdf');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
