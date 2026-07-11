# Design Document

## Overview

Dokumen ini menjelaskan arsitektur dan desain teknis untuk aplikasi Manajemen Proyek yang dibangun dengan Laravel 11 + Inertia.js + React. Aplikasi menggunakan pendekatan monolitik dengan session-based authentication, di mana seluruh routing ditangani server-side oleh Laravel dan React menangani rendering UI melalui Inertia.js bridge. Frontend menggunakan **shadcn/ui** (dibangun di atas Radix UI primitives) sebagai component library utama untuk konsistensi UI dan aksesibilitas.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│            Browser (React + Inertia + shadcn/ui)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Dashboard │  │  Master  │  │  Laporan │  │BAP/Invoice│   │
│  │   Page    │  │  Data    │  │   Kerja  │  │   Pages   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  shadcn/ui (Radix UI Primitives + Tailwind CSS)     │    │
│  │  Button, Input, Table, Dialog, Select, Badge, etc.  │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ Inertia Protocol (XHR + JSON Props)
┌────────────────────────┴────────────────────────────────────┐
│                    Laravel 11 Application                     │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ Controllers  │  │   Services   │  │   Middleware     │    │
│  │             │  │              │  │  (Auth, Role)    │    │
│  └──────┬──────┘  └──────┬───────┘  └─────────────────┘    │
│         │                 │                                   │
│  ┌──────┴──────┐  ┌──────┴───────┐  ┌─────────────────┐    │
│  │   Models    │  │  PDF Service │  │  Storage (Foto)  │    │
│  │ (Eloquent)  │  │  (DomPDF)   │  │  (Local Disk)    │    │
│  └──────┬──────┘  └─────────────┘  └─────────────────┘    │
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────┴───────────────────────────────────────────────────┐
│              MySQL / MariaDB (prod) | SQLite (dev)            │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Backend Components (Laravel)

#### Controllers

| Controller | Tanggung Jawab |
|---|---|
| `AuthController` | Login, register, logout (via Breeze) |
| `DashboardController` | Agregasi KPI dan data grafik |
| `ClientController` | CRUD klien, pencarian, soft-delete |
| `JobCategoryController` | CRUD kategori pekerjaan |
| `ServiceController` | CRUD jasa/produk, filter |
| `WorkReportController` | CRUD laporan kerja, submit, upload foto |
| `BapController` | Pembuatan BAP, approve, export PDF |
| `InvoiceController` | Generate invoice, kalkulasi, status, export PDF |

#### Services

| Service | Tanggung Jawab |
|---|---|
| `InvoiceCalculationService` | Hitung line_total, subtotal, PPN, diskon, grand_total |
| `BapNumberGenerator` | Generate nomor surat BAP/XXXX/MM/YYYY |
| `InvoiceNumberGenerator` | Generate nomor invoice unik |
| `OverdueDetectionService` | Deteksi dan update status overdue |
| `PdfExportService` | Generate PDF BAP dan Invoice via DomPDF |
| `DashboardAggregationService` | Hitung KPI dan data grafik |

#### Middleware

| Middleware | Tanggung Jawab |
|---|---|
| `RoleMiddleware` | Membatasi akses route berdasarkan role (admin/technician) |
| `CheckOverdueInvoices` | Scheduled check untuk update status overdue |

#### Scheduled Commands

| Command | Jadwal | Tanggung Jawab |
|---|---|---|
| `invoice:check-overdue` | Harian (00:01) | Cek invoice unpaid yang melewati due_date, ubah ke overdue |

### 2. Frontend Components (React + Inertia + shadcn/ui)

#### Layout Components

| Component | Deskripsi |
|---|---|
| `AuthenticatedLayout` | Layout utama dengan sidebar navigation |
| `GuestLayout` | Layout untuk halaman login/register |

#### Page Components

