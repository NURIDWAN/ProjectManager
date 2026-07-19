# Technical Design Document

## Overview

This document describes the technical architecture for the BAST (Berita Acara Serah Terima) Document Generator feature. The design follows existing patterns established by the BAP and Invoice features, using Laravel service-layer architecture with Inertia.js + React (TypeScript) frontend.

## Architecture

The BAST feature adds a new domain entity alongside BAP. The architecture follows the existing pattern:
- **Model**: `Bast` Eloquent model with relationships to `Bap` and `Client`
- **Controller**: `BastController` with DI for number generation and PDF export
- **Services**: `BastNumberGenerator` (interface+impl) and extended `PdfExportService`
- **Frontend**: React TSX pages (`Index`, `Create`, `Show`) rendered via Inertia
- **PDF**: Three Blade templates merged into a single PDF via `barryvdh/laravel-dompdf`

## Database Schema

### Migration: `create_basts_table`

```php
Schema::create('basts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('bap_id')->unique()->constrained('baps')->onDelete('restrict');
    $table->string('document_number')->unique();
    $table->date('tanggal');
    $table->foreignId('client_id')->constrained('clients')->onDelete('restrict');
    $table->string('pihak_pertama_1_nama', 255);
    $table->string('pihak_pertama_1_jabatan', 255);
    $table->string('pihak_pertama_2_nama', 255);
    $table->string('pihak_pertama_2_jabatan', 255);
    $table->string('pihak_kedua_1_nama', 255);
    $table->string('pihak_kedua_1_jabatan', 255);
    $table->string('pihak_kedua_2_nama', 255);
    $table->string('pihak_kedua_2_jabatan', 255);
    $table->timestamps();
});
```

Key constraints:
- `bap_id` has a `unique()` constraint enforcing one-to-one relationship (Requirement 1.2)
- `document_number` has a `unique()` constraint preventing duplicate numbers (Requirement 3.3)
- `onDelete('restrict')` prevents orphan records when BAP or Client is referenced

## Data Models

