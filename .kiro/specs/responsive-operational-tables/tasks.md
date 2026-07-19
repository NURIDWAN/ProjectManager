# Implementation Plan: Responsive Operational Tables

## Overview

Implementasi dilakukan secara bertahap dari fondasi (hooks, primitives) ke komponen shared (DataTable), lalu penerapan per-halaman. Setiap tahap membangun di atas tahap sebelumnya. Semua perubahan bersifat frontend-only menggunakan React + TypeScript + Tailwind CSS.

## Task Dependency Graph

```json
{
  "waves": [
    { "tasks": [1, 3] },
    { "tasks": [2] },
    { "tasks": [4] },
    { "tasks": [5] },
    { "tasks": [6, 7, 8, 9, 10, 11] },
    { "tasks": [12] },
    { "tasks": [13] },
    { "tasks": [14] }
  ]
}
```

## Tasks

- [x] 1. Buat hook `useMediaQuery`
  - Buat file `resources/js/hooks/useMediaQuery.ts`
  - Implementasi hook yang menggunakan `window.matchMedia` API
  - Handle SSR case (window undefined) dengan default `false`
  - Gunakan `useEffect` + `useState` untuk menghindari hydration mismatch
  - Export named function `useMediaQuery(query: string): boolean`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Buat hook `useResponsiveColumns` dan type augmentation
  - [x] 2.1 Buat type augmentation untuk ColumnMeta
    - Buat file `resources/js/types/table.ts`
    - Augment `@tanstack/react-table` ColumnMeta interface dengan `responsiveHidden` dan `cellClassName`
    - Import type file di `app.tsx` atau pastikan terdeteksi TypeScript
    - _Requirements: 1.4_
  - [x] 2.2 Implementasi hook `useResponsiveColumns`
    - Buat file `resources/js/hooks/useResponsiveColumns.ts`
    - Gunakan `useMediaQuery` untuk deteksi breakpoint mobile (< 768px) dan tablet (< 1024px)
    - Iterasi column definitions, baca `meta.responsiveHidden`, compute `VisibilityState`
    - Return `VisibilityState` object yang bisa langsung di-merge ke react-table state
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Hapus `whitespace-nowrap` default dari `table.tsx`
  - Edit `resources/js/components/ui/table.tsx`
  - Hapus `whitespace-nowrap` dari class default `TableCell` (baris `"p-2 align-middle whitespace-nowrap..."`)
  - Hapus `whitespace-nowrap` dari class default `TableHead` (baris `"h-10 px-2 text-left align-middle font-medium whitespace-nowrap..."`)
  - _Requirements: 2.1, 2.2_

- [x] 4. Integrasikan responsive column visibility ke `DataTable.tsx`
  - Import `useResponsiveColumns` di `resources/js/Components/DataTable.tsx`
  - Panggil hook dengan `columns` prop untuk mendapatkan `responsiveVisibility`
  - Merge responsive visibility sebagai base state: `{ ...responsiveVisibility, ...columnVisibility }`
  - Pass merged state ke `useReactTable` config
  - Pastikan `onColumnVisibilityChange` hanya update user state (bukan responsive state)
  - Hapus class `whitespace-nowrap` yang di-hardcode pada `<TableHead>` di dalam DataTable render
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Checkpoint - Pastikan fondasi berfungsi
  - Pastikan TypeScript tidak error, build berhasil
  - Verifikasi bahwa DataTable tanpa `meta.responsiveHidden` berperilaku sama seperti sebelumnya (backward compatible)
  - Tanyakan ke user jika ada pertanyaan

- [x] 6. Terapkan responsive columns pada halaman WorkReports/Index
  - Edit `resources/js/Pages/WorkReports/Index.tsx`
  - Tambahkan `meta: { responsiveHidden: 'mobile' }` pada kolom "Kategori" (`category_name`)
  - Tambahkan `meta: { responsiveHidden: 'mobile' }` pada kolom "Deskripsi" (`description`)
  - Tambahkan `meta: { responsiveHidden: 'tablet' }` pada kolom "Teknisi" (`technician_name`)
  - Perbaiki filter `SelectTrigger` width: `w-[160px]` → `w-full sm:w-[160px]`, `w-[200px]` → `w-full sm:w-[200px]`
  - Perbaiki pagination mobile: sembunyikan tombol numerik pada mobile, tampilkan hanya prev/next
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 6.1_