| Page | Route | Deskripsi |
|---|---|---|
| `Dashboard/Index` | `/dashboard` | KPI cards + grafik pendapatan |
| `Clients/Index` | `/clients` | Daftar klien dengan pencarian |
| `Clients/Create` | `/clients/create` | Form tambah klien |
| `Clients/Edit` | `/clients/{id}/edit` | Form edit klien |
| `JobCategories/Index` | `/job-categories` | Daftar kategori |
| `JobCategories/Create` | `/job-categories/create` | Form tambah kategori |
| `Services/Index` | `/services` | Daftar jasa/produk |
| `Services/Create` | `/services/create` | Form tambah jasa/produk |
| `WorkReports/Index` | `/work-reports` | Daftar laporan kerja |
| `WorkReports/Create` | `/work-reports/create` | Form input laporan |
| `WorkReports/Show` | `/work-reports/{id}` | Detail laporan |
| `Baps/Index` | `/baps` | Daftar BAP |
| `Baps/Create` | `/baps/create` | Form buat BAP |
| `Baps/Show` | `/baps/{id}` | Detail BAP |
| `Invoices/Index` | `/invoices` | Daftar invoice |
| `Invoices/Create` | `/invoices/create` | Form buat invoice |
| `Invoices/Show` | `/invoices/{id}` | Detail invoice |

#### Reusable UI Components

Semua komponen UI utama menggunakan **shadcn/ui** yang dibangun di atas **Radix UI primitives** + Tailwind CSS. Komponen di-copy langsung ke `resources/js/Components/ui/` dan dapat di-customize sesuai kebutuhan.

| Component | Basis shadcn/ui | Deskripsi |
|---|---|---|
| `DataTable` | `Table` + `DataTable` pattern | Tabel dengan sorting, pagination, dan filter menggunakan TanStack Table |
| `StatusBadge` | `Badge` | Badge warna sesuai status (draft, submitted, approved, dll) dengan variant styling |
| `ConfirmModal` | `AlertDialog` | Dialog konfirmasi untuk aksi destruktif dengan Radix UI accessible overlay |
| `KpiCard` | `Card` | Card menampilkan label + nilai (total klien, invoice, dll) |
| `FileUpload` | `Input` (file) + custom preview | Komponen upload foto dengan drag-drop area dan preview thumbnail |
| `RevenueChart` | Recharts (native) | Grafik garis Recharts untuk pendapatan bulanan (shadcn/ui charts juga berbasis Recharts) |

#### Komponen shadcn/ui Umum yang Digunakan

| Component shadcn/ui | Penggunaan |
|---|---|
| `Button` | Tombol aksi (submit, cancel, export, dll) |
| `Input` | Input teks, email, password, number |
| `Label` | Label form field |
| `Select` | Dropdown pilihan (klien, kategori, status, dll) |
| `Form` | Wrapper form dengan validasi (React Hook Form + Zod) |
| `Dialog` | Modal form (create/edit entity) |
| `AlertDialog` | Konfirmasi aksi destruktif (hapus, approve) |
| `DropdownMenu` | Menu konteks aksi per baris tabel |
| `Sheet` | Navigasi mobile/tablet (sidebar slide-in) |
| `Separator` | Pemisah visual antar section |
| `Skeleton` | Loading state placeholder |
| `Toast` / `Sonner` | Notifikasi sukses/error |
| `Tabs` | Navigasi tab pada halaman detail |

### Service Interfaces

#### API Routes (Inertia Server-Side)

Semua route menggunakan Inertia protocol — bukan REST API tradisional. Controller me-return `Inertia::render()` dengan props.

```php
// routes/web.php

// Auth (Laravel Breeze)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'create']);
    Route::post('/login', [AuthController::class, 'store']);
    Route::get('/register', [AuthController::class, 'create']);
    Route::post('/register', [AuthController::class, 'store']);
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard (admin only)
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('role:admin');

    // Master Data (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::resource('clients', ClientController::class);
        Route::resource('job-categories', JobCategoryController::class);
        Route::resource('services', ServiceController::class);
    });

    // Laporan Kerja (kedua role)
    Route::resource('work-reports', WorkReportController::class);
    Route::post('work-reports/{id}/submit', [WorkReportController::class, 'submit']);

    // BAP (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::resource('baps', BapController::class);
        Route::post('baps/{id}/approve', [BapController::class, 'approve']);
        Route::get('baps/{id}/export-pdf', [BapController::class, 'exportPdf']);
    });

    // Invoice (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::resource('invoices', InvoiceController::class);
        Route::post('invoices/{id}/mark-unpaid', [InvoiceController::class, 'markUnpaid']);
        Route::post('invoices/{id}/mark-paid', [InvoiceController::class, 'markPaid']);
        Route::get('invoices/{id}/export-pdf', [InvoiceController::class, 'exportPdf']);
    });
});
```

