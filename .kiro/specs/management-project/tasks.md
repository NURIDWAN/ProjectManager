# Implementation Plan: Management Project

## Overview

Implementasi aplikasi Manajemen Proyek secara inkremental menggunakan Laravel 11 + Inertia.js + React + Tailwind CSS + shadcn/ui (Radix UI). Urutan build: Setup → Master Data → Laporan Kerja → BAP → Invoice → Dashboard. Setiap tahap membangun di atas tahap sebelumnya, memastikan tidak ada kode orphan.

## Tasks

- [x] 1. Setup proyek dan infrastruktur dasar
  - [x] 1.1 Inisialisasi proyek Laravel 11 dengan Breeze (Inertia + React) dan shadcn/ui
    - Jalankan `laravel new` dengan opsi Breeze Inertia React
    - Konfigurasi Tailwind CSS
    - Jalankan `npx shadcn@latest init` untuk setup shadcn/ui (konfigurasi `components.json`, CSS variables, utility helpers)
    - Install komponen shadcn/ui inti: `npx shadcn@latest add button input label table badge card alert-dialog dialog select dropdown-menu sheet separator skeleton sonner form tabs`
    - Install dependencies tambahan: `barryvdh/laravel-dompdf`, `recharts`, `@tanstack/react-table`
    - Konfigurasi database SQLite untuk development
    - _Requirements: 1.1, 1.2, 13.1, 13.2_

  - [x] 1.2 Buat migration dan model dasar
    - Tambah kolom `role` pada tabel `users` (enum: admin, technician)
    - Buat migration untuk tabel: `clients`, `job_categories`, `services`, `work_reports`, `baps`, `invoices`, `invoice_items`
    - Buat semua Eloquent models dengan fillable, casts, dan relationships
    - Buat seeder untuk user admin dan teknisi default
    - _Requirements: 1.5, 2.1, 3.1, 4.1_

  - [x] 1.3 Implementasi middleware role dan konfigurasi routing
    - Buat `RoleMiddleware` yang membatasi akses berdasarkan role
    - Registrasi middleware di `bootstrap/app.php`
    - Setup routes dasar dengan middleware groups (admin-only, semua role)
    - Modifikasi redirect setelah login: admin → `/dashboard`, teknisi → `/work-reports`
    - _Requirements: 1.3, 1.5, 1.6_

  - [x] 1.4 Install dan customize shadcn/ui components untuk layout
    - Modifikasi `AuthenticatedLayout` dengan sidebar navigation menggunakan shadcn/ui `Sheet` untuk mobile/tablet dan static sidebar untuk desktop
    - Buat komponen `DataTable` menggunakan shadcn/ui `Table` + TanStack Table pattern (sorting, pagination, filter)
    - Buat komponen `StatusBadge` menggunakan shadcn/ui `Badge` dengan custom variant styling per status (draft, submitted, approved, paid, overdue)
    - Buat komponen `ConfirmModal` menggunakan shadcn/ui `AlertDialog` untuk konfirmasi aksi destruktif
    - Buat komponen `KpiCard` menggunakan shadcn/ui `Card` untuk menampilkan label + nilai metrik
    - Implementasi role-based menu visibility di sidebar menggunakan shadcn/ui `Button` dan `Separator`
    - Pastikan layout responsif untuk tablet (min 768px) dan desktop (1024px+)
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 2. Checkpoint - Pastikan setup berjalan
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Modul Master Data — Klien
  - [x] 3.1 Implementasi backend CRUD Klien
    - Buat `StoreClientRequest` dan `UpdateClientRequest` dengan validasi (nama & alamat required)
    - Buat `ClientController` dengan method index, create, store, edit, update, destroy
    - Implementasi soft-delete dengan konfirmasi jika klien memiliki relasi
    - Implementasi scope `active` dan pencarian berdasarkan nama/NPWP
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Implementasi frontend CRUD Klien dengan shadcn/ui
    - Buat halaman `Clients/Index` dengan `DataTable` (shadcn/ui `Table` + TanStack Table), pencarian via shadcn/ui `Input`, dan pagination
    - Buat halaman `Clients/Create` dan `Clients/Edit` menggunakan shadcn/ui `Form` (react-hook-form + zod), `Input`, `Label`, dan `Button`
    - Implementasi toggle status aktif/nonaktif menggunakan shadcn/ui `Select`
    - Tambahkan `ConfirmModal` (shadcn/ui `AlertDialog`) untuk penghapusan
    - Gunakan shadcn/ui `Sonner` untuk notifikasi sukses/error
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [ ]* 3.3 Tulis property test untuk validasi data klien
    - **Property 3: Validasi data master menolak input tidak valid** (bagian Klien)
    - Test bahwa name kosong atau address kosong selalu gagal validasi
    - Gunakan minimum 100 iterasi dengan data random
    - **Validates: Requirements 2.2**

  - [ ]* 3.4 Tulis property test untuk filtering klien aktif
    - **Property 4: Entity aktif/nonaktif filtering** (bagian Klien)
    - Test bahwa klien `is_active = false` tidak muncul di dropdown Laporan Kerja
    - **Validates: Requirements 2.4**

