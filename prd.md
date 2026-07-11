# PRD — Project Requirements Document

## 1. Overview
Perusahaan jasa IT/teknis saat ini mengelola laporan kerja teknisi, berita acara pekerjaan (BAP), dan invoice secara terpisah—biasanya dengan spreadsheet dan dokumen manual. Akibatnya, data tidak terpusat, rentan salah, proses validasi lambat, dan penagihan sering tertunda. Aplikasi ini hadir untuk menyatukan ketiga alur tersebut dalam satu sistem terstruktur, sehingga:

- Teknisi bisa mencatat laporan langsung beserta foto bukti.
- Admin bisa membuat BAP dan invoice secara otomatis dari data yang sudah tervalidasi.
- Manajemen bisa memantau status pekerjaan, piutang, dan pendapatan melalui dashboard.
- Semua dokumen (BAP & invoice) bisa dicetak sebagai PDF dengan format resmi.

## 2. Requirements
- **Multi-peran dengan hak akses:** Admin (mengelola master data, validasi laporan, buat BAP & invoice) dan Teknisi (input laporan kerja).
- **Manajemen data master:** Klien lengkap dengan NPWP & PIC; kategori pekerjaan; katalog jasa/produk beserta satuan dan harga.
- **Laporan Pekerjaan:** Teknisi bisa memilih klien, kategori, menulis detail aktivitas, upload foto sebelum/sesudah, dan menyimpan sebagai Draft atau Submit.
- **BAP (Berita Acara Pekerjaan):** Admin menarik data laporan yang sudah disubmit, generate nomor surat otomatis, opsional tanda tangan digital, dan export PDF.
- **Invoice:** Dari BAP yang sudah Approved, admin generate invoice otomatis. Item diambil dari katalog jasa/produk terkait pekerjaan, jumlah dihitung qty × harga, plus PPN & diskon. Status Unpaid/Overdue/Paid.
- **Dashboard:** Menampilkan total klien aktif, jumlah pekerjaan bulan ini, total invoice unpaid (Rp), grafik tren pendapatan dari invoice yang sudah Paid per bulan.
- **Otomatisasi perhitungan** Pajak (PPN 11%) dan diskon per item atau total.
- **Validasi status & alur:** Draft → Submitted → Approved (untuk BAP); Draft → Unpaid → Paid (invoice), dengan overdue otomatis jika melewati jatuh tempo.
- **Keamanan sederhana:** Login, peran, dan hak akses.
- **Responsif** agar bisa diakses dari laptop maupun tablet teknisi di lapangan.

## 3. Core Features
- **Master Data**
  - CRUD Klien (nama, NPWP, alamat, PIC)
  - CRUD Kategori Pekerjaan
  - CRUD Jasa & Produk (nama, satuan, harga satuan)
- **Laporan Pekerjaan**
  - Form input: pilih klien & kategori, isi deskripsi aktivitas, upload foto sebelum & sesudah
  - Simpan sebagai Draft, atau Submit untuk review admin
  - Daftar laporan dengan filter status
- **BAP (Berita Acara)**
  - Generate dari satu atau beberapa laporan yang sudah Submitted
  - Isi otomatis: nama klien, tanggal, detail pekerjaan
  - Nomor surat otomatis (format: BAP/XXXX/MM/YYYY)
  - Tambahkan tanda tangan digital (opsional)
  - Simpan sebagai Draft, lalu Approve
  - Export PDF dengan layout formal
- **Invoice**
  - Generate dari BAP yang sudah Approved
  - Item invoice diambil dari jasa/produk yang digunakan, qty diisi manual/otomatis
  - Hitung subtotal, PPN, diskon, dan total
  - Status: Unpaid, Overdue (otomatis setelah jatuh tempo), Paid
  - Export PDF dengan kop surat
- **Dashboard**
  - Kartu: Total Klien Aktif, Pekerjaan Bulan Ini, Total Invoice Unpaid (Rp)
  - Grafik garis: Pendapatan dari invoice Paid per bulan dalam 12 bulan terakhir
- **Notifikasi sederhana** (opsional): peringatan invoice overdue di dashboard

## 4. User Flow
1. **Admin** mengisi data master: klien, kategori pekerjaan, jasa/produk.
2. **Teknisi** login, membuat laporan pekerjaan baru → pilih klien & kategori → isi detail → upload foto → simpan Draft atau Submit.
3. **Admin** melihat daftar laporan berstatus Submitted → pilih laporan yang selesai → klik “Buat BAP”.
4. **Admin** check BAP, verifikasi detail, tambahkan keterangan, lalu Approve.
5. Setelah BAP Approved, **Admin** buat invoice dari BAP tersebut → item otomatis terisi → cek jumlah dan diskon → simpan & ubah status menjadi Unpaid.
6. **Admin** mengirim invoice (PDF) ke klien; setelah pembayaran, admin mengubah status menjadi Paid.
7. **Manajemen** memantau dashboard untuk melihat performa dan piutang.