#### Service Layer Interfaces

```php
// app/Services/InvoiceCalculationService.php
interface InvoiceCalculationServiceInterface
{
    /**
     * Hitung line_total untuk satu item.
     * line_total = quantity * unit_price * (1 - discount_percent / 100)
     */
    public function calculateLineTotal(
        float $quantity,
        float $unitPrice,
        float $discountPercent = 0
    ): float;

    /**
     * Hitung subtotal dari kumpulan line_totals.
     * subtotal = sum(line_totals)
     */
    public function calculateSubtotal(array $lineTotals): float;

    /**
     * Hitung PPN.
     * ppn = (subtotal - discountTotal) * 0.11
     */
    public function calculatePpn(float $subtotal, float $discountTotal = 0): float;

    /**
     * Hitung grand total.
     * grand_total = subtotal - discountTotal + ppn
     */
    public function calculateGrandTotal(
        float $subtotal,
        float $discountTotal,
        float $ppn
    ): float;
}
```

```php
// app/Services/BapNumberGenerator.php
interface BapNumberGeneratorInterface
{
    /**
     * Generate nomor surat BAP.
     * Format: BAP/XXXX/MM/YYYY
     * XXXX = nomor urut 4 digit auto-increment per tahun
     */
    public function generate(\DateTimeInterface $date): string;
}
```

```php
// app/Services/OverdueDetectionService.php
interface OverdueDetectionServiceInterface
{
    /**
     * Cek dan update semua invoice unpaid yang sudah melewati due_date.
     * Return jumlah invoice yang di-update ke overdue.
     */
    public function detectAndUpdateOverdue(): int;
}
```

```php
// app/Services/DashboardAggregationService.php
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
```

## Data Models

### Eloquent Models & Relationships

```php
// app/Models/User.php
class User extends Authenticatable
{
    protected $fillable = ['name', 'email', 'password', 'role'];
    protected $hidden = ['password', 'remember_token'];

    const ROLE_ADMIN = 'admin';
    const ROLE_TECHNICIAN = 'technician';

    public function workReports(): HasMany { /* ... */ }
    public function isAdmin(): bool { return $this->role === self::ROLE_ADMIN; }
    public function isTechnician(): bool { return $this->role === self::ROLE_TECHNICIAN; }
}
```

```php
// app/Models/Client.php
class Client extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'npwp', 'address', 'pic_name', 'pic_phone', 'is_active'
    ];
    protected $casts = ['is_active' => 'boolean'];

    public function workReports(): HasMany { /* ... */ }
    public function baps(): HasMany { /* ... */ }
    public function invoices(): HasMany { /* ... */ }

    public function scopeActive($query) { return $query->where('is_active', true); }
}
```

```php
// app/Models/JobCategory.php
class JobCategory extends Model
{
    protected $fillable = ['name', 'description'];

    public function workReports(): HasMany { /* ... */ }
}
```

```php
// app/Models/Service.php
class Service extends Model
{
    protected $fillable = [
        'code', 'name', 'unit', 'price', 'type', 'is_active'
    ];
    protected $casts = ['price' => 'decimal:2', 'is_active' => 'boolean'];

    const TYPE_SERVICE = 'service';
    const TYPE_PRODUCT = 'product';

    public function invoiceItems(): HasMany { /* ... */ }
    public function scopeActive($query) { return $query->where('is_active', true); }
}
```

