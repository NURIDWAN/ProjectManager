# Technical Design Document

## Overview

This design describes a reusable `PdfPreviewModal` React component that renders PDF documents inline within a shadcn/ui Dialog. The component is shared across Invoice Show, BAP Show, and BAST Show pages, consuming existing backend PDF export endpoints without requiring backend modifications. It leverages `react-pdf` for PDF rendering and provides page navigation and zoom controls.

## Architecture

### Component Hierarchy

```
Document_Show_Page (Invoice/BAP/BAST)
└── PdfPreviewModal
    ├── shadcn/ui Dialog (container + overlay)
    ├── Toolbar (fixed position)
    │   ├── PageNavigation (prev/next buttons + "Page X of Y")
    │   ├── ZoomControls (zoom-in/zoom-out/reset buttons + percentage label)
    │   └── CloseButton
    └── PdfViewer (scrollable content area)
        ├── LoadingState (skeleton)
        ├── ErrorState (message + retry button)
        └── react-pdf Document > Page
```

### Data Flow

```
User clicks "Review" button
  → Page sets `pdfPreviewOpen = true`
  → PdfPreviewModal receives `open=true`, `url="/baps/{id}/export-pdf"`
  → Component fetches PDF via react-pdf's Document `file` prop
  → react-pdf renders page into canvas
  → User interacts with navigation/zoom controls
  → User closes modal → state resets to defaults
```

## Components and Interfaces

### PdfPreviewModal

The primary reusable component. Located at `resources/js/Components/PdfPreviewModal.tsx`.

```typescript
import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    X,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    title?: string;
}

const DEFAULT_ZOOM = 100;
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;

export function PdfPreviewModal({ open, onOpenChange, url, title }: PdfPreviewModalProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const resetState = useCallback(() => {
        setCurrentPage(1);
        setZoom(DEFAULT_ZOOM);
        setError(null);
        setLoading(true);
        setNumPages(0);
    }, []);

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open) {
            resetState();
        }
        onOpenChange(open);
    }, [onOpenChange, resetState]);

    const handleDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
        setError(null);
    }, []);

    const handleDocumentLoadError = useCallback((err: Error) => {
        setError(err.message || 'Gagal memuat dokumen PDF.');
        setLoading(false);
    }, []);

    const handleRetry = useCallback(() => {
        setError(null);
        setLoading(true);
        // Force react-pdf to re-fetch by toggling key (handled via state reset)
    }, []);

    const goToNextPage = useCallback(() => {
        setCurrentPage((prev) => Math.min(prev + 1, numPages));
    }, [numPages]);

    const goToPrevPage = useCallback(() => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    }, []);

    const zoomIn = useCallback(() => {
        setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    }, []);

    const zoomOut = useCallback(() => {
        setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    }, []);

    const resetZoom = useCallback(() => {
        setZoom(DEFAULT_ZOOM);
    }, []);

    const scale = zoom / 100;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-full max-w-[900px] flex-col gap-0 p-0">
                <DialogTitle className="sr-only">
                    {title ?? 'Preview PDF'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Preview dokumen PDF
                </DialogDescription>

                {/* Toolbar */}
                <div className="flex items-center justify-between border-b px-4 py-2">
                    {/* Page Navigation */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={goToPrevPage}
                            disabled={loading || !!error || currentPage <= 1}
                            aria-label="Halaman sebelumnya"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {numPages || '—'}
                        </span>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={goToNextPage}
                            disabled={loading || !!error || currentPage >= numPages}
                            aria-label="Halaman berikutnya"
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={zoomOut}
                            disabled={loading || !!error || zoom <= MIN_ZOOM}
                            aria-label="Perkecil"
                        >
                            <ZoomOut className="size-4" />
                        </Button>
                        <span className="w-12 text-center text-sm text-muted-foreground">
                            {zoom}%
                        </span>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={zoomIn}
                            disabled={loading || !!error || zoom >= MAX_ZOOM}
                            aria-label="Perbesar"
                        >
                            <ZoomIn className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={resetZoom}
                            disabled={loading || !!error}
                            aria-label="Reset zoom"
                        >
                            <RotateCcw className="size-3.5" />
                        </Button>
                    </div>

                    {/* Close */}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenChange(false)}
                        aria-label="Tutup"
                    >
                        <X className="size-4" />
                    </Button>
                </div>

                {/* PDF Content Area */}
                <div className="flex-1 overflow-auto bg-muted/30 p-4">
                    {error ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12">
                            <AlertCircle className="size-10 text-destructive" />
                            <p className="text-sm text-destructive">{error}</p>
                            <Button variant="outline" size="sm" onClick={handleRetry}>
                                <RefreshCw className="mr-2 size-4" />
                                Coba Lagi
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <Document
                                file={url}
                                onLoadSuccess={handleDocumentLoadSuccess}
                                onLoadError={handleDocumentLoadError}
                                loading={
                                    <div className="flex flex-col items-center gap-4 py-12">
                                        <Skeleton className="h-[600px] w-[450px]" />
                                    </div>
                                }
                            >
                                <Page
                                    pageNumber={currentPage}
                                    scale={scale}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    loading={
                                        <Skeleton className="h-[600px] w-[450px]" />
                                    }
                                />
                            </Document>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
```

