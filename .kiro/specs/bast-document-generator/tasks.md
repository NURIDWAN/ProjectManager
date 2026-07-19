    # Implementation Plan: BAST Document Generator

## Overview

Implementasi fitur BAST (Berita Acara Serah Terima) Document Generator menggunakan Laravel + Inertia.js + React (TypeScript). Build order: Migration & Model → Service Layer → Controller & Validation → Frontend Pages → PDF Templates → Wiring & Routes. Setiap task membangun di atas task sebelumnya, memastikan tidak ada kode orphan.

## Tasks

- [x] 1. Database migration dan Bast model
  - [x] 1.1 Buat migration `create_basts_table`
    - Buat file migration dengan schema sesuai design: id, bap_id (foreignId unique, constrained to baps, onDelete restrict), document_number (string unique), tanggal (date), client_id (foreignId constrained to clients, onDelete restrict), pihak_pertama_1_nama, pihak_pertama_1_jabatan, pihak_pertama_2_nama, pihak_pertama_2_jabatan, pihak_kedua_1_nama, pihak_kedua_1_jabatan, pihak_kedua_2_nama, pihak_kedua_2_jabatan (all string 255), timestamps
    - _Requirements: 1.1, 1.2, 3.3_

  - [x] 1.2 Buat Bast Eloquent model
    - Buat `app/Models/Bast.php` dengan fillable fields, date cast untuk tanggal, relationships: `bap()` BelongsTo dan `client()` BelongsTo
    - Tambahkan `bast(): HasOne` relationship di `Bap` model
    - Tambahkan `basts(): HasMany` relationship di `Client` model
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Service layer — BastNumberGenerator
  - [x] 2.1 Buat BastNumberGeneratorInterface dan BastNumberGenerator
    - Buat `app/Services/BastNumberGeneratorInterface.php` dengan method `generate(\DateTimeInterface $date): string`
    - Buat `app/Services/BastNumberGenerator.php` yang mengimplementasikan interface: query last BAST in same year, extract sequential number, format sebagai `BAST/XXXX/MM/YYYY`
    - _Requirements: 3.1, 3.2, 13.1_

  - [ ]* 2.2 Write property test untuk BastNumberGenerator — Property 5: Document number format and sequencing
    - **Property 5: Document number generation format and sequencing**
    - Test: untuk sembarang date, output harus match pattern `BAST/XXXX/MM/YYYY`; untuk sequence dalam tahun yang sama, XXXX harus strictly monotonically increasing
    - **Validates: Requirements 3.1, 3.2**

  - [x] 2.3 Register BastNumberGeneratorInterface binding di AppServiceProvider
    - Tambahkan `$this->app->bind(BastNumberGeneratorInterface::class, BastNumberGenerator::class)` di method `register()`
    - _Requirements: 13.2_

- [x] 3. Form request validation — StoreBastRequest
  - [x] 3.1 Buat StoreBastRequest form request
    - Buat `app/Http/Requests/StoreBastRequest.php` dengan rules: bap_id required exists:baps,id; tanggal required date; semua pihak_pertama dan pihak_kedua fields required string max:255
    - Tambahkan `withValidator` method: validasi BAP harus berstatus approved, validasi BAP belum punya BAST
    - Tambahkan custom error messages dalam Bahasa Indonesia
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [ ]* 3.2 Write property test untuk StoreBastRequest — Property 3: Approved BAP guard
    - **Property 3: Approved BAP guard**
    - Test: untuk sembarang BAP dengan status selain "approved", pembuatan BAST harus ditolak dengan validation error
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 3.3 Write property test untuk StoreBastRequest — Property 4: Pihak pertama field validation
    - **Property 4: Pihak pertama field validation**
    - Test: untuk sembarang string kosong atau > 255 karakter pada field pihak_pertama, submission harus ditolak
    - **Validates: Requirements 2.5**

  - [ ]* 3.4 Write property test — Property 1: One-to-one BAP/BAST uniqueness
    - **Property 1: One-to-one BAP/BAST uniqueness**
    - Test: untuk sembarang BAP yang sudah punya BAST, pembuatan BAST kedua harus ditolak
    - **Validates: Requirements 1.2, 2.4**

- [x] 4. Checkpoint - Pastikan migration, model, dan service layer berjalan
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. BastController — Backend CRUD dan PDF export
  - [x] 5.1 Buat BastController dengan constructor injection
    - Buat `app/Http/Controllers/BastController.php` dengan DI: `BastNumberGeneratorInterface` dan `PdfExportServiceInterface`
    - Implementasi method `index`: query Bast with client & bap, filter optional by client_id, order by created_at desc, paginate 10, return Inertia `Basts/Index`
    - Implementasi method `create`: load approved BAPs tanpa BAST, load work items dari BAP terpilih, auto-populate pihak_kedua dari CompanySetting, return Inertia `Basts/Create`
    - Implementasi method `store`: gunakan StoreBastRequest, generate document_number, create Bast dengan client_id dari BAP, redirect ke basts.show
    - Implementasi method `show`: load Bast with relations, aggregate work items, return Inertia `Basts/Show`
    - Implementasi method `destroy`: delete Bast (tidak hapus BAP), redirect ke basts.index
    - Implementasi method `exportPdf`: delegate ke PdfExportService
    - _Requirements: 2.1, 2.6, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.2, 13.3_

  - [ ]* 5.2 Write property test — Property 2: Client association consistency
    - **Property 2: Client association consistency**
    - Test: untuk sembarang BAST yang dibuat dari BAP, client_id BAST harus sama dengan client_id BAP
    - **Validates: Requirements 1.3**

  - [ ]* 5.3 Write property test — Property 7: Client filter correctness
    - **Property 7: Client filter correctness**
    - Test: untuk sembarang client filter pada index, semua BAST yang dikembalikan harus memiliki client_id sesuai filter
    - **Validates: Requirements 6.2**

  - [ ]* 5.4 Write property test — Property 8: Deletion integrity
    - **Property 8: Deletion integrity**
    - Test: untuk sembarang BAST yang dihapus, BAP terkait harus tetap ada dan tidak berubah di database
    - **Validates: Requirements 8.1, 8.2**

