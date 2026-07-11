# Requirements Document

## Introduction

Aplikasi manajemen proyek untuk perusahaan jasa IT/teknis yang menyatukan alur laporan kerja teknisi, Berita Acara Pekerjaan (BAP), dan invoice dalam satu sistem terpusat. Sistem dibangun secara bertahap menggunakan Laravel 11 + Inertia.js + React + Tailwind CSS, dengan autentikasi Laravel Breeze (role admin dan teknisi). Tujuan utama: pencatatan pekerjaan yang terstruktur, validasi yang efisien, penagihan otomatis, dan pemantauan performa melalui dashboard.

## Glossary

- **Sistem**: Aplikasi manajemen proyek berbasis web yang dibangun dengan Laravel 11 + Inertia.js + React
- **Admin**: Pengguna dengan role admin yang mengelola master data, memvalidasi laporan, membuat BAP dan invoice
- **Teknisi**: Pengguna dengan role technician yang menginput laporan kerja di lapangan
- **Klien**: Entitas perusahaan atau individu yang menerima jasa, memiliki data NPWP dan PIC
- **Kategori_Pekerjaan**: Klasifikasi jenis pekerjaan (contoh: Instalasi, Maintenance)
- **Jasa_Produk**: Item yang dapat ditagihkan, berupa jasa (satuan jam/paket) atau produk (barang)
- **Laporan_Kerja**: Dokumen digital pencatatan aktivitas teknisi di lapangan, termasuk foto bukti
- **BAP**: Berita Acara Pekerjaan — dokumen formal yang merangkum pekerjaan yang telah diselesaikan
- **Invoice**: Dokumen penagihan yang dihasilkan dari BAP yang sudah disetujui
- **Invoice_Item**: Baris item pada invoice yang mereferensi Jasa_Produk
- **PPN**: Pajak Pertambahan Nilai sebesar 11% yang diterapkan pada invoice
- **Diskon**: Potongan harga yang dapat diterapkan per item atau pada total invoice
- **PDF_Generator**: Komponen dompdf yang menghasilkan dokumen PDF dari BAP dan Invoice
- **Dashboard**: Halaman ringkasan berisi KPI cards dan grafik pendapatan

## Requirements

### Requirement 1: Autentikasi dan Otorisasi

**User Story:** Sebagai pengguna, saya ingin login ke sistem dengan kredensial yang aman, sehingga hanya pengguna terotorisasi yang dapat mengakses fitur sesuai perannya.

#### Acceptance Criteria

1. THE Sistem SHALL menyediakan halaman login dengan field email dan password
2. THE Sistem SHALL menyediakan halaman registrasi untuk pembuatan akun baru
3. WHEN pengguna berhasil login, THE Sistem SHALL mengarahkan pengguna ke halaman utama sesuai role (admin ke dashboard, teknisi ke daftar laporan)
4. IF kredensial login tidak valid, THEN THE Sistem SHALL menampilkan pesan error "Email atau password salah" tanpa mengungkapkan field mana yang salah
5. THE Sistem SHALL membatasi akses fitur berdasarkan role: admin memiliki akses penuh, teknisi hanya dapat mengakses modul Laporan_Kerja
6. IF pengguna yang belum login mengakses halaman terproteksi, THEN THE Sistem SHALL mengarahkan pengguna ke halaman login

### Requirement 2: Manajemen Data Klien

**User Story:** Sebagai Admin, saya ingin mengelola data klien secara lengkap, sehingga informasi klien tersedia untuk pembuatan laporan, BAP, dan invoice.

#### Acceptance Criteria

1. THE Sistem SHALL menyediakan form CRUD Klien dengan field: nama, NPWP, alamat, nama PIC, nomor telepon PIC, dan status aktif
2. WHEN Admin menyimpan data Klien baru, THE Sistem SHALL memvalidasi bahwa field nama dan alamat terisi
3. THE Sistem SHALL menampilkan daftar Klien dengan fitur pencarian berdasarkan nama atau NPWP
4. WHEN Admin mengubah status Klien menjadi tidak aktif, THE Sistem SHALL menyembunyikan Klien tersebut dari pilihan dropdown di form Laporan_Kerja
5. IF Admin mencoba menghapus Klien yang sudah memiliki Laporan_Kerja terkait, THEN THE Sistem SHALL menampilkan pesan konfirmasi dan melakukan soft-delete

