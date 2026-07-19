# Requirements Document

## Introduction

Sistem preset/template laporan kerja untuk kategori pekerjaan AC (Air Conditioning). Fitur ini memungkinkan setiap kategori pekerjaan memiliki template form input yang berbeda, sehingga data teknis spesifik per kategori dapat dicatat secara terstruktur. Untuk kategori AC, form work report akan menangkap data pengukuran teknis (suhu, ampere, tekanan freon) serta detail unit AC (tipe, merek, kapasitas). Output PDF BAP untuk kategori AC akan menyertakan tabel rekap data pekerjaan maintenance AC selain dokumentasi visual foto yang sudah ada.

## Glossary

- **Work_Report_Preset**: Template konfigurasi form input tambahan yang terkait dengan JobCategory tertentu, menentukan field-field spesifik yang harus diisi teknisi
- **AC_Measurement**: Data pengukuran teknis unit AC yang mencakup suhu (R/S/T), ampere (R/S/T), dan tekanan freon, masing-masing sebelum dan sesudah pekerjaan
- **Work_Report_System**: Modul Laravel yang mengelola pembuatan, penyimpanan, dan penampilan laporan kerja beserta data preset spesifik kategori
- **BAP_PDF_Generator**: Service yang menghasilkan dokumen PDF Berita Acara Pekerjaan dari data BAP dan work report terkait
- **Preset_Engine**: Komponen yang menentukan dan merender form tambahan berdasarkan kategori pekerjaan yang dipilih pada work report
- **AC_Recap_Table**: Tabel rekap data pekerjaan maintenance AC dalam PDF yang menampilkan kolom lokasi, tipe AC, merek, kapasitas, suhu before/after, ampere before/after, tekanan freon before/after, dan keterangan
- **Teknisi**: User dengan role technician yang mengisi laporan kerja di lapangan

## Requirements

### Requirement 1: Konfigurasi Preset per Kategori Pekerjaan

**User Story:** As an admin, I want to associate preset templates with job categories, so that each category has its own specific form fields for work reports.

#### Acceptance Criteria

1. THE Work_Report_System SHALL store a nullable preset configuration identifier (string, maximum 100 characters) for each JobCategory record, where a null value indicates no preset is assigned
2. WHEN a JobCategory has a preset configuration identifier, THE Preset_Engine SHALL load and render the corresponding additional form fields for work report creation and editing within 2 seconds of category selection
3. WHEN a JobCategory does not have a preset configuration, THE Work_Report_System SHALL display only the default work report form fields (client, category, description, area, before/after photos) without additional preset fields
4. THE Work_Report_System SHALL store preset-specific data as a JSON object (maximum 65,535 characters) in a dedicated column on the work_reports table, validated against the field definitions of the associated preset before persistence
5. IF a JobCategory references a preset configuration identifier that cannot be resolved, THEN THE Work_Report_System SHALL display only the default work report form fields and indicate an error message stating the preset is unavailable
6. WHEN a JobCategory preset configuration is changed, THE Work_Report_System SHALL retain existing preset-specific JSON data on previously created work reports without modification

### Requirement 2: Form Input AC Measurement

**User Story:** As a teknisi, I want to input AC-specific measurement data (suhu, ampere, tekanan freon) when filling a work report for the AC category, so that technical data is recorded accurately.

#### Acceptance Criteria

1. WHEN a teknisi selects a job category flagged as AC-type from the category dropdown, THE Preset_Engine SHALL render additional form fields for AC measurement data within 1 second of selection
2. THE Work_Report_System SHALL capture the following AC unit identification fields per entry: lokasi unit (text, maximum 255 characters), tipe AC (selection from: Splitduct, Cassette, Splitwall), merek AC (selection from: Panasonic, Gree, Daikin, or custom text input with maximum 100 characters), and kapasitas in PK (numeric value between 0.5 and 30)
3. THE Work_Report_System SHALL capture suhu readings in degrees Celsius with three phases (R, S, T) for both before and after conditions, each accepting a numeric value between -10 and 100
4. THE Work_Report_System SHALL capture ampere readings with three phases (R, S, T) for both before and after conditions, each accepting a numeric value between 0 and 200
5. THE Work_Report_System SHALL capture tekanan freon readings in PSI for both before and after conditions, each accepting a numeric value between 0 and 800
6. THE Work_Report_System SHALL allow the teknisi to input a keterangan (remarks) field per AC unit entry, with a maximum length of 1000 characters
7. WHEN the teknisi submits the work report, THE Work_Report_System SHALL validate that all suhu, ampere, and tekanan freon fields contain numeric values within their specified ranges, and that lokasi unit, tipe AC, merek AC, and kapasitas are filled
8. IF any mandatory AC measurement field fails validation, THEN THE Work_Report_System SHALL display an inline error message indicating which field is invalid and prevent form submission while preserving all entered data
9. THE Work_Report_System SHALL allow a minimum of 1 and a maximum of 50 AC unit entries per single work report to support locations with multiple AC units
10. WHEN a teknisi deselects or changes the job category away from AC-type, THE Preset_Engine SHALL hide the AC measurement fields and prompt the teknisi to confirm if previously entered AC data should be discarded

### Requirement 3: Penyimpanan Data AC Measurement

**User Story:** As a system, I want to persist AC measurement data in a structured format, so that the data can be retrieved and rendered in PDF outputs accurately.

#### Acceptance Criteria

