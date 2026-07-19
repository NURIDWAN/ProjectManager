# Requirements Document

## Introduction

This feature adds edit and delete functionality to the BAP (Berita Acara Pekerjaan), BAST (Berita Acara Serah Terima), and Invoice modules. Users will be able to edit and delete any document regardless of its status. The list/index pages for each module will display edit (pencil) and delete (trash) icon buttons in the action column alongside the existing view (eye) button. A confirmation dialog will appear before any delete action is executed.

## Glossary

- **System**: The Laravel + Inertia.js + React management application
- **BAP_Module**: The Berita Acara Pekerjaan module handling BAP document CRUD operations
- **BAST_Module**: The Berita Acara Serah Terima module handling BAST document CRUD operations
- **Invoice_Module**: The Invoice module handling invoice document CRUD operations
- **Index_Page**: The list/table view page for each module displaying all documents
- **Action_Column**: The table column containing action icon buttons (view, edit, delete)
- **Edit_Page**: The form page allowing modification of an existing document
- **Delete_Confirmation_Dialog**: A modal dialog requiring user confirmation before deleting a document
- **Admin**: An authenticated user with the admin role

## Requirements

### Requirement 1: BAP Edit Functionality

**User Story:** As an Admin, I want to edit any BAP document regardless of its status, so that I can correct or update BAP data at any time.

#### Acceptance Criteria

1. WHEN the Admin navigates to the BAP Edit_Page, THE BAP_Module SHALL display a pre-filled form with the current BAP data including client, tanggal, and work report selections.
2. WHEN the Admin submits valid changes on the BAP Edit_Page, THE BAP_Module SHALL update the BAP record and redirect to the BAP detail page with a success message.
3. THE BAP_Module SHALL allow editing of BAP documents regardless of their current status (draft or approved).
4. IF the Admin submits invalid data on the BAP Edit_Page, THEN THE BAP_Module SHALL display validation errors without saving changes.

### Requirement 2: BAP Delete Functionality

**User Story:** As an Admin, I want to delete any BAP document regardless of its status, so that I can remove incorrect or unnecessary BAP records.

#### Acceptance Criteria

1. WHEN the Admin confirms deletion in the Delete_Confirmation_Dialog for a BAP, THE BAP_Module SHALL permanently remove the BAP record and redirect to the BAP Index_Page with a success message.
2. THE BAP_Module SHALL allow deletion of BAP documents regardless of their current status (draft or approved).

### Requirement 3: BAST Edit Functionality

**User Story:** As an Admin, I want to edit any BAST document, so that I can correct or update BAST data after creation.

#### Acceptance Criteria

1. WHEN the Admin navigates to the BAST Edit_Page, THE BAST_Module SHALL display a pre-filled form with the current BAST data including linked BAP, tanggal, and work items.
2. WHEN the Admin submits valid changes on the BAST Edit_Page, THE BAST_Module SHALL update the BAST record and redirect to the BAST detail page with a success message.
3. IF the Admin submits invalid data on the BAST Edit_Page, THEN THE BAST_Module SHALL display validation errors without saving changes.

### Requirement 4: BAST Delete Functionality

**User Story:** As an Admin, I want to delete any BAST document, so that I can remove incorrect or unnecessary BAST records.

#### Acceptance Criteria

1. WHEN the Admin confirms deletion in the Delete_Confirmation_Dialog for a BAST, THE BAST_Module SHALL permanently remove the BAST record and redirect to the BAST Index_Page with a success message.

### Requirement 5: Invoice Edit Functionality

**User Story:** As an Admin, I want to edit any Invoice document regardless of its status, so that I can correct or update invoice data at any time.

#### Acceptance Criteria

1. WHEN the Admin navigates to the Invoice Edit_Page, THE Invoice_Module SHALL display a pre-filled form with the current invoice data including client, items, discount, tax, shipping cost, due date, notes, and terms.
2. WHEN the Admin submits valid changes on the Invoice Edit_Page, THE Invoice_Module SHALL recalculate subtotal, PPN, and grand total based on updated items and save the updated record.
3. WHEN the Admin submits valid changes on the Invoice Edit_Page, THE Invoice_Module SHALL redirect to the Invoice detail page with a success message.
4. THE Invoice_Module SHALL allow editing of Invoice documents regardless of their current status (draft, unpaid, overdue, or paid).
5. IF the Admin submits invalid data on the Invoice Edit_Page, THEN THE Invoice_Module SHALL display validation errors without saving changes.

### Requirement 6: Invoice Delete Functionality

**User Story:** As an Admin, I want to delete any Invoice document regardless of its status, so that I can remove incorrect or unnecessary invoice records.

#### Acceptance Criteria

1. WHEN the Admin confirms deletion in the Delete_Confirmation_Dialog for an Invoice, THE Invoice_Module SHALL permanently remove the Invoice record and its associated invoice items, then redirect to the Invoice Index_Page with a success message.
2. THE Invoice_Module SHALL allow deletion of Invoice documents regardless of their current status (draft, unpaid, overdue, or paid).

### Requirement 7: Action Column Buttons on Index Pages

**User Story:** As an Admin, I want to see edit and delete action buttons on each document row in the list pages, so that I can quickly access edit and delete actions.

#### Acceptance Criteria

1. THE System SHALL display an edit icon button (pencil icon) in the Action_Column of each row on the BAP Index_Page, BAST Index_Page, and Invoice Index_Page.
2. THE System SHALL display a delete icon button (trash icon) in the Action_Column of each row on the BAP Index_Page, BAST Index_Page, and Invoice Index_Page.
3. WHEN the Admin clicks the edit icon button on a row, THE System SHALL navigate to the corresponding Edit_Page for that document.
4. WHEN the Admin clicks the delete icon button on a row, THE System SHALL display the Delete_Confirmation_Dialog for that document.
5. THE System SHALL display the action buttons in the following order within the Action_Column: view (eye), edit (pencil), delete (trash).

### Requirement 8: Delete Confirmation Dialog

**User Story:** As an Admin, I want to see a confirmation dialog before deleting a document, so that I can avoid accidental deletions.

#### Acceptance Criteria

1. WHEN the Admin clicks a delete icon button, THE System SHALL display a Delete_Confirmation_Dialog with a warning message and the document identifier.
2. THE Delete_Confirmation_Dialog SHALL provide a confirm button and a cancel button.
3. WHEN the Admin clicks the cancel button in the Delete_Confirmation_Dialog, THE System SHALL close the dialog without performing any deletion.
4. WHEN the Admin clicks the confirm button in the Delete_Confirmation_Dialog, THE System SHALL send a delete request to the server for the corresponding document.

### Requirement 9: Backend Route Registration

**User Story:** As an Admin, I want the edit and delete routes to be properly registered, so that the application can handle edit and delete requests for all three modules.

#### Acceptance Criteria

1. THE System SHALL register edit and update routes for the BAST_Module under the admin role middleware.
2. THE System SHALL register edit, update, and destroy routes for the Invoice_Module under the admin role middleware.
3. THE BAP_Module SHALL process edit and delete requests without status-based restrictions.