### Integration on Show Pages

Each Document Show page adds a "Review" button that toggles the modal open state.

```typescript
// Example integration in resources/js/Pages/Baps/Show.tsx
import { useState } from 'react';
import { PdfPreviewModal } from '@/Components/PdfPreviewModal';
import { Eye, Download } from 'lucide-react';

// Inside the component:
const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

// In the header actions area:
<Button variant="outline" size="sm" onClick={() => setPdfPreviewOpen(true)}>
    <Eye className="mr-2 size-4" />
    Review
</Button>
<Button variant="outline" size="sm" onClick={handleExportPdf}>
    <Download className="mr-2 size-4" />
    Download PDF
</Button>

// At the bottom of the component's JSX:
<PdfPreviewModal
    open={pdfPreviewOpen}
    onOpenChange={setPdfPreviewOpen}
    url={`/baps/${bap.id}/export-pdf`}
    title={`BAP - ${bap.nomor_surat}`}
/>
```

The same pattern applies to Invoice Show (`/invoices/${invoice.id}/export-pdf`) and BAST Show (`/basts/${bast.id}/export-pdf`).

### PdfPreviewModalProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | Yes | Controls modal visibility |
| `onOpenChange` | `(open: boolean) => void` | Yes | Callback when modal open state changes |
| `url` | `string` | Yes | URL of the PDF endpoint to fetch |
| `title` | `string` | No | Accessible title for the dialog (screen readers) |

### Internal State

| State | Type | Default | Description |
|-------|------|---------|-------------|
| `numPages` | `number` | `0` | Total number of pages in the PDF |
| `currentPage` | `number` | `1` | Currently displayed page (1-indexed) |
| `zoom` | `number` | `100` | Current zoom percentage |
| `loading` | `boolean` | `true` | Whether the PDF is currently loading |
| `error` | `string \| null` | `null` | Error message if PDF failed to load |

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_ZOOM` | `100` | Default zoom percentage |
| `MIN_ZOOM` | `50` | Minimum allowed zoom percentage |
| `MAX_ZOOM` | `200` | Maximum allowed zoom percentage |
| `ZOOM_STEP` | `25` | Percentage increment per zoom action |

## Data Models

No new data models or database changes are required. The feature exclusively consumes existing PDF export endpoints that return binary PDF responses.

### PDF Endpoint Response

```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: inline; filename="document.pdf"

<binary PDF data>
```

### Error Response (non-200)

```
HTTP/1.1 404 Not Found
Content-Type: application/json

{ "message": "Document not found" }
```

## State Machine

The PdfPreviewModal operates as a state machine with three primary states:

```
┌─────────┐    onOpen     ┌─────────┐    onLoadSuccess   ┌──────────┐
│  CLOSED │ ─────────────→│ LOADING │ ──────────────────→ │  READY   │
└─────────┘               └─────────┘                     └──────────┘
     ↑                         │                               │
     │                         │ onLoadError                   │
     │                         ↓                               │
     │                    ┌─────────┐                          │
     │                    │  ERROR  │←── onRetry ──────────────┘
     │                    └─────────┘                          │
     │                         │                               │
     └──── onClose ────────────┴──────────── onClose ──────────┘