### Requirement 3: Manajemen Kategori Pekerjaan

**User Story:** Sebagai Admin, saya ingin mengelola kategori pekerjaan, sehingga laporan kerja dapat diklasifikasikan dengan benar.

#### Acceptance Criteria

1. THE Sistem SHALL menyediakan form CRUD Kategori_Pekerjaan dengan field: nama dan deskripsi
2. WHEN Admin menyimpan Kategori_Pekerjaan baru, THE Sistem SHALL memvalidasi bahwa field nama terisi dan unik
3. THE Sistem SHALL menampilkan daftar Kategori_Pekerjaan yang tersedia untuk dipilih di form Laporan_Kerja
4. IF Admin mencoba menghapus Kategori_Pekerjaan yang sudah digunakan di Laporan_Kerja, THEN THE Sistem SHALL mencegah penghapusan dan menampilkan pesan bahwa kategori masih digunakan

### Requirement 4: Manajemen Jasa dan Produk

**User Story:** Sebagai Admin, saya ingin mengelola katalog jasa dan produk, sehingga item invoice dapat diambil secara otomatis dari katalog.

#### Acceptance Criteria

1. THE Sistem SHALL menyediakan form CRUD Jasa_Produk dengan field: kode, nama, satuan, harga satuan, tipe (service atau product), dan status aktif
2. WHEN Admin menyimpan Jasa_Produk baru, THE Sistem SHALL memvalidasi bahwa field kode unik, nama terisi, dan harga satuan berupa angka positif
3. THE Sistem SHALL menampilkan daftar Jasa_Produk dengan filter berdasarkan tipe (service/product) dan status aktif
4. WHEN Admin menonaktifkan Jasa_Produk, THE Sistem SHALL tetap menampilkan Jasa_Produk tersebut pada Invoice_Item yang sudah ada tetapi menyembunyikannya dari pilihan pembuatan invoice baru

### Requirement 5: Pembuatan Laporan Kerja

**User Story:** Sebagai Teknisi, saya ingin mencatat laporan pekerjaan lengkap dengan foto bukti, sehingga Admin dapat memvalidasi pekerjaan yang telah dilakukan.

#### Acceptance Criteria

1. THE Sistem SHALL menyediakan form Laporan_Kerja dengan field: pilihan Klien, pilihan Kategori_Pekerjaan, deskripsi aktivitas, upload foto sebelum, dan upload foto sesudah
2. WHEN Teknisi mengisi form Laporan_Kerja, THE Sistem SHALL hanya menampilkan Klien yang berstatus aktif pada dropdown pilihan
3. THE Sistem SHALL menerima upload foto dalam format JPG, JPEG, atau PNG dengan ukuran maksimal 2MB per file
4. WHEN Teknisi menyimpan Laporan_Kerja sebagai Draft, THE Sistem SHALL menyimpan data tanpa validasi kelengkapan field
5. WHEN Teknisi melakukan Submit pada Laporan_Kerja, THE Sistem SHALL memvalidasi bahwa field Klien, Kategori_Pekerjaan, dan deskripsi terisi, serta minimal satu foto sesudah ter-upload
6. WHEN Laporan_Kerja berhasil di-submit, THE Sistem SHALL mengubah status menjadi "submitted" dan mencatat timestamp submitted_at
7. WHILE Laporan_Kerja berstatus "submitted", THE Sistem SHALL mencegah Teknisi mengubah atau menghapus laporan tersebut

### Requirement 6: Daftar dan Filter Laporan Kerja

**User Story:** Sebagai Admin, saya ingin melihat daftar laporan kerja dengan filter status, sehingga saya dapat dengan cepat menemukan laporan yang perlu divalidasi.

