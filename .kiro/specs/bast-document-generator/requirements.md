# Requirements Document

## Introduction

Fitur BAST (Berita Acara Serah Terima) Document Generator memungkinkan pembuatan dokumen BAST dari data BAP yang sudah disetujui. BAST merupakan dokumen formal serah terima penyelesaian pekerjaan yang berisi cover page, surat resmi dengan tabel uraian pekerjaan, dan halaman laporan pekerjaan. Dokumen BAST di-generate sebagai PDF 3 halaman menggunakan barryvdh/laravel-dompdf, dengan data pekerjaan diambil dari Service model yang terkait dengan work report dalam BAP. BAST memiliki full CRUD dengan model, migration, dan halaman tersendiri (index, create/generate, show).

## Glossary

- **BAST_System**: Modul Laravel yang mengelola pembuatan, penyimpanan, penampilan, dan penghapusan dokumen Berita Acara Serah Terima (BAST)
- **BAST_Record**: Entitas data yang merepresentasikan satu dokumen BAST, disimpan dalam tabel `basts` di database, terkait dengan satu BAP yang sudah approved
- **BAST_PDF_Generator**: Service yang menghasilkan dokumen PDF BAST dari data BAST_Record dan BAP terkait menggunakan barryvdh/laravel-dompdf
- **Cover_Page**: Halaman pertama PDF BAST yang menampilkan nama klien, logo klien, bulan/tahun, nama perusahaan, dan alamat perusahaan dengan desain dekoratif
- **Surat_BAST_Page**: Halaman kedua PDF BAST berupa surat formal "Berita Acara Penyelesaian Pekerjaan" dengan header perusahaan, nomor dokumen, tanggal, informasi pihak pertama dan kedua, paragraf deskripsi, tabel uraian pekerjaan, paragraf penutup, dan area tanda tangan
- **Laporan_Pekerjaan_Page**: Halaman ketiga PDF BAST yang menampilkan detail laporan pekerjaan dari work report terkait dalam BAP
- **Work_Items_Table**: Tabel uraian pekerjaan dalam Surat_BAST_Page dengan kolom No, Uraian Pekerjaan/Service Plan, Satuan, Jumlah, dan Keterangan, datanya berasal dari Service model
- **Pihak_Pertama**: Pihak klien dalam dokumen BAST, informasinya meliputi nama dan jabatan yang dapat diedit via form (Maintenance Manager dan Chief Engineering)
- **Pihak_Kedua**: Pihak perusahaan dalam dokumen BAST, informasinya meliputi nama dan jabatan yang di-auto-populate dari CompanySetting (Project Coordinator dan Operational Manager)
- **Document_Number**: Nomor dokumen BAST yang di-generate secara otomatis oleh sistem
- **CompanySetting**: Model key-value yang menyimpan konfigurasi perusahaan termasuk nama, logo, alamat, dan nama penandatangan

## Requirements

### Requirement 1: Model dan Penyimpanan Data BAST

**User Story:** As an admin, I want BAST records to be persisted in the database with a dedicated model, so that BAST documents can be managed independently from BAP records.

#### Acceptance Criteria

1. THE BAST_System SHALL store each BAST_Record in a dedicated `basts` database table with the following fields: id (auto-increment primary key), bap_id (foreign key to baps table, unique constraint), document_number (string, unique), tanggal (date), client_id (foreign key to clients table), pihak_pertama_1_nama (string, maximum 255 characters), pihak_pertama_1_jabatan (string, maximum 255 characters), pihak_pertama_2_nama (string, maximum 255 characters), pihak_pertama_2_jabatan (string, maximum 255 characters), pihak_kedua_1_nama (string, maximum 255 characters), pihak_kedua_1_jabatan (string, maximum 255 characters), pihak_kedua_2_nama (string, maximum 255 characters), pihak_kedua_2_jabatan (string, maximum 255 characters), and timestamps (created_at, updated_at)
2. THE BAST_System SHALL enforce a one-to-one relationship between a BAST_Record and a BAP, preventing creation of multiple BAST records for the same BAP
3. WHEN a BAST_Record is created, THE BAST_System SHALL associate the BAST_Record with the client referenced by the linked BAP record

### Requirement 2: Pembuatan BAST dari BAP Approved

**User Story:** As an admin, I want to generate a BAST document from an approved BAP, so that I can formally document the handover of completed work.

#### Acceptance Criteria

1. WHEN an admin navigates to the BAST creation page, THE BAST_System SHALL display a form pre-populated with data from the selected approved BAP including client name and associated work report services
2. THE BAST_System SHALL only allow BAST generation from BAP records that have a status of "approved"
3. IF an admin attempts to create a BAST from a BAP that is not approved, THEN THE BAST_System SHALL reject the request and display an error message stating that only approved BAP records can be used for BAST generation
4. IF an admin attempts to create a BAST from a BAP that already has an associated BAST_Record, THEN THE BAST_System SHALL reject the request and display an error message stating that a BAST already exists for the selected BAP
5. WHEN a BAST creation form is submitted, THE BAST_System SHALL validate that pihak_pertama_1_nama, pihak_pertama_1_jabatan, pihak_pertama_2_nama, and pihak_pertama_2_jabatan fields are filled with non-empty strings of maximum 255 characters each
6. WHEN a BAST creation form is submitted with valid data, THE BAST_System SHALL persist the BAST_Record to the database and redirect to the BAST detail page with a success message