1. WHEN a work report with AC preset data is saved, THE Work_Report_System SHALL store the AC measurement entries as a JSON array in the preset_data column, supporting a maximum of 50 entries per work report
2. THE Work_Report_System SHALL store each AC measurement entry with the following fields and data types: lokasi (string, max 255 characters), tipe_ac (string, one of: Splitduct, Cassette, Splitwall), merek (string, max 100 characters), kapasitas (numeric, in PK), suhu_before_r (numeric), suhu_before_s (numeric), suhu_before_t (numeric), suhu_after_r (numeric), suhu_after_s (numeric), suhu_after_t (numeric), ampere_before_r (numeric), ampere_before_s (numeric), ampere_before_t (numeric), ampere_after_r (numeric), ampere_after_s (numeric), ampere_after_t (numeric), freon_before (numeric), freon_after (numeric), keterangan (string, max 500 characters, nullable)
3. WHEN a work report with AC preset data is loaded for editing, THE Work_Report_System SHALL populate the AC measurement form fields with the exact values previously saved, preserving all numeric precision and string content without modification
4. IF the preset_data column contains malformed JSON, THEN THE Work_Report_System SHALL display the AC measurement form as empty with no entries, log a warning message indicating the work report ID and the parsing failure, and allow the user to input new data
5. IF an AC measurement entry contains a nullable field (keterangan) with no value, THEN THE Work_Report_System SHALL store that field as null in the JSON structure and render it as an empty field when loaded for editing

### Requirement 4: PDF BAP Output dengan Rekap AC

**User Story:** As an admin, I want the BAP PDF for AC category work reports to include a recap table of AC maintenance data, so that clients receive comprehensive technical documentation.

#### Acceptance Criteria

1. WHEN a BAP contains work reports from the AC category, THE BAP_PDF_Generator SHALL include an AC_Recap_Table section in the PDF output, placed before the visual documentation photos section
2. THE AC_Recap_Table SHALL display columns: NO, TANGGAL, LOKASI, TYPE AC, MEREK, Kapasitas, SUHU BEFORE (R/S/T), SUHU AFTER (R/S/T), AMPERE BEFORE (R/S/T), AMPERE AFTER (R/S/T), TEKANAN FREON BEFORE, TEKANAN FREON AFTER, KETERANGAN
3. THE BAP_PDF_Generator SHALL render the AC_Recap_Table with a title "REKAP DATA PEKERJAAN MAINTENANCE AC" followed by the client/site name
4. WHEN a BAP contains mixed category work reports, THE BAP_PDF_Generator SHALL render the AC_Recap_Table only for work reports belonging to the AC category
5. THE BAP_PDF_Generator SHALL continue to render the existing visual documentation photos section alongside the AC_Recap_Table
6. THE AC_Recap_Table SHALL aggregate all AC unit entries across all AC-category work reports included in the BAP into a single consolidated table, ordered by work report date ascending then by entry order within each report, with sequential row numbering starting from 1
7. IF an AC-category work report within the BAP has null or empty preset_data, THEN THE BAP_PDF_Generator SHALL exclude that work report from the AC_Recap_Table without displaying an error
8. THE TANGGAL column in the AC_Recap_Table SHALL display the date of the work report (work_date field) in DD/MM/YYYY format

### Requirement 5: Tampilan Data AC di Halaman Detail Work Report

**User Story:** As an admin or teknisi, I want to view AC measurement data on the work report detail page, so that I can review the recorded technical data without downloading the PDF.

#### Acceptance Criteria

1. WHEN a work report with AC preset data is viewed, THE Work_Report_System SHALL display the AC measurement data in a table with columns: NO, LOKASI, TYPE AC, MEREK, KAPASITAS, SUHU BEFORE (R/S/T), SUHU AFTER (R/S/T), AMPERE BEFORE (R/S/T), AMPERE AFTER (R/S/T), TEKANAN FREON BEFORE, TEKANAN FREON AFTER, KETERANGAN on the detail page
2. THE Work_Report_System SHALL display each AC unit entry from the preset_data JSON array as a separate row in the table, with suhu and ampere values showing individual R, S, T phase values and before/after columns distinguished by column headers labeled "BEFORE" and "AFTER"
3. WHEN a work report does not have AC preset data, THE Work_Report_System SHALL not display the AC measurement table section
4. WHEN a work report has AC preset data containing multiple AC unit entries, THE Work_Report_System SHALL render all entries in a single table with sequential row numbering starting from 1

### Requirement 6: Tampilan Data AC di Halaman Detail BAP

**User Story:** As an admin, I want to see the AC recap table on the BAP detail page in the web application, so that I can preview the recap data before exporting to PDF.

#### Acceptance Criteria

1. WHEN a BAP contains at least one AC-category work report where the preset_data column holds a valid JSON array with one or more AC measurement entries, THE Work_Report_System SHALL display the AC_Recap_Table on the BAP detail page with the title "REKAP DATA PEKERJAAN MAINTENANCE AC"
2. THE AC_Recap_Table SHALL display columns: NO, TANGGAL, LOKASI, TYPE AC, MEREK, Kapasitas, SUHU BEFORE (R/S/T), SUHU AFTER (R/S/T), AMPERE BEFORE (R/S/T), AMPERE AFTER (R/S/T), TEKANAN FREON BEFORE, TEKANAN FREON AFTER, KETERANGAN
3. THE AC_Recap_Table SHALL aggregate all AC unit entries from all AC-category work reports included in the BAP into a single consolidated table, ordered by work report date ascending then by entry order within each report
4. IF an AC-category work report within the BAP has null or empty preset_data, THEN THE Work_Report_System SHALL exclude that work report from the AC_Recap_Table without displaying an error
5. WHEN a BAP does not contain any AC-category work reports, THE Work_Report_System SHALL not display the AC_Recap_Table section on the BAP detail page