### Bast Model (`app/Models/Bast.php`)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bast extends Model
{
    use HasFactory;

    protected $fillable = [
        'bap_id',
        'document_number',
        'tanggal',
        'client_id',
        'pihak_pertama_1_nama',
        'pihak_pertama_1_jabatan',
        'pihak_pertama_2_nama',
        'pihak_pertama_2_jabatan',
        'pihak_kedua_1_nama',
        'pihak_kedua_1_jabatan',
        'pihak_kedua_2_nama',
        'pihak_kedua_2_jabatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }

    public function bap(): BelongsTo
    {
        return $this->belongsTo(Bap::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
```

### Relationship Updates

**Bap model** — add inverse relationship:
```php
public function bast(): HasOne
{
    return $this->hasOne(Bast::class);
}
```

**Client model** — add relationship:
```php
public function basts(): HasMany
{
    return $this->hasMany(Bast::class);
}
```

## Components and Interfaces

### BastNumberGeneratorInterface (`app/Services/BastNumberGeneratorInterface.php`)

```php
<?php

namespace App\Services;

interface BastNumberGeneratorInterface
{
    /**
     * Generate nomor dokumen BAST.
     * Format: BAST/XXXX/MM/YYYY
     * XXXX = nomor urut 4 digit auto-increment per tahun
     */
    public function generate(\DateTimeInterface $date): string;
}
```

### BastNumberGenerator (`app/Services/BastNumberGenerator.php`)

```php
<?php

namespace App\Services;

use App\Models\Bast;

class BastNumberGenerator implements BastNumberGeneratorInterface
{
    public function generate(\DateTimeInterface $date): string
    {
        $year = $date->format('Y');
        $month = $date->format('m');

        $lastBast = Bast::whereYear('tanggal', $year)
            ->orderByDesc('document_number')
            ->first();

        $nextNumber = 1;

        if ($lastBast) {
            // Extract XXXX portion (positions 5-8, after "BAST/")
            $nextNumber = (int) substr($lastBast->document_number, 5, 4) + 1;
        }

        return sprintf('BAST/%04d/%s/%s', $nextNumber, $month, $year);
    }
}
```

### PdfExportServiceInterface Extension

Add method to the existing interface:

```php
/**
 * Generate PDF for a BAST document.
 */
public function generateBastPdf(int $bastId): Response;
```

### PdfExportService — `generateBastPdf` Implementation

```php
public function generateBastPdf(int $bastId): Response
{
    $bast = Bast::with(['client', 'bap'])->findOrFail($bastId);
    $bap = $bast->bap;

    // Load work reports from BAP
    $workReports = WorkReport::with(['category', 'technician', 'beforePhotoItems', 'afterPhotoItems'])
        ->whereIn('id', $bap->work_report_ids ?? [])
        ->get();

    // Aggregate work items from Service model
    $workItems = $this->aggregateWorkItems($workReports);

    // AC recap rows (reuse existing aggregator)
    $acRecapRows = $this->acRecapAggregator->aggregate($workReports);

    $settings = CompanySetting::allSettings();

    // Render 3 Blade templates and combine into single HTML
    $coverHtml = view('pdf.bast.cover', [
        'bast' => $bast,
        'client' => $bast->client,
        'settings' => $settings,
    ])->render();

    $suratHtml = view('pdf.bast.surat', [
        'bast' => $bast,
        'client' => $bast->client,
        'workItems' => $workItems,
        'settings' => $settings,
    ])->render();

    $laporanHtml = view('pdf.bast.laporan', [
        'bast' => $bast,
        'client' => $bast->client,
        'workReports' => $workReports,
        'acRecapRows' => $acRecapRows,
        'settings' => $settings,
    ])->render();

    // Combine into single document with page breaks
    $combinedHtml = view('pdf.bast.layout', [
        'coverHtml' => $coverHtml,
        'suratHtml' => $suratHtml,
        'laporanHtml' => $laporanHtml,
    ])->render();

    $pdf = Pdf::loadHTML($combinedHtml);
    $pdf->setPaper('A4', 'portrait');

    $filename = 'BAST_' . str_replace('/', '-', $bast->document_number) . '.pdf';

    return $pdf->download($filename);
}
```

### Work Items Aggregation Logic

```php
/**
 * Aggregate services from work reports into work items table data.
 * Groups identical services, counting occurrences as Jumlah.
 */
private function aggregateWorkItems(Collection $workReports): array
{
    $serviceCount = [];

    foreach ($workReports as $report) {
        // Each work report is linked to services via invoice items or direct association
        // Based on existing data model, services are associated through InvoiceItem
        // For BAST, we query services linked to each work report's category/scope
        $services = Service::whereHas('invoiceItems', function ($q) use ($report) {
            $q->whereHas('invoice.bap', function ($q2) use ($report) {
                $q2->whereJsonContains('work_report_ids', $report->id);
            });
        })->get();

        foreach ($services as $service) {
            if (!isset($serviceCount[$service->id])) {
                $serviceCount[$service->id] = [
                    'service' => $service,
                    'jumlah' => 0,
                ];
            }
            $serviceCount[$service->id]['jumlah']++;
        }
    }

    $result = [];
    $no = 1;
    foreach ($serviceCount as $item) {
        $result[] = [
            'no' => $no++,
            'uraian_pekerjaan' => $item['service']->name,
            'satuan' => $item['service']->unit,
            'jumlah' => $item['jumlah'],
            'keterangan' => '',
        ];
    }

    return $result;
}
```

### AppServiceProvider Registration

```php
// Add to register() method:
$this->app->bind(BastNumberGeneratorInterface::class, BastNumberGenerator::class);
```

## Controller Design

### BastController (`app/Http/Controllers/BastController.php`)

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBastRequest;
use App\Models\Bap;
use App\Models\Bast;
use App\Models\Client;
use App\Models\CompanySetting;
use App\Services\BastNumberGeneratorInterface;
use App\Services\PdfExportServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class BastController extends Controller
{
    public function __construct(
        private BastNumberGeneratorInterface $numberGenerator,
        private PdfExportServiceInterface $pdfExportService
    ) {}
}
```

#### Controller Methods

**index(Request $request): Response**
- Queries `Bast::with(['client', 'bap'])` with optional `client_id` filter
- Orders by `created_at` descending, paginates by 10
- Returns Inertia page `Basts/Index` with basts, clients, and filters

**create(Request $request): Response**
- Accepts `bap_id` query parameter to pre-select a BAP
- Loads only approved BAPs that don't already have a BAST: `Bap::where('status', 'approved')->doesntHave('bast')->get()`
- Loads work items (services) for the selected BAP
- Auto-populates pihak_kedua from CompanySetting:
  - `project_coordinator_name` → pihak_kedua_1_nama
  - `operational_manager_name` → pihak_kedua_2_nama
- Returns Inertia page `Basts/Create`

**store(StoreBastRequest $request): RedirectResponse**
- Validates via `StoreBastRequest`
- Generates document number via `$this->numberGenerator->generate($tanggal)`
- Creates BAST record with client_id from the associated BAP
- Redirects to `basts.show` with success message

**show($id): Response**
- Loads BAST with relationships (`client`, `bap`)
- Loads work reports from BAP's `work_report_ids`
- Aggregates work items (services)
- Returns Inertia page `Basts/Show`

**destroy($id): RedirectResponse**
- Deletes BAST record (does not touch BAP)
- Redirects to `basts.index` with success message

**exportPdf($id)**
- Delegates to `$this->pdfExportService->generateBastPdf($id)`

## Form Request Validation

### StoreBastRequest (`app/Http/Requests/StoreBastRequest.php`)

```php
<?php

namespace App\Http\Requests;

use App\Models\Bap;
use App\Models\Bast;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreBastRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bap_id' => ['required', 'exists:baps,id'],
            'tanggal' => ['required', 'date'],
            'pihak_pertama_1_nama' => ['required', 'string', 'max:255'],
            'pihak_pertama_1_jabatan' => ['required', 'string', 'max:255'],
            'pihak_pertama_2_nama' => ['required', 'string', 'max:255'],
            'pihak_pertama_2_jabatan' => ['required', 'string', 'max:255'],
            'pihak_kedua_1_nama' => ['required', 'string', 'max:255'],
            'pihak_kedua_1_jabatan' => ['required', 'string', 'max:255'],
            'pihak_kedua_2_nama' => ['required', 'string', 'max:255'],
            'pihak_kedua_2_jabatan' => ['required', 'string', 'max:255'],
        ];
    }
```

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $bapId = $this->input('bap_id');
            if (!$bapId) return;

            $bap = Bap::find($bapId);

            // Must be approved
            if ($bap && $bap->status !== Bap::STATUS_APPROVED) {
                $validator->errors()->add(
                    'bap_id',
                    'Hanya BAP yang sudah di-approve yang dapat digunakan untuk BAST.'
                );
            }

            // Must not already have a BAST
            if ($bap && Bast::where('bap_id', $bapId)->exists()) {
                $validator->errors()->add(
                    'bap_id',
                    'BAP ini sudah memiliki dokumen BAST.'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'bap_id.required' => 'BAP wajib dipilih.',
            'bap_id.exists' => 'BAP yang dipilih tidak valid.',
            'tanggal.required' => 'Tanggal BAST wajib diisi.',
            'pihak_pertama_1_nama.required' => 'Nama Pihak Pertama 1 wajib diisi.',
            'pihak_pertama_1_jabatan.required' => 'Jabatan Pihak Pertama 1 wajib diisi.',
            'pihak_pertama_2_nama.required' => 'Nama Pihak Pertama 2 wajib diisi.',
            'pihak_pertama_2_jabatan.required' => 'Jabatan Pihak Pertama 2 wajib diisi.',
            'pihak_kedua_1_nama.required' => 'Nama Pihak Kedua 1 wajib diisi.',
            'pihak_kedua_1_jabatan.required' => 'Jabatan Pihak Kedua 1 wajib diisi.',
            'pihak_kedua_2_nama.required' => 'Nama Pihak Kedua 2 wajib diisi.',
            'pihak_kedua_2_jabatan.required' => 'Jabatan Pihak Kedua 2 wajib diisi.',
        ];
    }
}
```

## Routes

```php
// In routes/web.php, within the admin middleware group:
Route::middleware('role:admin')->group(function () {
    Route::resource('basts', BastController::class)->only(['index', 'create', 'store', 'show', 'destroy']);
    Route::get('basts/{id}/export-pdf', [BastController::class, 'exportPdf'])->name('basts.export-pdf');
});
```

## Frontend Pages

### TypeScript Interfaces

```typescript
interface Bast {
    id: number;
    bap_id: number;
    document_number: string;
    tanggal: string;
    client_id: number;
    pihak_pertama_1_nama: string;
    pihak_pertama_1_jabatan: string;
    pihak_pertama_2_nama: string;
    pihak_pertama_2_jabatan: string;
    pihak_kedua_1_nama: string;
    pihak_kedua_1_jabatan: string;
    pihak_kedua_2_nama: string;
    pihak_kedua_2_jabatan: string;
    created_at: string;
    updated_at: string;
    client?: Client;
    bap?: Bap;
}
```

```typescript
interface WorkItem {
    no: number;
    uraian_pekerjaan: string;
    satuan: string;
    jumlah: number;
    keterangan: string;
}
```

### Pages Structure (`resources/js/Pages/Basts/`)

**Index.tsx**
- Displays paginated table of BAST records (document number, client name, tanggal, BAP nomor surat)
- Client filter dropdown
- Link to Create page
- Each row links to Show page

**Create.tsx**
- Form with BAP selector (only approved BAPs without BAST)
- On BAP selection: auto-loads client info and work items table preview
- Pihak Pertama fields: editable inputs with default jabatan values ("Maintenance Manager", "Chief Engineering")
- Pihak Kedua fields: auto-populated from CompanySetting, editable
- Tanggal date picker
- Work items table (read-only preview derived from selected BAP's services)
- Submit button

**Show.tsx**
- Displays all BAST details: document number, tanggal, client, pihak pertama/kedua info
- Work items table
- Action buttons: Export PDF, Delete

## PDF Templates Structure

```
resources/views/pdf/bast/
├── layout.blade.php       # Combines 3 sections with page-break-before
├── cover.blade.php        # Cover page: client name, logo, month/year, company info
├── surat.blade.php        # Formal letter: header, parties, work items table, signatures
└── laporan.blade.php      # Work report details (reuses logic from bap.blade.php)
```

### layout.blade.php

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>BAST - {{ $bast->document_number ?? '' }}</title>
    <style>/* shared styles */</style>
</head>
<body>
    {!! $coverHtml !!}
    <div style="page-break-before: always;"></div>
    {!! $suratHtml !!}
    <div style="page-break-before: always;"></div>
    {!! $laporanHtml !!}
</body>
</html>
```

### cover.blade.php

Renders the decorative cover page with:
- Client logo (from `clients.logo` field, falls back to no image)
- Client name (large, centered)
- Month and year of BAST tanggal in Indonesian (e.g., "Januari 2025")
- Company name (from CompanySetting `company_name`)
- Company address (from CompanySetting `company_address`)
- Decorative border/design elements

### surat.blade.php

Renders the formal BAST letter with:
- Company header (logo, name, address — same pattern as `bap.blade.php` header)
- Document title: "BERITA ACARA PENYELESAIAN PEKERJAAN"
- Document number and date (Indonesian format, e.g., "Jakarta, 15 Januari 2025")
- Pihak Pertama section: client name and address
- Pihak Kedua section: company name and address
- Description paragraph about work completion scope
- Work Items Table:
  | No | Uraian Pekerjaan / Service Plan | Satuan | Jumlah | Keterangan |
- Closing paragraph
- Signature area (2 rows × 2 columns):
  - Row 1: Pihak Pertama 1 (nama + jabatan), Pihak Pertama 2 (nama + jabatan)
  - Row 2: Pihak Kedua 1 (nama + jabatan), Pihak Kedua 2 (nama + jabatan)

### laporan.blade.php

Renders work report details — reuses the same visual structure as the existing `bap.blade.php` detail section:
- Per work report: date, category, area, client, address
- Photo documentation (before/after grids)
- AC recap table if applicable (uses existing `pdf.partials.ac-recap-table`)

## Error Handling

| Scenario | Response |
|----------|----------|
| BAP not approved | 422 validation error: "Hanya BAP yang sudah di-approve yang dapat digunakan untuk BAST." |
| BAP already has BAST | 422 validation error: "BAP ini sudah memiliki dokumen BAST." |
| Empty pihak_pertama fields | 422 validation error with field-specific messages |
| BAST not found | 404 Not Found |
| PDF generation fails | 500 with logged exception |

## Data Flow

### BAST Creation Flow

```
User selects BAP → Create page loads →
  Auto-populates: client info, work items, pihak_kedua from CompanySetting
  User fills: pihak_pertama names, tanggal
  → POST /basts →
  StoreBastRequest validates (approved BAP, no duplicate, fields filled) →
  BastNumberGenerator generates document_number →
  Bast::create() persists record →
  Redirect to Show page
```

### PDF Export Flow

```
User clicks Export PDF on Show page →
  GET /basts/{id}/export-pdf →
  PdfExportService::generateBastPdf() →
    Load Bast + BAP + WorkReports + Services →
    Render cover.blade.php, surat.blade.php, laporan.blade.php →
    Combine in layout.blade.php →
    DomPDF generates PDF (A4, portrait) →
    Browser downloads BAST_{document-number}.pdf
```

## Testing Strategy

### Unit Tests
- **BastNumberGenerator**: Test format output for specific dates, sequential numbering, year reset
- **StoreBastRequest**: Test validation rules for required fields, BAP status check, duplicate prevention
- **Work Items Aggregation**: Test service grouping and count logic with known inputs

### Integration Tests
- **BastController**: Test full request lifecycle (create, show, index, destroy, export-pdf)
- **PDF Generation**: Test that `generateBastPdf` produces a valid PDF response with correct filename

### Property-Based Tests
- Properties 1-10 as defined in Correctness Properties section below
- Focus on: number generation (pure function), validation logic, aggregation logic, filename transformation

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: One-to-one BAP/BAST uniqueness

*For any* BAP that already has an associated BAST record, attempting to create a second BAST for the same BAP SHALL be rejected, ensuring no two BAST records share the same bap_id.

**Validates: Requirements 1.2, 2.4**

### Property 2: Client association consistency

*For any* BAST record created from a BAP, the BAST's client_id SHALL equal the client_id of its associated BAP record.

**Validates: Requirements 1.3**

### Property 3: Approved BAP guard

*For any* BAP with a status other than "approved", attempting to create a BAST from that BAP SHALL be rejected with a validation error.

**Validates: Requirements 2.2, 2.3**

### Property 4: Pihak pertama field validation

*For any* string that is empty or exceeds 255 characters, submitting a BAST creation form with that string in any pihak_pertama field SHALL be rejected by validation.

**Validates: Requirements 2.5**

### Property 5: Document number generation format and sequencing

*For any* date, the generated BAST document number SHALL match the format `BAST/XXXX/MM/YYYY` where XXXX is a zero-padded 4-digit number, MM is the two-digit month, and YYYY is the four-digit year. Furthermore, *for any* sequence of BAST creations within the same year, the XXXX portion SHALL be strictly monotonically increasing.

**Validates: Requirements 3.1, 3.2**

### Property 6: Service aggregation correctness

*For any* set of work reports within a BAP where multiple work reports reference the same service, the aggregated work items table SHALL contain exactly one row per unique service with `jumlah` equal to the count of work reports referencing that service.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: Client filter correctness

*For any* client filter applied to the BAST index listing, all returned BAST records SHALL have a client_id matching the filter value.

**Validates: Requirements 6.2**

### Property 8: Deletion integrity

*For any* BAST record that is deleted, the associated BAP record SHALL remain unchanged in the database (not deleted, not modified), and the BAST record SHALL no longer exist in the `basts` table.

**Validates: Requirements 8.1, 8.2**

### Property 9: PDF filename transformation

*For any* BAST document number, the exported PDF filename SHALL equal `"BAST_" + document_number.replace("/", "-") + ".pdf"`.

**Validates: Requirements 12.3**

### Property 10: Indonesian date formatting

*For any* valid date, the formal Indonesian date format used in the Surat BAST page SHALL produce a string matching the pattern "Jakarta, DD NamaBulan YYYY" where NamaBulan is the Indonesian month name (Januari, Februari, ..., Desember).

**Validates: Requirements 10.3**