- [x] 4. Modul Master Data — Kategori Pekerjaan & Jasa/Produk
o  - [~] 4.1 Implementasi backend CRUD Kategori Pekerjaan
    - Buat `StoreJobCategoryRequest` dengan validasi (nama required, unik)
    - Buat `JobCategoryController` dengan CRUD lengkap
    - Implementasi proteksi hapus jika kategori masih digunakan di work_reports
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 4.2 Implementasi backend CRUD Jasa/Produk
    - Buat `StoreServiceRequest` dengan validasi (code unik, nama required, price > 0)
    - Buat `ServiceController` dengan CRUD lengkap
    - Implementasi filter berdasarkan tipe dan status aktif
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.3 Implementasi frontend Kategori Pekerjaan & Jasa/Produk dengan shadcn/ui
    - Buat halaman `JobCategories/Index` dengan `DataTable` (shadcn/ui `Table` + TanStack Table) dan shadcn/ui `DropdownMenu` untuk aksi per baris
    - Buat halaman `JobCategories/Create` menggunakan shadcn/ui `Form`, `Input`, `Label`
    - Buat halaman `Services/Index` dengan `DataTable`, filter tipe dan status menggunakan shadcn/ui `Select`
    - Buat halaman `Services/Create` dan `Services/Edit` menggunakan shadcn/ui `Form`, `Input`, `Select`, `Label`
    - Gunakan shadcn/ui `Badge` untuk menampilkan tipe (service/product) dan status di tabel
    - _Requirements: 3.1, 3.3, 4.1, 4.3_

  - [ ]* 4.4 Tulis property test untuk validasi master data
    - **Property 3: Validasi data master menolak input tidak valid** (bagian Kategori & Jasa/Produk)
    - Test nama kategori duplikat, code service duplikat, dan price ≤ 0 selalu ditolak
    - **Validates: Requirements 3.2, 4.2**