```

**State transitions:**
- `CLOSED → LOADING`: Modal opens, react-pdf begins fetching PDF
- `LOADING → READY`: PDF loaded successfully, page and zoom controls active
- `LOADING → ERROR`: PDF fetch or parse failed
- `ERROR → LOADING`: User clicks "Retry"
- `READY → CLOSED` or `ERROR → CLOSED`: User closes modal, state resets
- `READY → ERROR`: Subsequent page load fails (rare edge case)

## Error Handling

| Scenario | Handling |
|----------|----------|
| Network error (no connectivity) | Display error message with "Coba Lagi" retry button |
| Server error (500) | Display error message with retry button |
| Not found (404) | Display error message indicating document not found |
| PDF parse error | Display error from react-pdf with retry button |
| Worker load failure | Fallback: react-pdf attempts inline parsing |

## Dependencies

### New Package

- `react-pdf` — React component library for rendering PDF documents using PDF.js
  - Peer dependency: `pdfjs-dist` (included with react-pdf)

### Existing Packages Used

- `@/components/ui/dialog` — shadcn/ui Dialog (needs to be installed via shadcn CLI)
- `@/components/ui/button` — shadcn/ui Button
- `@/components/ui/skeleton` — shadcn/ui Skeleton
- `lucide-react` — Icons

### shadcn/ui Dialog Installation

The project doesn't have a Dialog component yet. Install via:

```bash
npx shadcn@latest add dialog
```

## File Structure

```
resources/js/
├── Components/
│   └── PdfPreviewModal.tsx          # Reusable PDF preview modal component
├── components/ui/
│   └── dialog.tsx                   # shadcn/ui Dialog (new, installed via CLI)
└── Pages/
    ├── Baps/
    │   └── Show.tsx                 # Add Review button + PdfPreviewModal
    ├── Invoices/
    │   └── Show.tsx                 # Add Review button + PdfPreviewModal
    └── Basts/
        └── Show.tsx                 # Add Review button + PdfPreviewModal
```

## Responsive Behavior

| Viewport | Modal Width | Modal Height | Padding |
|----------|-------------|--------------|---------|
| Desktop (≥768px) | max 900px | max 90vh | 0 (full dialog content) |
| Tablet/Mobile (<768px) | 100% - 32px | max 90vh | 16px horizontal |

The toolbar (navigation + zoom) remains fixed at the top of the modal. The PDF content area scrolls independently below.

## Accessibility

- Dialog uses `aria-labelledby` via `DialogTitle` (visually hidden with `sr-only`)
- All icon-only buttons include `aria-label` attributes
- Keyboard navigation: Escape closes modal, Tab cycles through controls
- Focus is trapped inside the modal when open (handled by shadcn/ui Dialog)
- Disabled states communicated via `aria-disabled`

## Testing Strategy

### Unit Tests (Example-Based)

- Verify "Review" button renders on each Show page (Invoice, BAP, BAST)
- Verify "Download PDF" button renders on each Show page
- Verify loading skeleton appears while PDF is loading
- Verify controls are disabled during loading state
- Verify error message and "Coba Lagi" button appear on load failure
- Verify controls are hidden during error state
- Verify zoom controls (zoom-in, zoom-out, reset) render in toolbar

### Property-Based Tests

- Page navigation bounds (Property 1): Generate random totalPages and sequences of next/prev actions, verify currentPage always in [1, N]
- Page counter format (Property 2): Generate random (currentPage, numPages) pairs, verify display string format
- Zoom level invariant (Property 3): Generate random sequences of zoom-in/zoom-out/reset operations, verify zoom always in [50, 200] and divisible by 25
- Close resets state (Property 4): Generate random modal states (page, zoom), simulate close, verify reset to defaults
- URL construction (Property 5): Generate random document types and IDs, verify correct URL pattern

### Integration Tests

- Verify existing PDF export endpoints return `Content-Type: application/pdf`
- Verify modal opens and renders a real PDF from the endpoint (end-to-end)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Page navigation stays within bounds

*For any* PDF with N pages (N ≥ 1), and any sequence of next/previous page actions, the current page number shall always satisfy 1 ≤ currentPage ≤ N.

**Validates: Requirements 1.5, 1.6, 1.7, 1.8**

### Property 2: Page counter format consistency

*For any* PDF with N total pages and current page P (where 1 ≤ P ≤ N), the displayed page indicator string shall always equal `"Page {P} of {N}"`.

**Validates: Requirements 1.3**

### Property 3: Zoom level invariant

*For any* sequence of zoom-in, zoom-out, and reset-zoom operations applied from any initial zoom state, the resulting zoom level shall always satisfy 50 ≤ zoom ≤ 200 and zoom shall always be a multiple of 25.

**Validates: Requirements 1.10, 1.11, 1.12**

### Property 4: Close resets all internal state

*For any* modal state (currentPage = P, zoom = Z, numPages = N) where the modal is open, closing the modal shall reset the state to (currentPage = 1, zoom = 100, error = null, loading = true, numPages = 0).

**Validates: Requirements 1.13**

### Property 5: PDF URL construction per document type

*For any* document type in {invoice, bap, bast} and any positive integer ID, the URL passed to PdfPreviewModal shall equal `"/{documentType}s/{id}/export-pdf"`.

**Validates: Requirements 2.3, 2.5, 2.6, 2.7**

### Property 6: Non-200 response triggers error state

*For any* HTTP response with a status code outside the 2xx range, the PdfPreviewModal shall transition to the error state displaying an error message and a retry button.

**Validates: Requirements 4.4, 3.3, 3.4, 3.5**
