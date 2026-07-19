# Implementation Plan: PDF Preview Modal

## Overview

Implement a reusable `PdfPreviewModal` React component using `react-pdf` and shadcn/ui Dialog, then integrate it into the BAP Show, Invoice Show, and BAST Show pages with "Review" and "Download PDF" action buttons. No backend changes required.

## Tasks

- [x] 1. Install dependencies and set up project structure
  - [x] 1.1 Install react-pdf package and shadcn/ui Dialog component
    - Run `npm install react-pdf` to add the PDF rendering library
    - Run `npx shadcn@latest add dialog` to install the shadcn/ui Dialog component
    - Verify `react-pdf` and `pdfjs-dist` appear in `package.json` dependencies
    - Verify `resources/js/components/ui/dialog.tsx` is created
    - _Requirements: 1.14, 5.5_

- [x] 2. Implement PdfPreviewModal component
  - [x] 2.1 Create PdfPreviewModal component with PDF rendering, navigation, and zoom
    - Create `resources/js/Components/PdfPreviewModal.tsx`
    - Configure PDF.js worker source URL
    - Implement props interface: `open`, `onOpenChange`, `url`, `title`
    - Implement internal state: `numPages`, `currentPage`, `zoom`, `loading`, `error`
    - Define constants: `DEFAULT_ZOOM=100`, `MIN_ZOOM=50`, `MAX_ZOOM=200`, `ZOOM_STEP=25`
    - Implement `resetState` callback that resets all state to defaults on close
    - Implement page navigation: `goToNextPage` (clamped to numPages), `goToPrevPage` (clamped to 1)
    - Implement zoom controls: `zoomIn` (+25, max 200), `zoomOut` (-25, min 50), `resetZoom` (100)
    - Render shadcn/ui Dialog with `DialogTitle` (sr-only for accessibility) and `DialogDescription`
    - Render toolbar with page navigation buttons, page indicator ("Page X of Y"), zoom controls, and close button
    - Disable navigation/zoom controls while loading or in error state
    - Disable prev button when on first page, disable next button when on last page
    - Disable zoom-out at MIN_ZOOM, disable zoom-in at MAX_ZOOM
    - Render react-pdf `Document` component with `file={url}`, `onLoadSuccess`, `onLoadError`
    - Render react-pdf `Page` component with `pageNumber={currentPage}`, `scale={zoom/100}`
    - Show loading skeleton while PDF is loading
    - Show error state with message and "Coba Lagi" retry button on load failure
    - Apply responsive styles: max-w-[900px], max-h-[90vh], scrollable content area
    - Add `aria-label` attributes to all icon-only buttons
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 3.1, 3.2, 3.3, 3.4, 3.5, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.2 Write property test: Page navigation stays within bounds
    - **Property 1: Page navigation stays within bounds**
    - Generate random `totalPages` (1–100) and random sequences of next/prev actions
    - Assert `currentPage` always satisfies `1 ≤ currentPage ≤ totalPages`
    - **Validates: Requirements 1.5, 1.6, 1.7, 1.8**

  - [ ]* 2.3 Write property test: Zoom level invariant
    - **Property 3: Zoom level invariant**
    - Generate random sequences of zoom-in, zoom-out, and reset operations
    - Assert zoom always satisfies `50 ≤ zoom ≤ 200` and `zoom % 25 === 0`
    - **Validates: Requirements 1.10, 1.11, 1.12**

  - [ ]* 2.4 Write property test: Close resets all internal state
    - **Property 4: Close resets all internal state**
    - Generate random modal states (currentPage, zoom)
    - Simulate close action and assert state resets to `(currentPage=1, zoom=100, error=null, loading=true, numPages=0)`
    - **Validates: Requirements 1.13**

- [x] 3. Checkpoint - Verify PdfPreviewModal component
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Integrate PdfPreviewModal into document Show pages
  - [x] 4.1 Add Review and Download PDF buttons to BAP Show page
    - Import `PdfPreviewModal` and `Eye` icon in `resources/js/Pages/Baps/Show.tsx`
    - Add `pdfPreviewOpen` state (useState)
    - Add "Review" button with `Eye` icon in the header actions area (next to existing "Export PDF" button)
    - Rename existing "Export PDF" button text to "Download PDF" with `Download` icon
    - Update `handleExportPdf` to trigger a direct download (or keep window.open to new tab)
    - Render `<PdfPreviewModal>` at the bottom of the component JSX with `url={/baps/${bap.id}/export-pdf}` and `title={BAP - ${bap.nomor_surat}}`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 4.2 Add Review and Download PDF buttons to Invoice Show page
    - Import `PdfPreviewModal` and `Eye` icon in `resources/js/Pages/Invoices/Show.tsx`
    - Add `pdfPreviewOpen` state (useState)
    - Add "Review" button with `Eye` icon in the header actions area
    - Ensure "Download PDF" button with `Download` icon exists in the header actions area
    - Render `<PdfPreviewModal>` with `url={/invoices/${invoice.id}/export-pdf}` and appropriate title
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 4.3 Add Review and Download PDF buttons to BAST Show page
    - Import `PdfPreviewModal` and `Eye` icon in `resources/js/Pages/Basts/Show.tsx`
    - Add `pdfPreviewOpen` state (useState)
    - Add "Review" button with `Eye` icon in the header actions area
    - Ensure "Download PDF" button with `Download` icon exists in the header actions area
    - Render `<PdfPreviewModal>` with `url={/basts/${bast.id}/export-pdf}` and appropriate title
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7_

  - [ ]* 4.4 Write property test: PDF URL construction per document type
    - **Property 5: PDF URL construction per document type**
    - Generate random document types in `{invoice, bap, bast}` and random positive integer IDs
    - Assert URL passed to PdfPreviewModal equals `"/{documentType}s/{id}/export-pdf"`
    - **Validates: Requirements 2.3, 2.5, 2.6, 2.7**

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The design uses TypeScript/React — all implementation follows existing project patterns
- No backend changes are required; existing `/export-pdf` endpoints are consumed as-is
- shadcn/ui Dialog installation via CLI will auto-generate the component file

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4"] }
  ]
}
```