- [x] 5. Checkpoint - Master data fungsional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Modul Laporan Kerja
  - [x] 6.1 Implementasi backend Laporan Kerja
    - Buat `StoreWorkReportRequest` dengan validasi kondisional (Draft vs Submit)
    - Buat `WorkReportController` dengan CRUD dan method `submit`
    - Implementasi upload foto (JPG/JPEG/PNG, max 2MB) ke `storage/app/public/work-reports/`
    - Implementasi logika: Draft bebas edit, Submitted locked untuk teknisi
    - Filter data berdasarkan `technician_id` untuk role teknisi
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.4_

  - [x] 6.2 Implementasi frontend Laporan Kerja dengan shadcn/ui
    - Buat komponen `FileUpload` menggunakan shadcn/ui `Input` (type=file) dengan custom drag-drop area dan preview thumbnail
    - Buat halaman `WorkReports/Index` dengan `DataTable` (shadcn/ui `Table` + TanStack Table), filter status via shadcn/ui `Select`, filter klien via `Select`, dan filter rentang tanggal
    - Buat halaman `WorkReports/Create` dengan shadcn/ui `Form`, `Select` untuk dropdown klien (hanya aktif) dan kategori, `Input` untuk deskripsi
    - Buat halaman `WorkReports/Show` dengan shadcn/ui `Card` untuk tampilan foto sebelum/sesudah, `Badge` untuk status, dan `Separator` antar section
    - Implementasi tombol "Simpan Draft" dan "Submit" menggunakan shadcn/ui `Button` dengan logika berbeda
    - Gunakan shadcn/ui `Sonner` untuk feedback sukses/error
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_

  - [ ]* 6.3 Tulis property test untuk validasi Draft vs Submit
    - **Property 7: Draft menerima semua input, Submit memerlukan field wajib**
    - Test bahwa Draft selalu sukses, Submit gagal tanpa klien/kategori/deskripsi/foto
    - **Validates: Requirements 5.4, 5.5**

  - [ ]* 6.4 Tulis property test untuk immutabilitas laporan submitted
    - **Property 8: Immutabilitas setelah status final** (bagian Laporan Kerja)
    - Test bahwa edit/delete pada laporan submitted selalu return 403
    - **Validates: Requirements 5.7**

  - [ ]* 6.5 Tulis property test untuk isolasi data teknisi
    - **Property 14: Isolasi data teknisi**
    - Test bahwa teknisi hanya melihat laporan miliknya sendiri
    - **Validates: Requirements 6.4**

- [x] 7. Checkpoint - Laporan Kerja fungsional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Modul BAP (Berita Acara Pekerjaan)
  - [x] 8.1 Implementasi service BapNumberGenerator
    - Buat `BapNumberGeneratorInterface` dan implementasi
    - Format: BAP/XXXX/MM/YYYY, XXXX auto-increment per tahun
    - Query MAX nomor urut pada tabel baps di tahun yang sama
    - _Requirements: 7.3_

  - [x] 8.2 Implementasi backend BAP
    - Buat `StoreBapRequest` dengan validasi (laporan harus submitted, klien sama)
    - Buat `BapController` dengan method index, create, store, show, approve
    - Implementasi logika: auto-fill data klien dan detail pekerjaan dari laporan terpilih
    - Implementasi approve: ubah status ke "approved", isi signed_by
    - Lock BAP yang sudah approved dari perubahan
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 8.3 Implementasi PDF export BAP
    - Buat Blade view `resources/views/pdf/bap.blade.php` dengan layout formal A4
    - Buat `PdfExportService` untuk generate PDF via DomPDF
    - Implementasi route `baps/{id}/export-pdf` yang return PDF download
    - Include: nomor surat, tanggal, klien, detail pekerjaan, area tanda tangan
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 8.4 Implementasi frontend BAP dengan shadcn/ui
    - Buat halaman `Baps/Index` dengan `DataTable` (shadcn/ui `Table` + TanStack Table) dan `StatusBadge` (shadcn/ui `Badge` dengan variant)
    - Buat halaman `Baps/Create` dengan shadcn/ui `Form`, multi-select laporan submitted menggunakan custom checkbox list (filter per klien via shadcn/ui `Select`)
    - Buat halaman `Baps/Show` dengan shadcn/ui `Card` untuk detail, `Badge` untuk status, shadcn/ui `AlertDialog` untuk konfirmasi Approve, dan shadcn/ui `Button` untuk Export PDF
    - Gunakan shadcn/ui `Tabs` untuk organisasi konten detail BAP (info umum, detail pekerjaan, dokumen)
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.7_

  - [ ]* 8.5 Tulis property test untuk format nomor surat BAP
    - **Property 9: Nomor surat BAP mengikuti format dan urutan**
    - Test format BAP/XXXX/MM/YYYY valid dan urutan increment benar
    - **Validates: Requirements 7.3**

  - [ ]* 8.6 Tulis property test untuk validasi BAP dari laporan yang valid
    - **Property 10: BAP hanya dari laporan submitted klien yang sama**
    - Test bahwa BAP ditolak jika laporan bukan submitted atau klien berbeda
    - **Validates: Requirements 7.1**

