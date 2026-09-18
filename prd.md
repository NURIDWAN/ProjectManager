# PRD — Project Requirements Document

## 1. Overview
Perusahaan jasa IT/teknis saat ini mengelola laporan kerja teknisi, berita acara pekerjaan (BAP), dan invoice secara terpisah—biasanya dengan spreadsheet dan dokumen manual. Akibatnya, data tidak terpusat, rentan salah, proses validasi lambat, dan penagihan sering tertunda. Aplikasi ini hadir untuk menyatukan ketiga alur tersebut dalam satu sistem terstruktur, sehingga:

- Teknisi bisa mencatat laporan langsung beserta foto bukti.
- Admin bisa membuat BAP dan invoice secara otomatis dari data yang sudah tervalidasi.
- Manajemen bisa memantau status pekerjaan, piutang, dan pendapatan melalui dashboard.
- Semua dokumen (BAP & invoice) bisa dicetak sebagai PDF dengan format resmi.

## 2. Requirements
- **Multi-peran dengan hak akses:** Admin mengelola master data, BAP, invoice, dan pengguna; Staff dapat mengelola laporan dan proses operasional; Teknisi dapat membuat dan memperbarui laporan kerja.
- **Kolaborator laporan:** Pembuat laporan tetap menjadi pemilik awal, sementara setiap user yang mengedit atau mengautosave laporan tercatat sebagai `User Collaborator`. Kolaborator ditampilkan sebagai badge lingkaran bertumpuk dengan detail nama saat hover atau klik.
- **Manajemen data master:** Klien lengkap dengan NPWP & PIC; kategori pekerjaan; katalog jasa/produk beserta satuan dan harga.
- **Laporan Pekerjaan:** User dapat memilih klien, kategori, menulis detail aktivitas, dan menambahkan foto sebelum/sesudah. Create dan update hanya menyimpan Draft; Submit dilakukan dari tabel laporan dan membutuhkan konfirmasi.
- **Dokumentasi Foto:** Foto dari file maupun kamera masuk ke review queue sebelum dikirim, dapat dihapus sebelum upload, dikonversi ke WebP, dikompres, dan dibatasi maksimal 10 MB per foto.
- **BAP (Berita Acara Pekerjaan):** Admin menarik data laporan yang sudah disubmit, generate nomor surat otomatis, opsional tanda tangan digital, dan export PDF.
- **Invoice:** Admin dapat memilih BAP Approved yang belum memiliki invoice atau membuat invoice tanpa BAP. Jika memakai BAP, klien dan periode pekerjaan diambil otomatis dari laporan kerja terkait. Item menggunakan harga satuan, dengan PPN & diskon. Status Unpaid/Overdue/Paid.
- **Dashboard:** Menampilkan total klien aktif, jumlah pekerjaan bulan ini, total invoice unpaid (Rp), grafik tren pendapatan dari invoice yang sudah Paid per bulan.
- **Otomatisasi perhitungan** Pajak (PPN 11%) dan diskon per item atau total.
- **Validasi status & alur:** Draft → Submitted untuk laporan kerja; laporan Submitted dapat dipakai untuk BAP Draft → Approved; invoice Draft → Unpaid → Paid, dengan overdue otomatis jika melewati jatuh tempo.
- **Keamanan sederhana:** Login, peran, dan hak akses. Semua user tidak diperbolehkan menghapus akun sendiri; admin juga tidak dapat menghapus akun yang sedang digunakan.
- **PDF resmi:** BAP dan invoice dapat diekspor ke PDF. Invoice menggunakan label `Harga Satuan`; area `Diterima Oleh` hanya menyediakan garis tanda tangan tanpa menampilkan nama penerima.
- **Responsif** agar bisa diakses dari laptop maupun tablet teknisi di lapangan.

## 3. Core Features
- **Master Data**
  - CRUD Klien (nama, NPWP, alamat, PIC)
  - CRUD Kategori Pekerjaan
  - CRUD Jasa & Produk (nama, satuan, harga satuan)
- **Laporan Pekerjaan**
  - Form input: pilih klien & kategori, isi deskripsi aktivitas, upload foto sebelum & sesudah
  - Foto ditinjau terlebih dahulu pada modal, baik dari file maupun kamera
  - Simpan sebagai Draft melalui create, update, atau autosave
  - Submit hanya dari tabel laporan dengan modal konfirmasi
  - User collaborator dicatat otomatis saat membuat atau mengedit laporan
  - Daftar laporan dengan filter status
- **BAP (Berita Acara)**
  - Generate dari satu atau beberapa laporan yang sudah Submitted
  - Isi otomatis: nama klien, tanggal, detail pekerjaan
  - Nomor surat otomatis (format: BAP/XXXX/MM/YYYY)
  - Tambahkan tanda tangan digital (opsional)
  - Simpan sebagai Draft, lalu Approve
  - Export PDF dengan layout formal