```php
// app/Models/WorkReport.php
class WorkReport extends Model
{
    protected $fillable = [
        'client_id', 'category_id', 'technician_id',
        'description', 'status', 'submitted_at',
        'before_photos', 'after_photos'
    ];
    protected $casts = [
        'before_photos' => 'array',
        'after_photos' => 'array',
        'submitted_at' => 'datetime',
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_SUBMITTED = 'submitted';

    public function client(): BelongsTo { /* ... */ }
    public function category(): BelongsTo { /* ... */ }
    public function technician(): BelongsTo { /* ... */ }
}
```

```php
// app/Models/Bap.php
class Bap extends Model
{
    protected $fillable = [
        'nomor_surat', 'client_id', 'tanggal', 'status',
        'work_report_ids', 'signed_by'
    ];
    protected $casts = [
        'work_report_ids' => 'array',
        'tanggal' => 'date',
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_APPROVED = 'approved';

    public function client(): BelongsTo { /* ... */ }
    public function invoice(): HasOne { /* ... */ }
}
```

```php
// app/Models/Invoice.php
class Invoice extends Model
{
    protected $fillable = [
        'invoice_number', 'bap_id', 'client_id',
        'subtotal', 'discount_total', 'ppn', 'grand_total',
        'due_date', 'status', 'paid_at'
    ];
    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'ppn' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_UNPAID = 'unpaid';
    const STATUS_OVERDUE = 'overdue';
    const STATUS_PAID = 'paid';

    public function bap(): BelongsTo { /* ... */ }
    public function client(): BelongsTo { /* ... */ }
    public function items(): HasMany { /* ... */ }
}
```

```php
// app/Models/InvoiceItem.php
class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id', 'service_id', 'quantity',
        'unit_price', 'discount_percent', 'line_total'
    ];
    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function invoice(): BelongsTo { /* ... */ }
    public function service(): BelongsTo { /* ... */ }
}
```

### Database Migrations

```php
// Tabel utama sesuai ERD di PRD
Schema::create('clients', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('npwp')->nullable();
    $table->text('address');
    $table->string('pic_name')->nullable();
    $table->string('pic_phone')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});

Schema::create('job_categories', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique();
    $table->text('description')->nullable();
    $table->timestamps();
});

Schema::create('services', function (Blueprint $table) {
    $table->id();
    $table->string('code')->unique();
    $table->string('name');
    $table->string('unit');
    $table->decimal('price', 15, 2);
    $table->enum('type', ['service', 'product']);
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

Schema::create('work_reports', function (Blueprint $table) {
    $table->id();
    $table->foreignId('client_id')->constrained();
    $table->foreignId('category_id')->constrained('job_categories');
    $table->foreignId('technician_id')->constrained('users');
    $table->text('description')->nullable();
    $table->enum('status', ['draft', 'submitted'])->default('draft');
    $table->timestamp('submitted_at')->nullable();
    $table->json('before_photos')->nullable();
    $table->json('after_photos')->nullable();
    $table->timestamps();
});

Schema::create('baps', function (Blueprint $table) {
    $table->id();
    $table->string('nomor_surat')->unique();
    $table->foreignId('client_id')->constrained();
    $table->date('tanggal');
    $table->enum('status', ['draft', 'approved'])->default('draft');
    $table->json('work_report_ids');
    $table->string('signed_by')->nullable();
    $table->timestamps();
});

Schema::create('invoices', function (Blueprint $table) {
    $table->id();
    $table->string('invoice_number')->unique();
    $table->foreignId('bap_id')->constrained();
    $table->foreignId('client_id')->constrained();
    $table->decimal('subtotal', 15, 2)->default(0);
    $table->decimal('discount_total', 15, 2)->default(0);
    $table->decimal('ppn', 15, 2)->default(0);
    $table->decimal('grand_total', 15, 2)->default(0);
    $table->date('due_date')->nullable();
    $table->enum('status', ['draft', 'unpaid', 'overdue', 'paid'])->default('draft');
    $table->timestamp('paid_at')->nullable();
    $table->timestamps();
});

Schema::create('invoice_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
    $table->foreignId('service_id')->constrained();
    $table->decimal('quantity', 10, 2);
    $table->decimal('unit_price', 15, 2);
    $table->decimal('discount_percent', 5, 2)->default(0);
    $table->decimal('line_total', 15, 2);
    $table->timestamps();
});
```