- [x] 9. Checkpoint - BAP fungsional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Modul Invoice
  - [x] 10.1 Implementasi InvoiceCalculationService
    - Buat `InvoiceCalculationServiceInterface` dan implementasi
    - Method: `calculateLineTotal(qty, price, discountPercent)`
    - Method: `calculateSubtotal(lineTotals[])`
    - Method: `calculatePpn(subtotal, discountTotal)` — PPN 11%
    - Method: `calculateGrandTotal(subtotal, discountTotal, ppn)`
    - Register service di ServiceProvider
    - _Requirements: 9.4, 9.5, 9.6, 9.7_

  - [x] 10.2 Implementasi backend Invoice
    - Buat `StoreInvoiceRequest` dengan validasi
    - Buat `InvoiceController` dengan method index, create, store, show, markUnpaid, markPaid, exportPdf
    - Implementasi auto-populate items dari services terkait kategori pekerjaan di BAP
    - Implementasi status transitions: draft → unpaid (require due_date) → paid
    - Lock invoice yang sudah paid dari perubahan
    - Filter daftar berdasarkan status dan klien
    - _Requirements: 9.1, 9.2, 9.3, 9.8, 9.9, 10.1, 10.3, 10.4, 10.5_

  - [x] 10.3 Implementasi OverdueDetectionService dan scheduled command
    - Buat `OverdueDetectionServiceInterface` dan implementasi
    - Buat Artisan command `invoice:check-overdue` yang berjalan harian
    - Register command di `routes/console.php` dengan schedule harian (00:01)
    - Update invoice unpaid yang melewati due_date menjadi overdue
    - _Requirements: 10.2_

  - [x] 10.4 Implementasi PDF export Invoice
    - Buat Blade view `resources/views/pdf/invoice.blade.php` dengan kop surat A4
    - Implementasi route `invoices/{id}/export-pdf` yang return PDF download
    - Include: kop surat, nomor invoice, data klien, tabel items, subtotal, diskon, PPN, grand_total
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 10.5 Implementasi frontend Invoice dengan shadcn/ui
    - Buat halaman `Invoices/Index` dengan `DataTable` (shadcn/ui `Table` + TanStack Table), filter status via shadcn/ui `Select`, filter klien via `Select`
    - Buat halaman `Invoices/Create` dengan shadcn/ui `Form`, auto-populate items dari BAP, tabel items menggunakan shadcn/ui `Table` dengan inline editing (shadcn/ui `Input` untuk qty/diskon)
    - Implementasi real-time recalculation saat qty/diskon diubah (via React state) dengan tampilan subtotal, PPN, grand_total menggunakan shadcn/ui `Card`
    - Buat halaman `Invoices/Show` dengan shadcn/ui `Card` untuk ringkasan, `Table` untuk daftar items, `Badge` untuk status, shadcn/ui `DropdownMenu` untuk aksi status change, dan shadcn/ui `Button` untuk Export PDF
    - Gunakan shadcn/ui `AlertDialog` untuk konfirmasi perubahan status (mark unpaid, mark paid)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.5_

  - [ ]* 10.6 Tulis property test untuk konsistensi perhitungan invoice
    - **Property 11: Konsistensi perhitungan invoice**
    - Test line_total = qty * price * (1 - d/100) untuk semua input valid
    - Test subtotal = sum(line_totals)
    - Test ppn = (subtotal - discountTotal) * 0.11
    - Test grand_total = subtotal - discountTotal + ppn
    - Gunakan minimum 100 iterasi dengan angka random
    - **Validates: Requirements 9.4, 9.5, 9.6, 9.7**

  - [ ]* 10.7 Tulis property test untuk transisi status invoice
    - **Property 12: Transisi status invoice memerlukan due_date**
    - Test bahwa draft → unpaid tanpa due_date selalu ditolak
    - **Validates: Requirements 9.9, 10.1**

  - [ ]* 10.8 Tulis property test untuk deteksi overdue
    - **Property 13: Deteksi overdue otomatis**
    - Test bahwa invoice unpaid dengan due_date < today selalu berubah ke overdue setelah deteksi
    - **Validates: Requirements 10.2**

  - [ ]* 10.9 Tulis property test untuk immutabilitas invoice paid
    - **Property 8: Immutabilitas setelah status final** (bagian Invoice)
    - Test bahwa perubahan pada invoice paid selalu return 403
    - **Validates: Requirements 10.4**

