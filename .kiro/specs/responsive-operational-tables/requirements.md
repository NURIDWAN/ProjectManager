# Dokumen Persyaratan

## Pendahuluan

Fitur ini bertujuan untuk memperbaiki tampilan mobile pada semua tabel operasional yang saat ini tidak responsif. Tabel-tabel ini menggunakan komponen `DataTable` yang berbasis @tanstack/react-table dan komponen UI `table.tsx` yang menerapkan `whitespace-nowrap` pada semua cell, sehingga memaksa horizontal scroll di layar kecil. Perbaikan mencakup responsive column visibility, filter yang adaptif, pagination yang fleksibel, dan penanganan khusus untuk AcRecapTable yang memiliki 21+ kolom.

## Glosarium

- **DataTable**: Komponen React shared (`resources/js/Components/DataTable.tsx`) yang membungkus @tanstack/react-table untuk semua tabel operasional
- **TableCell**: Komponen UI primitif (`resources/js/components/ui/table.tsx`) yang merender elemen `<td>` dengan styling default
- **TableHead**: Komponen UI primitif yang merender elemen `<th>` dengan styling default
- **AcRecapTable**: Komponen tabel khusus untuk rekap data maintenance AC dengan 21+ kolom dan header multi-baris
- **Kolom_Primer**: Kolom yang selalu ditampilkan di semua ukuran layar (misalnya: nama, nomor, status, aksi)
- **Kolom_Sekunder**: Kolom yang disembunyikan pada layar kecil (< 768px) dan ditampilkan di layar medium ke atas
- **Kolom_Tersier**: Kolom yang hanya ditampilkan pada layar besar (≥ 1024px)
- **Breakpoint_Mobile**: Ukuran layar di bawah 768px (Tailwind `md:`)
- **Breakpoint_Tablet**: Ukuran layar 768px hingga 1023px (Tailwind `md:` hingga `lg:`)
- **Breakpoint_Desktop**: Ukuran layar 1024px ke atas (Tailwind `lg:`)
- **Sticky_Column**: Kolom yang tetap terlihat di posisi tetap saat user melakukan horizontal scroll

## Persyaratan

### Persyaratan 1: Responsive Column Visibility pada DataTable

**User Story:** Sebagai pengguna mobile, saya ingin melihat kolom-kolom penting saja di layar kecil, sehingga data tetap terbaca tanpa harus scroll horizontal berlebihan.

#### Kriteria Penerimaan

1. WHEN ukuran layar di bawah Breakpoint_Mobile, THE DataTable SHALL menyembunyikan Kolom_Sekunder dan Kolom_Tersier secara otomatis
2. WHEN ukuran layar di antara Breakpoint_Tablet, THE DataTable SHALL menampilkan Kolom_Primer dan Kolom_Sekunder, namun menyembunyikan Kolom_Tersier
3. WHEN ukuran layar di atas Breakpoint_Desktop, THE DataTable SHALL menampilkan semua kolom
4. THE DataTable SHALL menerima konfigurasi `responsiveHidden` pada column definition untuk menentukan pada breakpoint mana kolom disembunyikan
5. WHEN kolom disembunyikan secara responsif, THE DataTable SHALL tetap mengizinkan user untuk menampilkan kolom tersebut melalui dropdown Column Visibility yang sudah ada

### Persyaratan 2: Penghapusan Whitespace Nowrap Bawaan

**User Story:** Sebagai pengguna mobile, saya ingin teks pada cell tabel bisa wrap ke baris berikut, sehingga konten tidak memaksa tabel menjadi terlalu lebar.

#### Kriteria Penerimaan

1. THE TableCell SHALL tidak menerapkan `whitespace-nowrap` secara default
2. THE TableHead SHALL tidak menerapkan `whitespace-nowrap` secara default
3. WHERE kolom tertentu memerlukan nowrap (misalnya kolom tanggal, angka), THE DataTable SHALL mengizinkan penambahan class `whitespace-nowrap` secara per-kolom melalui column definition meta