- [x] 7. Terapkan responsive columns pada halaman Baps/Index
  - Edit `resources/js/Pages/Baps/Index.tsx`
  - Tambahkan `meta: { responsiveHidden: 'mobile' }` pada kolom "Jumlah Laporan" (`jumlah_laporan`)
  - Perbaiki filter `SelectTrigger` width menjadi responsif
  - Perbaiki pagination mobile
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 6.2_

- [x] 8. Terapkan responsive columns pada halaman Basts/Index
  - Edit `resources/js/Pages/Basts/Index.tsx`
  - Tambahkan `meta: { responsiveHidden: 'mobile' }` pada kolom "BAP Nomor Surat" (`bap_nomor_surat`)
  - Perbaiki filter `SelectTrigger` width menjadi responsif
  - Perbaiki pagination mobile
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 6.3_

- [x] 9. Terapkan responsive columns pada halaman Invoices/Index
  - Edit `resources/js/Pages/Invoices/Index.tsx`
  - Tambahkan `meta: { responsiveHidden: 'mobile' }` pada kolom "No. BAP" (`bap_nomor`)
  - Tambahkan `meta: { responsiveHidden: 'mobile' }` pada kolom "Jatuh Tempo" (`due_date`)
  - Perbaiki filter `SelectTrigger` width menjadi responsif
  - Perbaiki pagination mobile
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 6.4_

- [x] 10. Terapkan responsive columns pada halaman Clients/Index
  - Edit `resources/js/Pages/Clients/Index.tsx`
  - Tambahkan `meta: { responsiveHidden: 'mobile' }` pada kolom "NPWP" (`npwp`)
  - Tambahkan `meta: { responsiveHidden: 'mobile' }` pada kolom "Alamat" (`address`)
  - Tambahkan `meta: { responsiveHidden: 'tablet' }` pada kolom "PIC" (`pic_name`)
  - Perbaiki filter `SelectTrigger` width menjadi responsif
  - Perbaiki pagination mobile
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 6.5_

- [x] 11. Terapkan responsive columns pada halaman Services/Index
  - Edit `resources/js/Pages/Services/Index.tsx`
  - Tambahkan `meta: { responsiveHidden: 'mobile' }` pada kolom "Satuan" (`unit`)
  - Tambahkan `meta: { responsiveHidden: 'mobile' }` pada kolom "Tipe" (`type`)
  - Perbaiki filter `SelectTrigger` width menjadi responsif
  - _Requirements: 3.1, 3.2, 3.3, 6.6_

- [x] 12. Checkpoint - Verifikasi semua halaman DataTable
  - Pastikan build berhasil tanpa TypeScript error
  - Verifikasi semua halaman menerapkan pola responsif yang konsisten
  - Tanyakan ke user jika ada pertanyaan

- [x] 13. Implementasi AcRecapTable responsive dengan sticky column
  - Edit `resources/js/Components/AcRecapTable.tsx`
  - Tambahkan `sticky left-0 z-10 bg-background` pada kolom pertama (NO) di header dan body
  - Tambahkan `shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]` sebagai visual separator pada sticky column
  - Pada mobile (< 768px): tambahkan class `text-xs p-1` untuk mengurangi padding dan font-size
  - Gunakan `useMediaQuery` untuk conditional class application
  - Pastikan background color solid pada sticky column agar tidak transparan saat scroll horizontal
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 14. Final checkpoint - Pastikan semua perubahan terintegrasi
  - Pastikan build berhasil tanpa error
  - Verifikasi backward compatibility (desktop view tidak berubah)
  - Tanyakan ke user jika ada pertanyaan

## Notes

- Semua perubahan bersifat frontend-only, tidak ada perubahan backend
- Perubahan pada `table.tsx` bersifat global — perlu dicek bahwa tidak ada tabel lain yang bergantung pada `whitespace-nowrap` default
- Pattern pagination mobile (hide numeric buttons) sebaiknya diekstrak ke komponen reusable jika pattern-nya identik di semua halaman
- Hook `useMediaQuery` menggunakan `useEffect` untuk menghindari hydration mismatch dengan Inertia.js SSR
- Tasks 6-11 bersifat independen satu sama lain dan bisa dikerjakan secara paralel setelah task 5 selesai