### Requirement 3: Auto-Generate Nomor Dokumen BAST

**User Story:** As an admin, I want the BAST document number to be generated automatically, so that numbering is consistent and sequential.

#### Acceptance Criteria

1. WHEN a new BAST_Record is created, THE BAST_System SHALL generate a unique Document_Number following the format: BAST/XXXX/MM/YYYY where XXXX is a zero-padded sequential number, MM is the two-digit month, and YYYY is the four-digit year based on the BAST tanggal field
2. THE BAST_System SHALL increment the sequential number (XXXX) based on the count of existing BAST records within the same year, starting from 0001 each new calendar year
3. THE BAST_System SHALL enforce uniqueness of the Document_Number at the database level to prevent duplicate numbers

### Requirement 4: Penandatangan BAST

**User Story:** As an admin, I want company-side signatories to be auto-populated from settings and client-side signatories to be editable, so that the form is efficient while allowing flexibility for client representatives.

#### Acceptance Criteria

1. WHEN the BAST creation form is loaded, THE BAST_System SHALL auto-populate pihak_kedua_1_nama from the CompanySetting key "project_coordinator_name" and pihak_kedua_1_jabatan with the value "Project Coordinator"
2. WHEN the BAST creation form is loaded, THE BAST_System SHALL auto-populate pihak_kedua_2_nama from the CompanySetting key "operational_manager_name" and pihak_kedua_2_jabatan with the value "Operational Manager"
3. THE BAST_System SHALL render pihak_pertama_1_nama and pihak_pertama_1_jabatan as editable text input fields with pihak_pertama_1_jabatan pre-filled with "Maintenance Manager"
4. THE BAST_System SHALL render pihak_pertama_2_nama and pihak_pertama_2_jabatan as editable text input fields with pihak_pertama_2_jabatan pre-filled with "Chief Engineering"
5. THE BAST_System SHALL allow the admin to modify all pihak_kedua fields before submission, overriding the auto-populated values from CompanySetting

### Requirement 5: Work Items Table dari Service Model

**User Story:** As an admin, I want the work items table to be derived from services associated with work reports in the BAP, so that the BAST accurately reflects the completed work scope.

#### Acceptance Criteria

1. WHEN a BAST is generated from a BAP, THE BAST_System SHALL derive the Work_Items_Table data from Service records associated with work reports referenced by the BAP
2. THE Work_Items_Table SHALL display the following columns: No (sequential row number starting from 1), Uraian Pekerjaan (service name from Service model), Satuan (unit field from Service model), Jumlah (count of work reports utilizing the service), and Keterangan (empty text, editable in the form)
3. THE BAST_System SHALL aggregate services across all work reports in the BAP, grouping identical services into a single row with Jumlah representing the total count
4. IF a BAP has no associated work reports with linked services, THEN THE BAST_System SHALL display the Work_Items_Table with an empty body and a message indicating no work items are available

### Requirement 6: Halaman Index BAST

**User Story:** As an admin, I want to see a list of all BAST records with filtering options, so that I can easily find and manage BAST documents.

#### Acceptance Criteria

1. THE BAST_System SHALL display a paginated list of BAST_Records on the index page showing: document number, client name, tanggal (formatted as Indonesian date), and associated BAP nomor surat
2. THE BAST_System SHALL support filtering the BAST list by client using a dropdown selector
3. THE BAST_System SHALL display BAST_Records ordered by creation date descending (newest first) with 10 records per page
4. THE BAST_System SHALL provide navigation links from the index page to the BAST detail page and the BAST creation page

### Requirement 7: Halaman Detail BAST

**User Story:** As an admin, I want to view all BAST details on a dedicated show page, so that I can review the document content before exporting to PDF.

#### Acceptance Criteria

1. WHEN an admin navigates to the BAST detail page, THE BAST_System SHALL display the BAST document number, tanggal, client name, Pihak_Pertama information (names and positions), Pihak_Kedua information (names and positions), and the Work_Items_Table
2. THE BAST_System SHALL provide a button to export the BAST as a PDF document from the detail page
3. THE BAST_System SHALL provide a button to delete the BAST_Record from the detail page

### Requirement 8: Penghapusan BAST

**User Story:** As an admin, I want to delete a BAST record, so that I can remove incorrectly generated documents.

#### Acceptance Criteria

1. WHEN an admin requests deletion of a BAST_Record, THE BAST_System SHALL remove the BAST_Record from the database and redirect to the BAST index page with a success message
2. WHEN a BAST_Record is deleted, THE BAST_System SHALL not modify or delete the associated BAP record, preserving the BAP in its current state

