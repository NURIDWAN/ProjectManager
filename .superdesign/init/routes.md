# Page & Route Structure

## Router Configuration (`routes/web.php`)

```php
<?php

use App\Http\Controllers\BapController;
use App\Http\Controllers\BastController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\JobCategoryController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkReportController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('role:admin')->name('dashboard');

    Route::middleware('role:admin')->group(function () {
        Route::resource('clients', ClientController::class)->except(['show']);
        Route::resource('job-categories', JobCategoryController::class);
        Route::resource('services', ServiceController::class);
    });

    Route::middleware('role:admin|technician|staff')->group(function () {
        Route::resource('work-reports', WorkReportController::class);
    });

    Route::middleware('role:admin')->group(function () {
        Route::resource('baps', BapController::class);
        Route::resource('basts', BastController::class);
        Route::resource('invoices', InvoiceController::class);
        Route::get('settings/company', [CompanySettingController::class, 'edit'])->name('settings.company');
        Route::resource('users', UserController::class);
        Route::resource('roles', RoleController::class);
    });
});
```

## Route & Page Component Map

| URL Path | Component File Path | Layout Used | User Roles | Purpose Summary |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `resources/js/Pages/Auth/Login.tsx` | `GuestLayout` | Guest | User authentication login page |
| `/dashboard` | `resources/js/Pages/Dashboard.tsx` | `AuthenticatedLayout` | Admin | Overview dashboard with KPI cards, revenue charts, and operational recaps |
| `/clients` | `resources/js/Pages/Clients/Index.tsx` | `AuthenticatedLayout` | Admin | Client management data table and modal forms |
| `/job-categories` | `resources/js/Pages/JobCategories/Index.tsx` | `AuthenticatedLayout` | Admin | Master data for job categories |
| `/services` | `resources/js/Pages/Services/Index.tsx` | `AuthenticatedLayout` | Admin | Master data for services and products |
| `/work-reports` | `resources/js/Pages/WorkReports/Index.tsx` | `AuthenticatedLayout` | Admin, Tech, Staff | Field work report management, filters, and list |
| `/work-reports/create` | `resources/js/Pages/WorkReports/Create.tsx` | `AuthenticatedLayout` | Tech, Staff | Form for creating work reports with AC measurements & photo uploads |
| `/work-reports/{id}` | `resources/js/Pages/WorkReports/Show.tsx` | `AuthenticatedLayout` | Admin, Tech, Staff | Detailed view of work report with photo gallery and documentation |
| `/baps` | `resources/js/Pages/Baps/Index.tsx` | `AuthenticatedLayout` | Admin | Berita Acara Pemeriksaan (BAP) document list |
| `/basts` | `resources/js/Pages/Basts/Index.tsx` | `AuthenticatedLayout` | Admin | Berita Acara Serah Terima (BAST) document list |
| `/invoices` | `resources/js/Pages/Invoices/Index.tsx` | `AuthenticatedLayout` | Admin | Invoice management, payment status tracking, PDF previews |
| `/settings/company` | `resources/js/Pages/Settings/Company.tsx` | `AuthenticatedLayout` | Admin | Company settings, branding logo, and document footers |
| `/users` | `resources/js/Pages/Users/Index.tsx` | `AuthenticatedLayout` | Admin | User account administration |
| `/roles` | `resources/js/Pages/Roles/Index.tsx` | `AuthenticatedLayout` | Admin | Role-based access control management |
| `/profile` | `resources/js/Pages/Profile/Edit.tsx` | `AuthenticatedLayout` | All Auth Users | User profile management |