## 5. Architecture
```mermaid
flowchart TD
    A[Admin Browser] -->|Inertia/React| B[Laravel App]
    C[Teknisi Browser] -->|Inertia/React| B
    B --> D[MySQL/SQLite Database]
    B --> E[Storage (foto)]
    B --> F[PDF Generator (dompdf)]
    B --> G[Authentication (Laravel Breeze/Jetstream)]
    G --> D
```

Aplikasi monolitik Laravel menggunakan Inertia.js sebagai jembatan sisi server ke React di frontend. Semua logika bisnis berada di controller dan service Laravel. File foto disimpan di local storage/public. PDF dihasilkan oleh `dompdf`. Otentikasi menggunakan paket bawaan Laravel.

## 6. Database Schema
```mermaid
erDiagram
    CLIENTS {
        int id PK
        string name
        string npwp
        string address
        string pic_name
        string pic_phone
        boolean is_active
    }
    JOB_CATEGORIES {
        int id PK
        string name
        string description
    }
    SERVICES {
        int id PK
        string code
        string name
        string unit
        decimal price
        string type "service|product"
        boolean is_active
    }
    WORK_REPORTS {
        int id PK
        int client_id FK
        int category_id FK
        int technician_id FK(user)
        string description
        string status "draft|submitted"
        timestamp submitted_at
        json before_photos
        json after_photos
        timestamps
    }
    BAPS {
        int id PK
        string nomor_surat UK
        int work_report_id FK "nullable, bisa gabungan"
        int client_id FK
        date tanggal
        string status "draft|approved"
        json work_report_ids "jika gabungan beberapa laporan"
        string signed_by
        timestamps
    }
    INVOICES {
        int id PK
        string invoice_number UK
        int bap_id FK
        int client_id FK
        decimal subtotal
        decimal discount_total
        decimal ppn
        decimal grand_total
        date due_date
        string status "draft|unpaid|overdue|paid"
        timestamps
    }
    INVOICE_ITEMS {
        int id PK
        int invoice_id FK
        int service_id FK
        decimal quantity
        decimal unit_price
        decimal discount_percent "optional"
        decimal line_total
    }
    USERS {
        int id PK
        string name
        string email UK
        string password
        string role "admin|technician"
    }

    CLIENTS ||--o{ WORK_REPORTS : "has"
    JOB_CATEGORIES ||--o{ WORK_REPORTS : "has"
    USERS ||--o{ WORK_REPORTS : "submits"
    CLIENTS ||--o{ BAPS : "related"
    WORK_REPORTS ||--o| BAPS : "referenced by"
    CLIENTS ||--o{ INVOICES : "billed"
    BAPS ||--o| INVOICES : "generates"
    INVOICES ||--o{ INVOICE_ITEMS : "contains"
    SERVICES ||--o{ INVOICE_ITEMS : "referenced"
```

**Tabel Utama:**

- **clients**: Data klien, termasuk NPWP dan PIC.
- **job_categories**: Kategori pekerjaan (contoh: Instalasi, Maintenance).
- **services**: Daftar jasa/produk yang bisa ditagih. Tipe `service` untuk jasa (satuan jam/paket) dan `product` untuk barang.
- **work_reports**: Laporan kerja teknisi. `before_photos` dan `after_photos` sebagai JSON array path.
- **baps**: Berita Acara. Dapat menampung beberapa `work_report_id` (disimpan JSON) untuk efisiensi.
- **invoices**: Satu BAP menghasilkan satu invoice. `due_date` digunakan untuk menentukan overdue.
- **invoice_items**: Item per baris invoice, mereferensi `services`.
- **users**: Pengguna dengan role admin/teknisi.

## 7. Tech Stack
- **Backend:** Laravel 11 (PHP 8.2+), Eloquent ORM
- **Frontend:** React, Inertia.js (server-side routing), Tailwind CSS (opsional untuk styling cepat)
- **Autentikasi:** Laravel Breeze (Inertia + React stack) atau Laravel Jetstream
- **Database:** MySQL / MariaDB (produksi); SQLite (development)
- **PDF Generator:** barryvdh/laravel-dompdf
- **File Storage:** Laravel Filesystem (local disk)
- **Chart Library (Dashboard):** Chart.js atau Recharts (via React) yang dipasang manual
- **Deployment:** VPS standar dengan PHP, Composer, Node.js

Aplikasi menggunakan pendekatan monolitik penuh dengan session-based auth melalui Inertia, tidak memerlukan API terpisah. Semua komponen sesuai permintaan.