#### Acceptance Criteria

1. THE Sistem SHALL menampilkan daftar Laporan_Kerja dengan kolom: tanggal, nama Klien, Kategori_Pekerjaan, Teknisi, dan status
2. THE Sistem SHALL menyediakan filter pada daftar Laporan_Kerja berdasarkan status (draft/submitted), Klien, dan rentang tanggal
3. WHEN Admin membuka detail Laporan_Kerja, THE Sistem SHALL menampilkan seluruh informasi termasuk foto sebelum dan sesudah dalam tampilan yang jelas
4. WHILE pengguna memiliki role Teknisi, THE Sistem SHALL hanya menampilkan Laporan_Kerja milik Teknisi tersebut

### Requirement 7: Pembuatan BAP

**User Story:** Sebagai Admin, saya ingin membuat Berita Acara Pekerjaan dari laporan kerja yang sudah disubmit, sehingga pekerjaan terdokumentasi secara formal.

#### Acceptance Criteria

1. WHEN Admin memilih satu atau beberapa Laporan_Kerja berstatus "submitted" dari Klien yang sama, THE Sistem SHALL mengizinkan pembuatan BAP
2. WHEN BAP dibuat, THE Sistem SHALL mengisi otomatis: nama Klien, tanggal, dan detail pekerjaan dari Laporan_Kerja terkait
3. WHEN BAP dibuat, THE Sistem SHALL men-generate nomor surat otomatis dengan format BAP/XXXX/MM/YYYY dimana XXXX adalah nomor urut 4 digit yang auto-increment per tahun
4. THE Sistem SHALL menyimpan BAP baru dengan status "draft"
5. WHEN Admin meng-approve BAP, THE Sistem SHALL mengubah status BAP menjadi "approved" dan mencatat nama pihak yang menyetujui di field signed_by
6. WHILE BAP berstatus "approved", THE Sistem SHALL mencegah perubahan pada BAP tersebut
7. THE Sistem SHALL menyediakan field opsional untuk tanda tangan digital pada BAP

### Requirement 8: Export PDF BAP

**User Story:** Sebagai Admin, saya ingin mengexport BAP ke format PDF dengan layout formal, sehingga dokumen dapat dicetak atau dikirim ke klien.

#### Acceptance Criteria

1. WHEN Admin mengklik tombol export PDF pada BAP, THE PDF_Generator SHALL menghasilkan dokumen PDF dengan layout formal yang mencakup: nomor surat, tanggal, nama Klien, detail pekerjaan, dan area tanda tangan
2. THE PDF_Generator SHALL menghasilkan PDF dalam ukuran kertas A4 dengan margin standar
3. WHEN PDF berhasil di-generate, THE Sistem SHALL menyediakan file PDF untuk diunduh oleh Admin

### Requirement 9: Pembuatan Invoice

**User Story:** Sebagai Admin, saya ingin membuat invoice dari BAP yang sudah di-approve, sehingga penagihan dapat dilakukan secara akurat dan efisien.

#### Acceptance Criteria

1. WHEN Admin membuat invoice dari BAP berstatus "approved", THE Sistem SHALL men-generate invoice dengan nomor unik dan mengisi data Klien secara otomatis
2. WHEN invoice dibuat, THE Sistem SHALL mengambil item secara otomatis dari Jasa_Produk yang terkait dengan Kategori_Pekerjaan pada Laporan_Kerja di BAP tersebut
3. THE Sistem SHALL menampilkan daftar Invoice_Item dengan kolom: nama jasa/produk, satuan, quantity, harga satuan, diskon per item (opsional), dan total per baris
4. WHEN Admin mengubah quantity atau diskon pada Invoice_Item, THE Sistem SHALL menghitung ulang line_total secara real-time
5. THE Sistem SHALL menghitung subtotal sebagai jumlah seluruh line_total dari Invoice_Item
6. THE Sistem SHALL menghitung PPN sebesar 11% dari subtotal setelah dikurangi diskon total
7. THE Sistem SHALL menghitung grand_total sebagai subtotal dikurangi diskon total ditambah PPN
8. WHEN Admin menyimpan invoice, THE Sistem SHALL menyimpan dengan status "draft"
9. THE Sistem SHALL menyediakan field tanggal jatuh tempo (due_date) yang wajib diisi sebelum invoice diubah ke status "unpaid"