## Error Handling

### Validation Errors

Semua validasi menggunakan Laravel Form Request. Error dikembalikan ke frontend via Inertia shared errors dan ditampilkan inline di form.

```php
// app/Http/Requests/StoreClientRequest.php
class StoreClientRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'npwp' => ['nullable', 'string', 'max:50'],
            'pic_name' => ['nullable', 'string', 'max:255'],
            'pic_phone' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
        ];
    }
}
```

### Business Rule Violations

| Skenario | Handling |
|---|---|
| Hapus klien yang memiliki relasi | Flash error message, suggest soft-delete |
| Hapus kategori yang digunakan | Return 422 dengan pesan "Kategori masih digunakan" |
| Edit laporan yang sudah submitted | Return 403 Forbidden |
| Edit BAP yang sudah approved | Return 403 Forbidden |
| Edit invoice yang sudah paid | Return 403 Forbidden |
| Buat BAP dari laporan berbeda klien | Return 422 dengan pesan validasi |
| Ubah invoice ke unpaid tanpa due_date | Return 422 dengan pesan validasi |

### File Upload Errors

| Skenario | Handling |
|---|---|
| Format file tidak didukung | Return 422, "Format file harus JPG, JPEG, atau PNG" |
| Ukuran file melebihi 2MB | Return 422, "Ukuran file maksimal 2MB" |
| Gagal menyimpan ke storage | Return 500, log error, tampilkan generic error |

### PDF Generation Errors

| Skenario | Handling |
|---|---|
| Data tidak lengkap untuk PDF | Return 422 dengan field yang kurang |
| DomPDF gagal render | Return 500, log error, retry notification ke admin |

## Key Design Decisions

### 1. Nomor Surat BAP Auto-Increment

Nomor surat menggunakan format `BAP/XXXX/MM/YYYY` di mana XXXX di-reset setiap tahun baru. Implementasi menggunakan query MAX pada tabel `baps` yang sudah ada di tahun tersebut:

```php
// app/Services/BapNumberGenerator.php
public function generate(\DateTimeInterface $date): string
{
    $year = $date->format('Y');
    $month = $date->format('m');

    $lastBap = Bap::whereYear('tanggal', $year)
        ->orderByDesc('nomor_surat')
        ->first();

    $nextNumber = $lastBap
        ? (int) substr($lastBap->nomor_surat, 4, 4) + 1
        : 1;

    return sprintf('BAP/%04d/%s/%s', $nextNumber, $month, $year);
}
```

### 2. Invoice Item Auto-Population

Saat invoice dibuat dari BAP, item diambil dari tabel `services` yang aktif. Admin dapat menambah/hapus/edit item sebelum finalisasi. Relasi antara kategori pekerjaan dan services bisa melalui pivot table atau manual selection.

### 3. Overdue Detection

Menggunakan Laravel Scheduled Command yang berjalan harian:

```php
// app/Console/Commands/CheckOverdueInvoices.php
protected $signature = 'invoice:check-overdue';

public function handle(OverdueDetectionService $service): int
{
    $count = $service->detectAndUpdateOverdue();
    $this->info("Updated {$count} invoices to overdue status.");
    return Command::SUCCESS;
}
```

Sebagai backup, middleware `CheckOverdueInvoices` juga bisa melakukan pengecekan saat admin mengakses halaman invoice (lazy check).

### 4. File Storage Strategy

Foto disimpan di `storage/app/public/work-reports/{report_id}/` dengan nama file yang di-hash. Symlink `storage:link` untuk akses publik. Path disimpan sebagai JSON array di kolom `before_photos` dan `after_photos`.

### 5. PDF Template

PDF menggunakan Blade view yang di-render oleh DomPDF. Template terpisah untuk BAP dan Invoice, disimpan di `resources/views/pdf/`.

### 6. shadcn/ui sebagai Component Library