### Persyaratan 3: Filter Responsif

**User Story:** Sebagai pengguna mobile, saya ingin filter tabel ditampilkan dengan baik di layar kecil, sehingga saya bisa memfilter data tanpa elemen yang overflow.

#### Kriteria Penerimaan

1. WHEN ukuran layar di bawah Breakpoint_Mobile, THE Filter_Container SHALL menampilkan setiap filter dalam lebar penuh (full-width)
2. WHEN ukuran layar di atas Breakpoint_Mobile, THE Filter_Container SHALL menampilkan filter secara horizontal dengan flex-wrap
3. THE SelectTrigger pada filter SHALL tidak menggunakan fixed-width (w-[160px] atau w-[200px]) pada layar mobile, melainkan menggunakan lebar responsif (w-full pada mobile, fixed-width pada desktop)

### Persyaratan 4: Pagination Responsif

**User Story:** Sebagai pengguna mobile, saya ingin tombol pagination tetap dapat diakses dan tidak overflow, sehingga saya bisa navigasi antar halaman dengan mudah.

#### Kriteria Penerimaan

1. WHEN ukuran layar di bawah Breakpoint_Mobile, THE Pagination_Container SHALL menampilkan tombol navigasi dengan wrapping yang proper
2. WHEN jumlah tombol pagination melebihi lebar layar, THE Pagination_Container SHALL membatasi jumlah tombol yang ditampilkan (misalnya hanya prev/next dan halaman aktif)
3. THE Pagination_Container SHALL menampilkan info jumlah data dan selector page-size secara stacked (vertikal) pada mobile

### Persyaratan 5: AcRecapTable dengan Sticky First Column

**User Story:** Sebagai pengguna mobile, saya ingin tetap bisa melihat kolom identifikasi (No, Tanggal, Lokasi) saat scroll horizontal pada tabel rekap AC, sehingga saya tahu baris mana yang sedang saya lihat.

#### Kriteria Penerimaan

1. THE AcRecapTable SHALL menggunakan horizontal scroll sebagai strategi responsif utama
2. WHILE user melakukan horizontal scroll pada AcRecapTable, THE kolom pertama (NO) SHALL tetap terlihat di posisi fixed (sticky left)
3. THE Sticky_Column SHALL memiliki visual separator (shadow atau border) untuk membedakan dari kolom yang bisa di-scroll
4. WHEN ukuran layar di bawah Breakpoint_Mobile, THE AcRecapTable SHALL mengurangi padding cell dan font-size untuk memaksimalkan konten yang terlihat

### Persyaratan 6: Konsistensi Responsif di Semua Halaman

**User Story:** Sebagai pengguna, saya ingin semua tabel operasional memiliki perilaku responsif yang konsisten, sehingga pengalaman saya seragam di seluruh aplikasi.

#### Kriteria Penerimaan

1. THE halaman WorkReports/Index SHALL menyembunyikan kolom "Kategori" dan "Deskripsi" pada Breakpoint_Mobile
2. THE halaman Baps/Index SHALL menyembunyikan kolom "Jumlah Laporan" pada Breakpoint_Mobile
3. THE halaman Basts/Index SHALL menyembunyikan kolom yang non-esensial pada Breakpoint_Mobile
4. THE halaman Invoices/Index SHALL menyembunyikan kolom "No. BAP" dan "Jatuh Tempo" pada Breakpoint_Mobile
5. THE halaman Clients/Index SHALL menyembunyikan kolom yang non-esensial pada Breakpoint_Mobile
6. THE halaman Services/Index SHALL menyembunyikan kolom "Satuan" dan "Tipe" pada Breakpoint_Mobile
7. WHEN kolom disembunyikan pada halaman manapun, THE DataTable SHALL tetap menampilkan kolom identifikasi utama dan kolom aksi