### Requirement 9: PDF Generation - Cover Page

**User Story:** As an admin, I want the BAST PDF to include a decorative cover page, so that the document has a professional appearance for client delivery.

#### Acceptance Criteria

1. THE BAST_PDF_Generator SHALL render the Cover_Page as the first page of the PDF document in A4 portrait orientation
2. THE Cover_Page SHALL display the client name, client logo (from the clients table logo field), the month and year of the BAST tanggal in Indonesian format (e.g., "Januari 2025"), the company name (from CompanySetting key "company_name"), and the company address (from CompanySetting key "company_address")
3. IF the client does not have a logo stored, THEN THE BAST_PDF_Generator SHALL render the Cover_Page without a logo placeholder, displaying only text elements
4. THE Cover_Page SHALL include decorative design elements surrounding the content to create a professional document appearance

### Requirement 10: PDF Generation - Surat BAST Page

**User Story:** As an admin, I want the BAST PDF to include a formal letter page with company header, document details, parties information, work items table, and signature areas, so that the document meets formal Indonesian business document standards.

#### Acceptance Criteria

1. THE BAST_PDF_Generator SHALL render the Surat_BAST_Page as the second page of the PDF document in A4 portrait orientation
2. THE Surat_BAST_Page SHALL include a company header section displaying the company logo (from CompanySetting key "company_logo"), company name (from CompanySetting key "company_name"), and company address (from CompanySetting keys "company_address" and "company_address_2")
3. THE Surat_BAST_Page SHALL display the Document_Number and the BAST tanggal formatted in formal Indonesian date format (e.g., "Jakarta, 15 Januari 2025")
4. THE Surat_BAST_Page SHALL display Pihak_Pertama information with the label "PIHAK PERTAMA" showing the client name and address from the associated client record
5. THE Surat_BAST_Page SHALL display Pihak_Kedua information with the label "PIHAK KEDUA" showing the company name and address from CompanySetting
6. THE Surat_BAST_Page SHALL include a description paragraph stating the scope of work completion
7. THE Surat_BAST_Page SHALL render the Work_Items_Table with columns: No, Uraian Pekerjaan/Service Plan, Satuan, Jumlah, and Keterangan
8. THE Surat_BAST_Page SHALL include a closing paragraph and four signature spots arranged in two rows: row one for Pihak Pertama (pihak_pertama_1 and pihak_pertama_2) and row two for Pihak Kedua (pihak_kedua_1 and pihak_kedua_2), each showing name and position
9. WHEN the Work_Items_Table contains more rows than fit on a single page, THE BAST_PDF_Generator SHALL allow the table content to flow to subsequent pages while maintaining the table header on each continuation page

### Requirement 11: PDF Generation - Laporan Pekerjaan Page

**User Story:** As an admin, I want the BAST PDF to include a work report details page, so that the client receives comprehensive documentation of the work performed.

#### Acceptance Criteria

1. THE BAST_PDF_Generator SHALL render the Laporan_Pekerjaan_Page as the third section of the PDF document, starting on a new page after the Surat_BAST_Page content
2. THE Laporan_Pekerjaan_Page SHALL display work report details from all work reports associated with the BAP linked to the BAST_Record
3. THE Laporan_Pekerjaan_Page SHALL include for each work report: the work date, job category name, description, area, technician name, and photo documentation (before and after photos)
4. WHEN the BAP contains multiple work reports, THE BAST_PDF_Generator SHALL render each work report as a distinct section with clear visual separation

### Requirement 12: PDF Export dan Download

**User Story:** As an admin, I want to export and download the BAST as a PDF file, so that I can deliver the document to the client.

#### Acceptance Criteria

1. WHEN an admin clicks the export PDF button on the BAST detail page, THE BAST_PDF_Generator SHALL generate a PDF file combining Cover_Page, Surat_BAST_Page, and Laporan_Pekerjaan_Page into a single document
2. THE BAST_PDF_Generator SHALL set the PDF paper size to A4 portrait orientation
3. THE BAST_PDF_Generator SHALL trigger a browser download with a filename following the pattern: BAST_{document_number_with_dashes}.pdf where forward slashes in the document number are replaced with dashes
4. THE BAST_PDF_Generator SHALL render the PDF using Blade templates processed by barryvdh/laravel-dompdf

### Requirement 13: Arsitektur Service Layer

**User Story:** As a developer, I want the BAST feature to follow existing architectural patterns, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. THE BAST_System SHALL implement a BastNumberGeneratorInterface and BastNumberGenerator class following the same interface+implementation pattern used by BapNumberGeneratorInterface and BapNumberGenerator
2. THE BAST_System SHALL register all service interface-to-implementation bindings in AppServiceProvider following the existing registration pattern
3. THE BAST_System SHALL inject service dependencies into BastController via constructor injection, consistent with BapController and InvoiceController patterns
4. THE BAST_PDF_Generator SHALL extend the existing PdfExportServiceInterface with a generateBastPdf method, or implement a dedicated BastPdfServiceInterface following the same pattern
