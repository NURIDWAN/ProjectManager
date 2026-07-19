# Design Document: BAP, BAST & Invoice CRUD

## Overview

This feature extends the existing Laravel + Inertia.js + React architecture to add edit and delete functionality to BAP, BAST, and Invoice modules. The design follows the established patterns already present in the codebase (WorkReports Edit, DataTable with action columns, AlertDialog for confirmations).

### Key Design Decisions

1. **Remove status lock on BAP**: Current `edit()`, `update()`, and `destroy()` methods in `BapController` abort with 403 for approved BAPs. This restriction will be removed.
2. **Reuse existing Form Request classes**: `StoreBapRequest` and `StoreBastRequest` will be reused for update validation (Laravel's standard pattern with `_method: PUT`). Invoice update reuses `StoreInvoiceRequest`.
3. **Shared DeleteConfirmationDialog component**: A reusable component used across all three Index pages.
4. **Invoice items sync on update**: On invoice update, existing items are deleted and recreated (simpler than diffing).

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Routes (web.php)                       │
│  baps: resource (full)                                   │
│  basts: resource + edit, update                          │
│  invoices: resource + edit, update, destroy              │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│              Controllers                                  │
│  BapController     - remove status lock on edit/update/  │
│                      destroy                             │
│  BastController    - add edit(), update() methods        │
│  InvoiceController - add edit(), update(), destroy()     │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│              Frontend Pages                               │
│  Baps/Edit.tsx     - new page (pre-filled form)          │
│  Basts/Edit.tsx    - new page (pre-filled form)          │
│  Invoices/Edit.tsx - new page (pre-filled form)          │
│  Baps/Index.tsx    - add edit/delete action buttons      │
│  Basts/Index.tsx   - add edit/delete action buttons      │
│  Invoices/Index.tsx- add edit/delete action buttons      │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│         Shared Components                                 │
│  DeleteConfirmationDialog - reusable AlertDialog          │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**Edit Flow:**
```
User clicks Edit → GET /module/{id}/edit → Controller loads record + form data
→ Inertia renders Edit.tsx with props → User modifies form → Submit
→ PUT /module/{id} → FormRequest validates → Controller updates DB
→ Redirect to Show page with flash message
```

**Delete Flow:**
```
User clicks Trash icon → DeleteConfirmationDialog opens → User clicks "Hapus"
→ router.delete(`/module/${id}`) → Controller deletes record
→ Redirect to Index page with flash message
```

## Components and Interfaces

### Backend Components

#### 1. Route Changes (`routes/web.php`)

```php
// BAP - already uses Route::resource('baps', BapController::class) which includes all CRUD routes
// No route change needed for BAP

// BAST - add edit and update to the existing only() list
Route::resource('basts', BastController::class)->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']);

// Invoice - add edit, update, and destroy to the existing only() list
Route::resource('invoices', InvoiceController::class)->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']);
```

#### 2. BapController Changes

Remove the status lock in `edit()`, `update()`, and `destroy()` methods:

```php
public function edit($id): Response
{
    $bap = Bap::with('client')->findOrFail($id);

    // Status lock REMOVED - allow editing regardless of status

    $clients = Client::active()->select('id', 'name')->orderBy('name')->get();
    $workReportsQuery = WorkReport::with(['client', 'category'])
        ->where('status', WorkReport::STATUS_SUBMITTED);
    $workReports = $workReportsQuery->latest()->get();

    return Inertia::render('Baps/Edit', [
        'bap' => $bap,
        'clients' => $clients,
        'workReports' => $workReports,
    ]);
}

public function update(StoreBapRequest $request, $id): RedirectResponse
{
    $bap = Bap::findOrFail($id);

    // Status lock REMOVED

    $bap->update([
        'client_id' => $request->input('client_id'),
        'tanggal' => Carbon::parse($request->input('tanggal')),
        'work_report_ids' => $request->input('work_report_ids'),
    ]);

    return Redirect::route('baps.show', $bap->id)
        ->with('success', 'BAP berhasil diperbarui.');
}

public function destroy($id): RedirectResponse
{
    $bap = Bap::findOrFail($id);

    // Status lock REMOVED

    $bap->delete();

    return Redirect::route('baps.index')
        ->with('success', 'BAP berhasil dihapus.');
}
```

#### 3. BastController - New `edit()` and `update()` Methods

```php
public function edit($id): Response
{
    $bast = Bast::with(['client', 'bap'])->findOrFail($id);

    // Load approved BAPs for selection (include current BAP even if no longer approved)
    $availableBaps = Bap::where('status', 'approved')
        ->doesntHave('bast')
        ->orWhere('id', $bast->bap_id)
        ->with('client')
        ->get();

    return Inertia::render('Basts/Edit', [
        'bast' => $bast,
        'availableBaps' => $availableBaps,
    ]);
}

public function update(StoreBastRequest $request, $id): RedirectResponse
{
    $bast = Bast::findOrFail($id);

    $tanggal = Carbon::parse($request->input('tanggal'));
    $bap = Bap::findOrFail($request->input('bap_id'));

    // Normalize work items with sequential numbering
    $workItems = collect($request->input('work_items'))->values()->map(function ($item, $index) {
        return [
            'no' => $index + 1,
            'uraian_pekerjaan' => $item['uraian_pekerjaan'],
            'satuan' => $item['satuan'],
            'jumlah' => (int) $item['jumlah'],
            'keterangan' => $item['keterangan'] ?? '',
        ];
    })->toArray();

    $bast->update([
        'bap_id' => $bap->id,
        'tanggal' => $tanggal,
        'client_id' => $bap->client_id,
        'work_items' => $workItems,
    ]);

    return Redirect::route('basts.show', $bast->id)
        ->with('success', 'BAST berhasil diperbarui.');
}
```

#### 4. InvoiceController - New `edit()`, `update()`, `destroy()` Methods

```php
public function edit($id): Response
{
    $invoice = Invoice::with(['client', 'items.service'])->findOrFail($id);

    $clients = Client::select('id', 'name', 'address', 'pic_name', 'npwp')->orderBy('name')->get();
    $services = Service::active()->orderBy('name')->get();
    $settings = CompanySetting::allSettings();

    return Inertia::render('Invoices/Edit', [
        'invoice' => $invoice,
        'clients' => $clients,
        'services' => $services,
        'settings' => $settings,
    ]);
}

public function update(StoreInvoiceRequest $request, $id): RedirectResponse
{
    $invoice = Invoice::findOrFail($id);

    // Calculate totals from items
    $items = $request->input('items', []);
    $lineTotals = [];

    foreach ($items as $item) {
        $lineTotal = $this->calculationService->calculateLineTotal(
            (float) $item['quantity'],
            (float) $item['unit_price'],
            (float) ($item['discount_percent'] ?? 0)
        );
        $lineTotals[] = $lineTotal;
    }

    $subtotal = $this->calculationService->calculateSubtotal($lineTotals);
    $discountTotal = (float) ($request->input('discount_total') ?? 0);
    $taxPercent = (float) ($request->input('tax_percent') ?? 11);
    $shippingCost = (float) ($request->input('shipping_cost') ?? 0);

    $ppn = round(($subtotal - $discountTotal) * ($taxPercent / 100), 2);
    $grandTotal = round($subtotal - $discountTotal + $ppn + $shippingCost, 2);

    $invoice->update([
        'client_id' => $request->input('client_id'),
        'subtotal' => $subtotal,
        'discount_total' => $discountTotal,
        'tax_percent' => $taxPercent,
        'ppn' => $ppn,
        'shipping_cost' => $shippingCost,
        'grand_total' => $grandTotal,
        'due_date' => $request->input('due_date'),
        'notes' => $request->input('notes'),
        'terms' => $request->input('terms'),
    ]);

    // Sync items: delete existing and recreate
    $invoice->items()->delete();

    foreach ($items as $index => $item) {
        $invoice->items()->create([
            'service_id' => $item['service_id'],
            'quantity' => $item['quantity'],
            'unit_price' => $item['unit_price'],
            'discount_percent' => $item['discount_percent'] ?? 0,
            'line_total' => $lineTotals[$index],
        ]);
    }

    return Redirect::route('invoices.show', $invoice->id)
        ->with('success', 'Invoice berhasil diperbarui.');
}

public function destroy($id): RedirectResponse
{
    $invoice = Invoice::findOrFail($id);

    // Cascade: delete items first, then invoice
    $invoice->items()->delete();
    $invoice->delete();

    return Redirect::route('invoices.index')
        ->with('success', 'Invoice berhasil dihapus.');
}
```

### Frontend Components

#### 1. Shared `DeleteConfirmationDialog` Component

Located at `resources/js/Components/DeleteConfirmationDialog.tsx`:

```typescript
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    processing?: boolean;
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    processing = false,
}: DeleteConfirmationDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={processing}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={processing}
                    >
                        {processing ? 'Menghapus...' : 'Hapus'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
```

#### 2. Index Page Action Column Pattern

Each Index page (BAP, BAST, Invoice) will have the action column updated with three buttons in order: view (Eye), edit (Pencil), delete (Trash2):

```typescript
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/Components/DeleteConfirmationDialog';

// State in the component:
const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
const [deleting, setDeleting] = useState(false);

const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    router.delete(`/baps/${deleteTarget.id}`, {
        onSuccess: () => {
            toast.success('Data berhasil dihapus.');
            setDeleteTarget(null);
        },
        onError: () => toast.error('Gagal menghapus data.'),
        onFinish: () => setDeleting(false),
    });
};

// In the columns definition:
{
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) => {
        const item = row.original;
        return (
            <div className="flex items-center gap-1">
                <Link href={`/baps/${item.id}`}>
                    <Button variant="ghost" size="icon-sm" title="Lihat Detail">
                        <Eye className="size-4" />
                    </Button>
                </Link>
                <Link href={`/baps/${item.id}/edit`}>
                    <Button variant="ghost" size="icon-sm" title="Edit">
                        <Pencil className="size-4" />
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Hapus"
                    onClick={() => setDeleteTarget({ id: item.id, label: item.nomor_surat })}
                >
                    <Trash2 className="size-4 text-destructive" />
                </Button>
            </div>
        );
    },
}

// Dialog at component bottom:
<DeleteConfirmationDialog
    open={!!deleteTarget}
    onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
    title="Hapus BAP?"
    description={`Apakah Anda yakin ingin menghapus BAP "${deleteTarget?.label}"? Tindakan ini tidak dapat dibatalkan.`}
    onConfirm={handleDelete}
    processing={deleting}
/>
```

#### 3. Edit Pages

##### `Baps/Edit.tsx`

**Props interface:**
```typescript
interface Props {
    bap: {
        id: number;
        nomor_surat: string;
        client_id: number;
        tanggal: string;
        status: string;
        work_report_ids: number[];
    };
    clients: { id: number; name: string }[];
    workReports: WorkReport[];
}
```

**Key behavior:**
- Initialize form state from `bap` prop (client_id, tanggal, work_report_ids)
- Submit via `router.put(`/baps/${bap.id}`, data)`
- Display validation errors from server response
- Layout mirrors existing Create page structure with Card components

##### `Basts/Edit.tsx`

**Props interface:**
```typescript
interface Props {
    bast: {
        id: number;
        document_number: string;
        bap_id: number;
        tanggal: string;
        client_id: number;
        work_items: WorkItem[];
    };
    availableBaps: Bap[];
}
```

**Key behavior:**
- Initialize form with `bast` prop values including work_items array
- Work items table editable (add/remove rows)
- Submit via `router.put(`/basts/${bast.id}`, data)`
- BAP selector shows available BAPs (approved, no existing BAST, or current)

##### `Invoices/Edit.tsx`

**Props interface:**
```typescript
interface Props {
    invoice: {
        id: number;
        invoice_number: string;
        client_id: number;
        subtotal: number;
        discount_total: number;
        tax_percent: number;
        ppn: number;
        shipping_cost: number;
        grand_total: number;
        due_date: string | null;
        status: string;
        notes: string | null;
        terms: string | null;
        items: {
            id: number;
            service_id: number;
            quantity: number;
            unit_price: number;
            discount_percent: number;
            line_total: number;
            service: { id: number; name: string; unit: string };
        }[];
    };
    clients: ClientOption[];
    services: ServiceOption[];
    settings: Settings;
}
```

**Key behavior:**
- Initialize form state from `invoice` prop (including items array mapped to form state)
- Real-time calculation of subtotal, PPN, grand total as items change (same `useMemo` as Create)
- Submit via `router.put(`/invoices/${invoice.id}`, data)`
- Same visual layout as Create.tsx but with pre-filled values and "Simpan Perubahan" button

## Data Models

### Existing Models (No Changes Required)

| Model | Key Fields | Relationships |
|-------|-----------|---------------|
| `Bap` | id, nomor_surat, client_id, tanggal, status, work_report_ids, signed_by | belongsTo(Client), hasOne(Bast) |
| `Bast` | id, bap_id, document_number, tanggal, client_id, work_items (JSON) | belongsTo(Bap), belongsTo(Client) |
| `Invoice` | id, invoice_number, client_id, subtotal, discount_total, tax_percent, ppn, shipping_cost, grand_total, due_date, status, notes, terms | belongsTo(Client), hasMany(InvoiceItem) |
| `InvoiceItem` | id, invoice_id, service_id, quantity, unit_price, discount_percent, line_total | belongsTo(Invoice), belongsTo(Service) |

### Validation Rules (Reused)

**BAP Update** — reuses `StoreBapRequest`:
- `client_id`: required, exists:clients
- `tanggal`: required, date
- `work_report_ids`: required, array, min:1
- `work_report_ids.*`: required, integer, exists:work_reports

**BAST Update** — reuses `StoreBastRequest`:
- `bap_id`: required, exists:baps
- `tanggal`: required, date
- `work_items`: required, array, min:1
- `work_items.*.uraian_pekerjaan`: required, string, max:255
- `work_items.*.satuan`: required, string, max:50
- `work_items.*.jumlah`: required, integer, min:1
- `work_items.*.keterangan`: nullable, string, max:255

**Invoice Update** — reuses `StoreInvoiceRequest`:
- `client_id`: required, exists:clients
- `due_date`: nullable, date
- `notes`: nullable, string, max:2000
- `terms`: nullable, string, max:2000
- `tax_percent`: nullable, numeric, 0-100
- `discount_total`: nullable, numeric, min:0
- `shipping_cost`: nullable, numeric, min:0
- `items`: required, array, min:1
- `items.*.service_id`: required, exists:services
- `items.*.quantity`: required, numeric, min:0.01
- `items.*.unit_price`: required, numeric, min:0
- `items.*.discount_percent`: nullable, numeric, 0-100

## Error Handling

| Scenario | Backend Response | Frontend Behavior |
|----------|-----------------|-------------------|
| Validation fails on update | 422 with error bag | Display inline errors on form fields |
| Record not found (edit/delete) | 404 | Inertia error page |
| Unauthorized (non-admin) | 403 via middleware | Redirect to login or error page |
| Network error during delete | Connection error | Toast error message, dialog stays open |

## Testing Strategy

### Unit Tests
- Verify controller `edit()` returns correct Inertia props
- Verify controller `update()` persists data correctly for each module
- Verify controller `destroy()` removes records (including cascade for Invoice)
- Verify BAP operations work regardless of status

### Property-Based Tests
- Invoice calculation correctness across random item sets
- Status-agnostic operation verification across all status values
- Validation rejection for randomly generated invalid inputs

### Integration Tests
- Full edit flow: navigate → modify → submit → verify redirect + DB state
- Full delete flow: click delete → confirm → verify redirect + DB state
- Delete cancel flow: click delete → cancel → verify record unchanged

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Status-agnostic CRUD operations

*For any* BAP document of any status (draft or approved) and *for any* Invoice document of any status (draft, unpaid, overdue, or paid), edit and delete operations SHALL succeed without restriction.

**Validates: Requirements 1.3, 2.2, 5.4, 6.2, 9.3**

### Property 2: Update persistence for valid data

*For any* valid input data submitted to a BAP or BAST update endpoint, the corresponding database record SHALL reflect the new values after the operation completes, and the response SHALL redirect to the detail page.

**Validates: Requirements 1.2, 3.2**

### Property 3: Invalid input rejection preserves original data

*For any* invalid input submitted to the update endpoint of BAP, BAST, or Invoice, the system SHALL return validation errors and the database record SHALL remain unchanged from its state before the request.

**Validates: Requirements 1.4, 3.3, 5.5**

### Property 4: Delete removes record from database

*For any* BAP or BAST document, after a successful delete operation, querying the database for that record by ID SHALL return no result.

**Validates: Requirements 2.1, 4.1**

### Property 5: Invoice total calculation correctness

*For any* set of invoice items with quantities, unit prices, and discount percentages, along with a tax percent, discount total, and shipping cost, the computed grand total SHALL equal: `(subtotal - discount_total) + ((subtotal - discount_total) * tax_percent / 100) + shipping_cost`, where subtotal is the sum of all line totals, and each line total is `quantity * unit_price * (1 - discount_percent / 100)`.

**Validates: Requirements 5.2**

### Property 6: Invoice cascade delete

*For any* Invoice with associated invoice items, after a successful delete operation, both the invoice record AND all its associated item records SHALL no longer exist in the database.

**Validates: Requirements 6.1**

### Property 7: Delete confirmation dialog guards deletion

*For any* document where the delete confirmation dialog is shown, if the cancel action is chosen, the document SHALL remain in the database unchanged. Deletion SHALL only occur after explicit confirmation.

**Validates: Requirements 8.3, 8.4**
