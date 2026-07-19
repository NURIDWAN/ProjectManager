# Requirements Document

## Introduction

This feature adds an in-app PDF preview capability via a modal dialog to the Invoice Show, BAP Show, and BAST Show pages. Instead of only opening PDFs in a new browser tab, users will have a "Review" button that opens a modal with an embedded PDF viewer (using react-pdf), page navigation controls, and zoom functionality. The existing "Download/Export PDF" button remains available for direct download. A single reusable `PdfPreviewModal` component is shared across all three document types.

## Glossary

- **PdfPreviewModal**: A reusable React component that renders a modal dialog containing an embedded PDF viewer with navigation and zoom controls
- **Document_Show_Page**: Any of the three detail pages: Invoice Show (`/invoices/{id}`), BAP Show (`/baps/{id}`), or BAST Show (`/basts/{id}`)
- **PDF_Endpoint**: The existing backend route that generates and returns a PDF response — `/invoices/{id}/export-pdf`, `/baps/{id}/export-pdf`, or `/basts/{id}/export-pdf`
- **Page_Navigation**: Controls that allow the user to move between pages of a multi-page PDF document (previous, next, and page number indicator)
- **Zoom_Controls**: Controls that allow the user to increase or decrease the rendered scale of the PDF document

## Requirements

### Requirement 1: Reusable PDF Preview Modal Component

**User Story:** As a user, I want to preview a PDF document inside a modal without leaving the current page, so that I can quickly review the document content without navigating away.

#### Acceptance Criteria

1. THE PdfPreviewModal SHALL accept a PDF URL string and an open/close state as props
2. WHEN the PdfPreviewModal is opened, THE PdfPreviewModal SHALL fetch and render the PDF from the provided URL using the react-pdf library
3. THE PdfPreviewModal SHALL display the current page number and total page count in the format "Page X of Y"
4. WHEN the PDF has more than one page, THE PdfPreviewModal SHALL display Page_Navigation controls (previous page button, next page button)
5. WHEN the user clicks the next page button, THE PdfPreviewModal SHALL display the subsequent page of the PDF
6. WHEN the user clicks the previous page button, THE PdfPreviewModal SHALL display the preceding page of the PDF
7. WHILE the current page is the first page, THE PdfPreviewModal SHALL disable the previous page button
8. WHILE the current page is the last page, THE PdfPreviewModal SHALL disable the next page button
9. THE PdfPreviewModal SHALL display Zoom_Controls with zoom-in, zoom-out, and a reset-to-default option
10. WHEN the user clicks zoom-in, THE PdfPreviewModal SHALL increase the PDF render scale by 25 percent from the current scale
11. WHEN the user clicks zoom-out, THE PdfPreviewModal SHALL decrease the PDF render scale by 25 percent from the current scale
12. THE PdfPreviewModal SHALL constrain the zoom level between a minimum of 50 percent and a maximum of 200 percent of the default scale
13. WHEN the user clicks the close button or presses the Escape key, THE PdfPreviewModal SHALL close the modal and reset internal state (page number and zoom level)
14. THE PdfPreviewModal SHALL use the shadcn/ui Dialog component for the modal container

### Requirement 2: Review and Download Action Buttons

**User Story:** As a user, I want separate Review and Download buttons on each document detail page, so that I can choose to either preview the PDF in-app or download it directly.

#### Acceptance Criteria

1. THE Document_Show_Page SHALL display a "Review" button in the header action area
2. THE Document_Show_Page SHALL display a "Download PDF" button in the header action area
3. WHEN the user clicks the "Review" button, THE Document_Show_Page SHALL open the PdfPreviewModal with the corresponding PDF_Endpoint URL
4. WHEN the user clicks the "Download PDF" button, THE Document_Show_Page SHALL trigger a direct file download of the PDF from the corresponding PDF_Endpoint
5. THE Invoice Show page SHALL pass the URL `/invoices/{id}/export-pdf` to the PdfPreviewModal
6. THE BAP Show page SHALL pass the URL `/baps/{id}/export-pdf` to the PdfPreviewModal
7. THE BAST Show page SHALL pass the URL `/basts/{id}/export-pdf` to the PdfPreviewModal

### Requirement 3: Loading and Error States

**User Story:** As a user, I want clear feedback when the PDF is loading or fails to load, so that I understand the current state of the preview.

#### Acceptance Criteria

1. WHILE the PDF document is being fetched and rendered, THE PdfPreviewModal SHALL display a loading skeleton or spinner indicator
2. WHILE the PDF is loading, THE PdfPreviewModal SHALL disable the Page_Navigation and Zoom_Controls
3. IF the PDF fails to load due to a network error or server error, THEN THE PdfPreviewModal SHALL display an error message describing the failure
4. IF the PDF fails to load, THEN THE PdfPreviewModal SHALL display a "Retry" button that re-attempts fetching the PDF from the same URL
5. IF the PDF fails to load, THEN THE PdfPreviewModal SHALL hide the Page_Navigation and Zoom_Controls

### Requirement 4: Backend PDF Endpoint Compatibility

**User Story:** As a developer, I want the existing export-pdf endpoints to serve the PdfPreviewModal without modification, so that no backend changes are required.

#### Acceptance Criteria

1. THE PDF_Endpoint SHALL return a response with Content-Type header set to `application/pdf`
2. THE PDF_Endpoint SHALL support being fetched via an XMLHttpRequest or Fetch API call from the same origin (no CORS issues for same-origin requests)
3. THE PdfPreviewModal SHALL fetch the PDF using a standard HTTP GET request to the PDF_Endpoint
4. WHEN the backend returns a non-200 HTTP status code, THE PdfPreviewModal SHALL treat the response as an error and display the error state

### Requirement 5: Responsive Modal Design

**User Story:** As a user, I want the PDF preview modal to be usable on various screen sizes, so that I can review documents on both desktop and tablet devices.

#### Acceptance Criteria

1. THE PdfPreviewModal SHALL occupy a maximum width of 900px and a maximum height of 90vh on desktop viewports
2. WHILE the viewport width is less than 768px, THE PdfPreviewModal SHALL occupy the full width of the screen with 16px horizontal padding
3. THE PdfPreviewModal SHALL render the PDF content within a scrollable container so that the user can scroll through large pages without the modal exceeding viewport bounds
4. THE PdfPreviewModal SHALL position the Page_Navigation and Zoom_Controls in a fixed toolbar area that remains visible while the user scrolls through the PDF content
5. THE PdfPreviewModal SHALL use the shadcn/ui Dialog overlay to dim the background content when open
