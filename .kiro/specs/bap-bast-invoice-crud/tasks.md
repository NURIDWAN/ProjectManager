# Implementation Plan: BAP, BAST & Invoice CRUD

## Overview

Add edit and delete functionality to BAP, BAST, and Invoice modules. This involves backend route registration, controller modifications (removing status locks on BAP, adding edit/update to BAST, adding edit/update/destroy to Invoice), creating a shared DeleteConfirmationDialog component, building Edit pages for all three modules, and updating Index pages with action buttons.

## Tasks

- [x] 1. Backend route registration and controller changes
  - [x] 1.1 Update routes in `routes/web.php` for BAST and Invoice
    - Change BAST resource route from `->only(['index', 'create', 'store', 'show', 'destroy'])` to include `'edit', 'update'`
    - Change Invoice resource route from `->only(['index', 'create', 'store', 'show'])` to include `'edit', 'update', 'destroy'`
    - BAP already uses full `Route::resource` — no route change needed
    - _Requirements: 9.1, 9.2_

  - [x] 1.2 Remove status lock from `BapController` edit/update/destroy methods
    - In `app/Http/Controllers/BapController.php`
    - Remove the `if ($bap->status === Bap::STATUS_APPROVED) { abort(403, ...); }` check from `edit()`, `update()`, and `destroy()` methods
    - Keep all other logic unchanged
    - _Requirements: 1.3, 2.2, 9.3_

  - [x] 1.3 Add `edit()` and `update()` methods to `BastController`
    - In `app/Http/Controllers/BastController.php`
    - `edit($id)`: Load BAST with client and BAP relations, load available BAPs (approved, no existing BAST, or current BAP), render `Basts/Edit` Inertia page
    - `update(StoreBastRequest $request, $id)`: Parse tanggal, load BAP, normalize work items with sequential numbering, update BAST record, redirect to show with success flash
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.4 Add `edit()`, `update()`, and `destroy()` methods to `InvoiceController`
    - In `app/Http/Controllers/InvoiceController.php`
    - `edit($id)`: Load invoice with client and items.service, load clients/services/settings, render `Invoices/Edit` Inertia page
    - `update(StoreInvoiceRequest $request, $id)`: Calculate line totals, subtotal, ppn, grand_total; update invoice; delete existing items and recreate; redirect to show with success flash
    - `destroy($id)`: Delete invoice items first (cascade), then delete invoice; redirect to index with success flash
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2_

- [x] 2. Checkpoint - Verify backend changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create shared DeleteConfirmationDialog component
  - [x] 3.1 Create `resources/js/Components/DeleteConfirmationDialog.tsx`
    - Build a reusable AlertDialog component with props: `open`, `onOpenChange`, `title`, `description`, `onConfirm`, `processing`
    - Use existing `@/components/ui/alert-dialog` primitives (AlertDialog, AlertDialogAction, AlertDialogCancel, etc.)
    - Cancel button text: "Batal", confirm button text: "Hapus" (or "Menghapus..." when processing)
    - Apply `variant="destructive"` on the confirm action button
    - Disable both buttons while `processing` is true
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 4. Create Edit pages for BAP, BAST, and Invoice
  - [x] 4.1 Create `resources/js/Pages/Baps/Edit.tsx`
    - Props: `bap` (id, nomor_surat, client_id, tanggal, status, work_report_ids), `clients`, `workReports`
    - Pre-fill form fields from `bap` prop (client_id, tanggal, work_report_ids)
    - Submit via `router.put(`/baps/${bap.id}`, data)` using Inertia
    - Display server-side validation errors inline on form fields
    - Mirror the layout and Card structure from `Baps/Create.tsx`
    - Page title: "Edit BAP", submit button: "Simpan Perubahan"
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 4.2 Create `resources/js/Pages/Basts/Edit.tsx`
    - Props: `bast` (id, document_number, bap_id, tanggal, client_id, work_items), `availableBaps`
    - Pre-fill form with bast prop values including editable work_items table (add/remove rows)
    - BAP selector shows available BAPs (approved, no existing BAST, or the current one)
    - Submit via `router.put(`/basts/${bast.id}`, data)` using Inertia
    - Display server-side validation errors inline on form fields
    - Mirror the layout from `Basts/Create.tsx`
    - Page title: "Edit BAST", submit button: "Simpan Perubahan"
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.3 Create `resources/js/Pages/Invoices/Edit.tsx`
    - Props: `invoice` (id, invoice_number, client_id, items with service relation, discount_total, tax_percent, shipping_cost, grand_total, due_date, notes, terms), `clients`, `services`, `settings`
    - Pre-fill form from invoice prop, map items to form state with service_id, quantity, unit_price, discount_percent
    - Implement real-time calculation of subtotal, PPN, grand_total as items change (same `useMemo` pattern as Create.tsx)
    - Submit via `router.put(`/invoices/${invoice.id}`, data)` using Inertia
    - Display server-side validation errors inline on form fields
    - Mirror the layout from `Invoices/Create.tsx`
    - Page title: "Edit Invoice", submit button: "Simpan Perubahan"
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 5. Update Index pages with edit and delete action buttons
  - [x] 5.1 Update `resources/js/Pages/Baps/Index.tsx` with action buttons
    - Import `Pencil`, `Trash2` from lucide-react and `DeleteConfirmationDialog` component
    - Add state for `deleteTarget` (id + label) and `deleting` boolean
    - Add `handleDelete` function using `router.delete(`/baps/${deleteTarget.id}`)` with onSuccess/onError/onFinish callbacks
    - Update the `actions` column to include: view (Eye link), edit (Pencil link to `/baps/${id}/edit`), delete (Trash2 button setting deleteTarget)
    - Render `DeleteConfirmationDialog` at component bottom with title "Hapus BAP?" and description including `nomor_surat`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.4_

  - [x] 5.2 Update `resources/js/Pages/Basts/Index.tsx` with action buttons
    - Same pattern as BAP: import icons + dialog, add delete state/handler
    - Update the `actions` column: view (Eye link), edit (Pencil link to `/basts/${id}/edit`), delete (Trash2 button)
    - Render `DeleteConfirmationDialog` with title "Hapus BAST?" and description including `document_number`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.4_

  - [x] 5.3 Update `resources/js/Pages/Invoices/Index.tsx` with action buttons
    - Same pattern as BAP: import icons + dialog, add delete state/handler
    - Update the `actions` column: view (Eye link), edit (Pencil link to `/invoices/${id}/edit`), delete (Trash2 button)
    - Render `DeleteConfirmationDialog` with title "Hapus Invoice?" and description including `invoice_number`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.4_

- [x] 6. Final checkpoint - Ensure all changes work together
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- The project uses Laravel (PHP) for backend and React + TypeScript (Inertia.js) for frontend
- Existing `StoreBapRequest`, `StoreBastRequest`, and `StoreInvoiceRequest` form requests are reused for update validation
- Delete confirmation uses the existing `@/components/ui/alert-dialog` primitives already in the project
- Invoice update uses delete-and-recreate strategy for items (simpler than diffing)
- Edit pages mirror the corresponding Create pages in layout and structure
- BAP already has full resource routes registered; only the status lock needs removal
- Each task references specific requirements for traceability

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3"] }
  ]
}
```