Menggunakan **shadcn/ui** sebagai library komponen UI utama. shadcn/ui bukan package dependency — melainkan koleksi komponen copy-paste yang dibangun di atas **Radix UI primitives** dan di-styling dengan Tailwind CSS. Keuntungan pendekatan ini:

- **Ownership penuh**: Komponen di-copy ke `resources/js/Components/ui/`, bisa di-customize tanpa batasan
- **Accessible by default**: Radix UI primitives menangani keyboard navigation, focus management, dan ARIA attributes
- **Konsisten dengan Tailwind**: Styling menggunakan Tailwind CSS utility classes + CSS variables untuk theming
- **Tidak menambah bundle dependency**: Tidak ada runtime library tambahan (selain Radix UI primitives yang ringan)
- **Composable**: Komponen bisa di-compose dan di-extend sesuai kebutuhan bisnis

Instalasi via CLI: `npx shadcn@latest init` kemudian `npx shadcn@latest add [component]` untuk setiap komponen yang dibutuhkan.

## Testing Strategy

### Unit Tests (PHPUnit)

- **Services**: Test `InvoiceCalculationService`, `BapNumberGenerator`, `OverdueDetectionService`, `DashboardAggregationService` secara isolasi
- **Form Requests**: Test validasi rules untuk setiap form request
- **Models**: Test scopes, casts, dan relasi
- **Middleware**: Test `RoleMiddleware` untuk akses kontrol

### Feature Tests (PHPUnit + Laravel TestCase)

- **Controllers**: Test setiap endpoint dengan berbagai skenario (happy path, unauthorized, validation error)
- **Status transitions**: Test alur status Draft → Submitted → Approved / Unpaid → Overdue → Paid
- **File upload**: Test upload foto dengan berbagai format dan ukuran
- **PDF export**: Test bahwa PDF di-generate tanpa error

### Property-Based Tests

- Fokus pada pure functions: `InvoiceCalculationService` (Property 11)
- Fokus pada business rules: validasi input (Property 3, 7), filtering (Property 4, 5), status immutability (Property 8)
- Minimum 100 iterasi per property test

### Frontend Tests (Vitest + React Testing Library)

- **Component rendering**: Test KPI cards, DataTable, StatusBadge
- **Form interactions**: Test real-time recalculation pada invoice items
- **Navigation**: Test role-based menu visibility

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role-based redirect setelah login

*For any* user yang berhasil login, jika role-nya adalah "admin" maka harus diarahkan ke `/dashboard`, dan jika role-nya adalah "technician" maka harus diarahkan ke `/work-reports`.

**Validates: Requirements 1.3, 1.5**

### Property 2: Role-based access control

*For any* route yang dilindungi middleware `role:admin`, request dari user dengan role "technician" harus ditolak (403), dan request dari user dengan role "admin" harus diizinkan.

**Validates: Requirements 1.5**

### Property 3: Validasi data master menolak input tidak valid

*For any* input ke form Klien dengan field `name` atau `address` kosong, penyimpanan harus gagal dengan validation error. *For any* input ke form Kategori Pekerjaan dengan field `name` kosong atau nama yang sudah ada, penyimpanan harus gagal. *For any* input ke form Jasa/Produk dengan `code` duplikat, `name` kosong, atau `price` ≤ 0, penyimpanan harus gagal.

**Validates: Requirements 2.2, 3.2, 4.2**

### Property 4: Entity aktif/nonaktif filtering

*For any* Klien yang berstatus `is_active = false`, klien tersebut tidak boleh muncul di dropdown pilihan pada form Laporan Kerja. *For any* Jasa/Produk yang berstatus `is_active = false`, item tersebut tidak boleh muncul di pilihan pembuatan invoice baru, tetapi tetap harus tampil pada Invoice_Item yang sudah ada.

**Validates: Requirements 2.4, 4.4, 5.2**

### Property 5: Pencarian dan filter menghasilkan hasil yang tepat

*For any* query pencarian pada daftar Klien, semua hasil yang dikembalikan harus mengandung string pencarian di field `name` atau `npwp`. *For any* filter yang diterapkan pada daftar Laporan Kerja (status, klien, rentang tanggal) atau daftar Invoice (status, klien), semua hasil harus memenuhi kriteria filter.