- [x] 6. Routes dan wiring
  - [x] 6.1 Registrasi routes BAST di web.php
    - Tambahkan routes dalam middleware group `role:admin`: resource routes (index, create, store, show, destroy) dan custom route `basts/{id}/export-pdf`
    - _Requirements: 6.4, 13.3_

- [x] 7. Checkpoint - Pastikan backend CRUD berfungsi
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend pages — React (TypeScript) via Inertia
  - [x] 8.1 Buat TypeScript interfaces untuk Bast dan WorkItem
    - Definisikan interface `Bast` dan `WorkItem` di types file atau inline pada pages
    - _Requirements: 1.1, 5.2_

  - [x] 8.2 Buat halaman Basts/Index.tsx
    - Tampilkan tabel paginated: document_number, client name, tanggal (format Indonesia), BAP nomor surat
    - Tambahkan client filter dropdown
    - Tambahkan link ke Create page dan setiap row link ke Show page
    - Pagination 10 per halaman, ordered by newest first
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 8.3 Buat halaman Basts/Create.tsx
    - Form dengan BAP selector (hanya approved BAPs tanpa BAST)
    - On BAP selection: auto-load client info dan work items table preview
    - Input fields pihak_pertama (editable, default jabatan "Maintenance Manager" dan "Chief Engineering")
    - Input fields pihak_kedua (auto-populated dari CompanySetting, editable)
    - Date picker untuk tanggal
    - Work items table read-only preview
    - Submit button dengan validasi form
    - _Requirements: 2.1, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.4_

  - [x] 8.4 Buat halaman Basts/Show.tsx
    - Tampilkan semua detail BAST: document_number, tanggal, client, pihak pertama/kedua info, work items table
    - Tombol Export PDF (link ke route export-pdf)
    - Tombol Delete dengan konfirmasi dialog
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 9. PDF templates — Blade views
  - [x] 9.1 Buat layout.blade.php untuk BAST PDF
    - Buat `resources/views/pdf/bast/layout.blade.php` yang menggabungkan 3 section dengan page-break-before
    - Include shared styles (font, spacing, page sizing)
    - _Requirements: 12.1, 12.2, 12.4_

  - [x] 9.2 Buat cover.blade.php
    - Render Cover_Page: client logo (jika ada), client name, month/year tanggal dalam Bahasa Indonesia, company name dan address dari CompanySetting
    - Tambahkan decorative border/design elements
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 9.3 Buat surat.blade.php
    - Render Surat_BAST_Page: company header (logo, nama, alamat), judul dokumen, nomor dan tanggal formal Indonesia
    - Render Pihak Pertama dan Pihak Kedua sections
    - Render Work Items Table (No, Uraian Pekerjaan, Satuan, Jumlah, Keterangan)
    - Render paragraf penutup dan area tanda tangan (2 rows × 2 columns)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

  - [x] 9.4 Buat laporan.blade.php
    - Render Laporan_Pekerjaan_Page: detail setiap work report (date, category, description, area, technician, photos before/after)
    - Visual separation antar work reports
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 9.5 Write property test — Property 10: Indonesian date formatting
    - **Property 10: Indonesian date formatting**
    - Test: untuk sembarang valid date, format tanggal Indonesia harus menghasilkan string pattern "Jakarta, DD NamaBulan YYYY"
    - **Validates: Requirements 10.3**

- [x] 10. PDF export service integration
  - [x] 10.1 Extend PdfExportServiceInterface dan implementasi generateBastPdf
    - Tambahkan method `generateBastPdf(int $bastId): Response` di PdfExportServiceInterface
    - Implementasi di PdfExportService: load Bast with relations, load work reports, aggregate work items, render 3 Blade templates, combine via layout, generate PDF A4 portrait via dompdf, return download response
    - Filename pattern: `BAST_{document_number_with_dashes}.pdf`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ]* 10.2 Write property test — Property 9: PDF filename transformation
    - **Property 9: PDF filename transformation**
    - Test: untuk sembarang document_number, filename harus sama dengan `"BAST_" + document_number.replace("/", "-") + ".pdf"`
    - **Validates: Requirements 12.3**

  - [ ]* 10.3 Write property test — Property 6: Service aggregation correctness
    - **Property 6: Service aggregation correctness**
    - Test: untuk sembarang set work reports dengan services yang sama, aggregasi harus menghasilkan satu row per unique service dengan jumlah = count work reports yang mereferensikan service tersebut
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 11. Final checkpoint - Pastikan semua fitur terintegrasi
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Laravel + Inertia.js + React (TypeScript) digunakan sesuai stack project yang ada
- PDF generation menggunakan `barryvdh/laravel-dompdf` yang sudah ter-install di project

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["5.1", "6.1", "8.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "8.2", "8.3", "8.4"] },
    { "id": 6, "tasks": ["9.1"] },
    { "id": 7, "tasks": ["9.2", "9.3", "9.4", "9.5"] },
    { "id": 8, "tasks": ["10.1"] },
    { "id": 9, "tasks": ["10.2", "10.3"] }
  ]
}
```