- **Invoice**
  - Pilih BAP Approved yang belum memiliki invoice, atau pilih `Tanpa BAP`
  - Klien otomatis mengikuti BAP jika BAP dipilih
  - Tanggal mulai dan selesai pekerjaan diambil dari tanggal laporan kerja paling awal dan paling akhir pada BAP
  - Jika tanpa BAP, klien dan tanggal pekerjaan dapat diisi manual dan tetap opsional
  - Item invoice menggunakan harga satuan; qty dapat diisi manual/otomatis
  - Hitung subtotal, PPN, diskon, dan total
  - Status: Draft, Unpaid, Overdue (otomatis setelah jatuh tempo), Paid
  - Export PDF dengan kop surat, harga satuan, dan tanpa nama penerima pada area tanda tangan
- **Dashboard**
  - Kartu: Total Klien Aktif, Pekerjaan Bulan Ini, Total Invoice Unpaid (Rp)
  - Grafik garis: Pendapatan dari invoice Paid per bulan dalam 12 bulan terakhir
- **Notifikasi sederhana** (opsional): peringatan invoice overdue di dashboard

## 4. User Flow
1. **Admin** mengisi data master: klien, kategori pekerjaan, jasa/produk.
2. **Teknisi/Staff** login, membuat laporan pekerjaan baru → pilih klien & kategori → isi detail → pilih foto dari file atau kamera → review foto → simpan Draft.
3. User dapat mengedit laporan yang sama; setiap editor otomatis ditambahkan sebagai `User Collaborator` tanpa mengganti pemilik awal.
4. User melakukan Submit dari tabel laporan setelah pekerjaan selesai dan mengonfirmasi modal submit.
5. **Admin** melihat daftar laporan berstatus Submitted → pilih laporan yang selesai → klik “Buat BAP”.
6. **Admin** memeriksa BAP, memverifikasi detail, menambahkan keterangan, lalu Approve.
7. **Admin** membuat invoice dengan memilih BAP Approved atau tanpa BAP. Jika BAP dipilih, klien serta tanggal pekerjaan terisi dari laporan terkait; jika tidak, nilai tersebut dapat diisi manual.
8. Admin memeriksa item, harga satuan, jumlah, dan diskon, lalu menyimpan invoice serta mengubah status menjadi Unpaid.
9. **Admin** mengirim invoice (PDF) ke klien; setelah pembayaran, admin mengubah status menjadi Paid.
10. **Manajemen** memantau dashboard untuk melihat performa dan piutang.

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
        int bap_id FK "nullable"
        int client_id FK
        decimal subtotal
        decimal discount_total
        decimal ppn
        decimal grand_total
        date due_date
        date work_start_date "nullable"
        date work_end_date "nullable"
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
        string role "admin|staff|technician"
    }
    WORK_REPORT_CONTRIBUTORS {
        int work_report_id FK
        int user_id FK
        timestamps
    }

    CLIENTS ||--o{ WORK_REPORTS : "has"
    JOB_CATEGORIES ||--o{ WORK_REPORTS : "has"
    USERS ||--o{ WORK_REPORTS : "owns"
    USERS ||--o{ WORK_REPORT_CONTRIBUTORS : "collaborates"
    WORK_REPORTS ||--o{ WORK_REPORT_CONTRIBUTORS : "has collaborators"
    CLIENTS ||--o{ BAPS : "related"
    WORK_REPORTS }o--o{ BAPS : "included in"
    CLIENTS ||--o{ INVOICES : "billed"
    BAPS ||--o| INVOICES : "optionally generates"
    INVOICES ||--o{ INVOICE_ITEMS : "contains"
    SERVICES ||--o{ INVOICE_ITEMS : "referenced"
```

**Tabel Utama:**

- **clients**: Data klien, termasuk NPWP dan PIC.
- **job_categories**: Kategori pekerjaan (contoh: Instalasi, Maintenance).
- **services**: Daftar jasa/produk yang bisa ditagih. Tipe `service` untuk jasa (satuan jam/paket) dan `product` untuk barang.
- **work_reports**: Laporan kerja user. `before_photos` dan `after_photos` menyimpan kompatibilitas path foto; dokumentasi utama juga direpresentasikan oleh item foto tersimpan.
- **work_report_contributors**: Pivot unik yang mencatat pemilik/editor laporan sebagai kolaborator tanpa mengganti `technician_id` atau pemilik awal.
- **baps**: Berita Acara. Dapat menampung beberapa `work_report_id` melalui JSON untuk efisiensi.
- **invoices**: Invoice dapat memiliki BAP atau berdiri sendiri. `due_date` digunakan untuk menentukan overdue; `work_start_date` dan `work_end_date` menyimpan periode pekerjaan.
- **invoice_items**: Item per baris invoice, mereferensi `services` atau input manual, dengan `unit_price` sebagai harga satuan.
- **users**: Pengguna dengan role admin, staff, atau teknisi; tidak ada user yang boleh menghapus akun sendiri.

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