# Key Page Dependency Trees

## /dashboard (Dashboard Page)
Entry: `resources/js/Pages/Dashboard.tsx`
Dependencies:
- `resources/js/Layouts/AuthenticatedLayout.tsx`
  - `resources/js/Components/BrandIdentity.tsx`
  - `resources/js/Components/ThemeToggle.tsx`
  - `resources/js/components/ui/button.tsx`
  - `resources/js/components/ui/dropdown-menu.tsx`
  - `resources/js/components/ui/sheet.tsx`
- `resources/js/Components/PageHeader.tsx`
- `resources/js/Components/KpiCard.tsx`
  - `resources/js/components/ui/card.tsx`
- `resources/js/Components/RevenueChart.tsx`
  - `resources/js/components/ui/card.tsx`
  - `resources/js/components/ui/chart.tsx`
- `resources/js/Components/AcRecapTable.tsx`
  - `resources/js/components/ui/table.tsx`
  - `resources/js/Components/StatusBadge.tsx`

## /work-reports (Work Reports List)
Entry: `resources/js/Pages/WorkReports/Index.tsx`
Dependencies:
- `resources/js/Layouts/AuthenticatedLayout.tsx`
- `resources/js/Components/PageHeader.tsx`
- `resources/js/Components/DataTable.tsx`
  - `resources/js/components/ui/table.tsx`
  - `resources/js/components/ui/button.tsx`
  - `resources/js/components/ui/input.tsx`
  - `resources/js/components/ui/select.tsx`
- `resources/js/Components/StatusBadge.tsx`

## /baps (Berita Acara Pemeriksaan List)
Entry: `resources/js/Pages/Baps/Index.tsx`
Dependencies:
- `resources/js/Layouts/AuthenticatedLayout.tsx`
- `resources/js/Components/PageHeader.tsx`
- `resources/js/Components/DataTable.tsx`
- `resources/js/Components/StatusBadge.tsx`
- `resources/js/Components/PdfPreviewModal.tsx`
  - `resources/js/components/ui/dialog.tsx`

## /invoices (Invoices Management)
Entry: `resources/js/Pages/Invoices/Index.tsx`
Dependencies:
- `resources/js/Layouts/AuthenticatedLayout.tsx`
- `resources/js/Components/PageHeader.tsx`
- `resources/js/Components/DataTable.tsx`
- `resources/js/Components/StatusBadge.tsx`
- `resources/js/Components/PdfPreviewModal.tsx`

## /login (Auth Login Page)
Entry: `resources/js/Pages/Auth/Login.tsx`
Dependencies:
- `resources/js/Layouts/GuestLayout.tsx`
  - `resources/js/Components/BrandIdentity.tsx`
  - `resources/js/Components/ThemeToggle.tsx`
- `resources/js/components/ui/button.tsx`
- `resources/js/components/ui/input.tsx`
- `resources/js/components/ui/checkbox.tsx`
- `resources/js/components/ui/label.tsx`