**Validates: Requirements 2.3, 6.2, 10.5**

### Property 6: Validasi upload foto

*For any* file yang di-upload pada form Laporan Kerja, jika format file bukan JPG, JPEG, atau PNG, atau ukuran file melebihi 2MB, maka upload harus ditolak dengan pesan error yang sesuai.

**Validates: Requirements 5.3**

### Property 7: Draft menerima semua input, Submit memerlukan field wajib

*For any* data Laporan Kerja yang disimpan sebagai Draft, penyimpanan harus berhasil terlepas dari kelengkapan field. *For any* data Laporan Kerja yang di-Submit, penyimpanan harus gagal jika field Klien, Kategori Pekerjaan, atau deskripsi kosong, atau tidak ada foto sesudah.

**Validates: Requirements 5.4, 5.5**

### Property 8: Immutabilitas setelah status final

*For any* Laporan Kerja berstatus "submitted", percobaan edit atau hapus oleh Teknisi harus ditolak (403). *For any* BAP berstatus "approved", percobaan perubahan harus ditolak. *For any* Invoice berstatus "paid", percobaan perubahan harus ditolak.

**Validates: Requirements 5.7, 7.6, 10.4**

### Property 9: Nomor surat BAP mengikuti format dan urutan

*For any* BAP yang dibuat, nomor surat harus mengikuti format `BAP/XXXX/MM/YYYY` di mana XXXX adalah 4 digit angka, MM adalah bulan 2 digit, dan YYYY adalah tahun 4 digit. *For any* dua BAP yang dibuat pada tahun yang sama, BAP kedua harus memiliki nomor urut XXXX yang lebih besar dari BAP pertama.

**Validates: Requirements 7.3**

### Property 10: BAP hanya dari laporan submitted klien yang sama

*For any* kumpulan Laporan Kerja yang dipilih untuk BAP, jika ada laporan dengan status bukan "submitted" atau klien yang berbeda dari laporan lainnya, maka pembuatan BAP harus ditolak.

**Validates: Requirements 7.1**

### Property 11: Konsistensi perhitungan invoice

*For any* Invoice Item dengan quantity `q`, unit_price `p`, dan discount_percent `d`, maka `line_total = q * p * (1 - d/100)`. *For any* Invoice dengan kumpulan items, `subtotal = sum(line_totals)`, `ppn = (subtotal - discount_total) * 0.11`, dan `grand_total = subtotal - discount_total + ppn`.

**Validates: Requirements 9.4, 9.5, 9.6, 9.7**

### Property 12: Transisi status invoice memerlukan due_date

*For any* Invoice yang akan diubah dari status "draft" ke "unpaid", jika field `due_date` belum terisi, maka perubahan status harus ditolak.

**Validates: Requirements 9.9, 10.1**

### Property 13: Deteksi overdue otomatis

*For any* Invoice berstatus "unpaid" yang memiliki `due_date` sebelum tanggal hari ini, setelah proses deteksi overdue dijalankan, status invoice tersebut harus berubah menjadi "overdue".

**Validates: Requirements 10.2**

### Property 14: Isolasi data teknisi

*For any* Teknisi yang mengakses daftar Laporan Kerja, semua laporan yang dikembalikan harus memiliki `technician_id` yang sama dengan ID teknisi tersebut. Tidak ada laporan milik teknisi lain yang muncul.

**Validates: Requirements 6.4**

### Property 15: Akurasi KPI dashboard

*For any* state database, KPI "Total Klien Aktif" harus sama dengan `COUNT(clients WHERE is_active = true)`. KPI "Pekerjaan Bulan Ini" harus sama dengan `COUNT(work_reports WHERE status = 'submitted' AND submitted_at dalam bulan berjalan)`. KPI "Total Invoice Unpaid" harus sama dengan `SUM(grand_total FROM invoices WHERE status IN ('unpaid', 'overdue'))`.

**Validates: Requirements 12.1, 12.2, 12.3, 12.5**