- [x] 11. Checkpoint - Invoice fungsional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Modul Dashboard
  - [x] 12.1 Implementasi DashboardAggregationService
    - Buat `DashboardAggregationServiceInterface` dan implementasi
    - Method `getKpiData()`: total klien aktif, laporan bulan ini, total unpaid (Rp), jumlah overdue
    - Method `getMonthlyRevenue()`: data pendapatan per bulan (12 bulan terakhir, invoice paid)
    - Buat `DashboardController` yang memanggil service dan return props via Inertia
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 12.2 Implementasi frontend Dashboard dengan shadcn/ui
    - Buat halaman `Dashboard/Index` dengan 3 `KpiCard` (shadcn/ui `Card`) + notifikasi overdue menggunakan shadcn/ui `Badge` sebagai alert indicator
    - Buat komponen `RevenueChart` menggunakan Recharts (grafik garis, 12 bulan) di dalam shadcn/ui `Card` container
    - Format angka dalam Rupiah (Intl.NumberFormat)
    - Gunakan shadcn/ui `Skeleton` untuk loading state pada KPI cards dan chart
    - Pastikan dashboard hanya diakses oleh admin
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 12.3 Tulis property test untuk akurasi KPI
    - **Property 15: Akurasi KPI dashboard**
    - Test konsistensi antara query KPI dan data aktual di database
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.5**

- [x] 13. Integrasi akhir dan wiring
  - [x] 13.1 Implementasi role-based access test dan security hardening
    - Tulis feature test untuk semua route admin-only (pastikan teknisi ditolak)
    - Tulis feature test untuk redirect setelah login berdasarkan role
    - Pastikan middleware terpasang di semua route yang seharusnya
    - _Requirements: 1.3, 1.5, 1.6_

  - [ ]* 13.2 Tulis property test untuk role-based access control
    - **Property 2: Role-based access control**
    - Test bahwa semua route admin-only menolak akses teknisi (403)
    - **Validates: Requirements 1.5**

  - [ ]* 13.3 Tulis property test untuk pencarian dan filter
    - **Property 5: Pencarian dan filter menghasilkan hasil yang tepat**
    - Test bahwa hasil pencarian klien selalu mengandung query string
    - Test bahwa filter status/klien/tanggal pada laporan dan invoice selalu tepat
    - **Validates: Requirements 2.3, 6.2, 10.5**

- [x] 14. Final checkpoint - Seluruh sistem terintegrasi
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP lebih cepat
- Setiap task mereferensi requirement spesifik untuk traceability
- Checkpoints memastikan validasi inkremental di setiap tahap
- Property tests memvalidasi correctness properties universal dari design document
- Unit tests memvalidasi contoh dan edge case spesifik
- Urutan build memastikan setiap modul dapat diuji secara independen sebelum lanjut
- Frontend menggunakan **shadcn/ui** (Radix UI primitives + Tailwind CSS) sebagai component library utama
- Komponen shadcn/ui di-install via CLI (`npx shadcn@latest add [component]`) dan disimpan di `resources/js/Components/ui/`
- Komponen custom (DataTable, StatusBadge, ConfirmModal, KpiCard, FileUpload) dibangun di atas primitives shadcn/ui

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.4"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["3.1", "4.1", "4.2"] },
    { "id": 4, "tasks": ["3.2", "4.3", "3.3", "3.4", "4.4"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "6.5"] },
    { "id": 7, "tasks": ["8.1"] },
    { "id": 8, "tasks": ["8.2", "8.4"] },
    { "id": 9, "tasks": ["8.3", "8.5", "8.6"] },
    { "id": 10, "tasks": ["10.1"] },
    { "id": 11, "tasks": ["10.2", "10.3"] },
    { "id": 12, "tasks": ["10.4", "10.5", "10.6", "10.7", "10.8", "10.9"] },
    { "id": 13, "tasks": ["12.1"] },
    { "id": 14, "tasks": ["12.2", "12.3"] },
    { "id": 15, "tasks": ["13.1", "13.2", "13.3"] }
  ]
}
```