### Requirement 10: Status dan Alur Invoice

**User Story:** Sebagai Admin, saya ingin mengelola status invoice dengan alur yang jelas, sehingga piutang dapat dipantau dengan akurat.

#### Acceptance Criteria

1. WHEN Admin mengubah status invoice dari "draft" ke "unpaid", THE Sistem SHALL memvalidasi bahwa due_date sudah terisi
2. WHILE invoice berstatus "unpaid" dan tanggal saat ini melewati due_date, THE Sistem SHALL mengubah status invoice menjadi "overdue" secara otomatis
3. WHEN Admin menandai invoice sebagai "paid", THE Sistem SHALL mencatat tanggal pembayaran dan mengubah status menjadi "paid"
4. WHILE invoice berstatus "paid", THE Sistem SHALL mencegah perubahan pada data invoice tersebut
5. THE Sistem SHALL menyediakan daftar invoice dengan filter berdasarkan status (draft/unpaid/overdue/paid) dan Klien

### Requirement 11: Export PDF Invoice

**User Story:** Sebagai Admin, saya ingin mengexport invoice ke format PDF dengan kop surat, sehingga dokumen penagihan dapat dikirim ke klien secara profesional.

#### Acceptance Criteria

1. WHEN Admin mengklik tombol export PDF pada invoice, THE PDF_Generator SHALL menghasilkan dokumen PDF dengan kop surat perusahaan, nomor invoice, data Klien, daftar item, subtotal, diskon, PPN, dan grand_total
2. THE PDF_Generator SHALL menghasilkan PDF invoice dalam ukuran kertas A4 dengan layout tabel yang rapi untuk daftar item
3. WHEN PDF invoice berhasil di-generate, THE Sistem SHALL menyediakan file PDF untuk diunduh oleh Admin

### Requirement 12: Dashboard

**User Story:** Sebagai Admin/Manajemen, saya ingin melihat ringkasan performa di dashboard, sehingga saya dapat memantau status pekerjaan dan keuangan secara cepat.

#### Acceptance Criteria

1. THE Sistem SHALL menampilkan KPI card "Total Klien Aktif" yang menunjukkan jumlah Klien dengan status aktif
2. THE Sistem SHALL menampilkan KPI card "Pekerjaan Bulan Ini" yang menunjukkan jumlah Laporan_Kerja yang di-submit pada bulan berjalan
3. THE Sistem SHALL menampilkan KPI card "Total Invoice Unpaid" yang menunjukkan total nilai grand_total dari seluruh invoice berstatus "unpaid" dan "overdue" dalam format Rupiah
4. THE Sistem SHALL menampilkan grafik garis pendapatan dari invoice berstatus "paid" per bulan dalam 12 bulan terakhir
5. THE Sistem SHALL menampilkan notifikasi jumlah invoice berstatus "overdue" pada dashboard sebagai peringatan

### Requirement 13: Responsivitas Antarmuka

**User Story:** Sebagai Teknisi, saya ingin mengakses sistem dari tablet di lapangan, sehingga saya dapat langsung mencatat laporan tanpa menunggu kembali ke kantor.

#### Acceptance Criteria

1. THE Sistem SHALL menampilkan antarmuka yang responsif dan dapat digunakan pada perangkat dengan lebar layar minimal 768px (tablet)
2. THE Sistem SHALL menampilkan antarmuka yang optimal pada perangkat dengan lebar layar 1024px ke atas (laptop/desktop)
3. WHEN pengguna mengakses dari perangkat tablet, THE Sistem SHALL menyesuaikan layout navigasi agar mudah diakses dengan sentuhan
