# Implementation Plan: AC Work Report Preset

## Overview

Implement a preset/template system for work reports tied to the AC maintenance job category. This includes database migrations, backend services (PresetRegistry, AcMeasurementValidator, AcRecapAggregator), controller modifications, React form/table components, and a PDF Blade template for the AC recap table.

## Tasks

- [x] 1. Database migrations and model updates
  - [x] 1.1 Create migration to add `preset_identifier` column to `job_categories` table
    - Add nullable string column `preset_identifier` (max 100) after `description`
    - _Requirements: 1.1_

  - [x] 1.2 Create migration to add `preset_data` JSON column to `work_reports` table
    - Add nullable JSON column `preset_data` after `area`
    - _Requirements: 1.4, 3.1_

  - [x] 1.3 Update JobCategory model to include `preset_identifier` in `$fillable`
    - Add `preset_identifier` to the `$fillable` array
    - _Requirements: 1.1_

  - [x] 1.4 Update WorkReport model to include `preset_data` in `$fillable` and `$casts`
    - Add `preset_data` to `$fillable` array
    - Add `'preset_data' => 'array'` to `casts()` method
    - _Requirements: 1.4, 3.1, 3.2_

- [x] 2. Implement PresetRegistry service
  - [x] 2.1 Create `PresetRegistryInterface` and `PresetRegistry` implementation
    - Create `app/Services/PresetRegistryInterface.php` with `has()`, `get()`, `all()` methods
    - Create `app/Services/PresetRegistry.php` implementing the interface
    - Define the `ac_maintenance` preset configuration with all field definitions (lokasi, tipe_ac, merek, kapasitas, suhu R/S/T before/after, ampere R/S/T before/after, freon before/after, keterangan)
    - Register the binding in `AppServiceProvider`
    - _Requirements: 1.2, 1.5, 2.1_

- [x] 3. Implement AcMeasurementValidator service
  - [x] 3.1 Create `AcMeasurementValidatorInterface` and `AcMeasurementValidator` implementation
    - Create `app/Services/AcMeasurementValidatorInterface.php` with `validate(array $entries): array`
    - Create `app/Services/AcMeasurementValidator.php` implementing validation rules:
      - lokasi: required, string, max 255
      - tipe_ac: required, in:Splitduct,Cassette,Splitwall
      - merek: required, string, max 100
      - kapasitas: required, numeric, between 0.5 and 30
      - suhu fields (6): required, numeric, between -10 and 100
      - ampere fields (6): required, numeric, between 0 and 200
      - freon fields (2): required, numeric, between 0 and 800
      - keterangan: nullable, string, max 1000
    - Validate entry count: min 1, max 50
    - Register binding in `AppServiceProvider`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.2_

- [x] 4. Implement AcRecapAggregator service
  - [x] 4.1 Create `AcRecapAggregatorInterface` and `AcRecapAggregator` implementation
    - Create `app/Services/AcRecapAggregatorInterface.php` with `aggregate(Collection $workReports): array`
    - Create `app/Services/AcRecapAggregator.php`:
      - Filter work reports to only those with AC preset category (`preset_identifier = 'ac_maintenance'`)
      - Exclude reports with null/empty/malformed `preset_data`
      - Order by work report date ascending, then entry order within report
      - Return flat array of rows with sequential numbering and all columns (no, tanggal, lokasi, tipe_ac, merek, kapasitas, suhu before/after R/S/T, ampere before/after R/S/T, freon before/after, keterangan)
    - Register binding in `AppServiceProvider`
    - _Requirements: 4.4, 4.6, 4.7, 6.3, 6.4_

- [x] 5. Checkpoint - Backend services complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Modify WorkReportController
  - [x] 6.1 Update `create()` and `edit()` methods to pass preset data to frontend
    - In `create()`: pass categories with `preset_identifier` field included
    - In `edit()`: pass `preset_data` from work report and categories with `preset_identifier`
    - Use `PresetRegistry` to resolve whether category has a valid preset
    - _Requirements: 1.2, 1.3, 1.5, 3.3_

  - [x] 6.2 Update `store()` and `update()` methods to handle preset_data persistence
    - Accept `preset_data` from request
    - When category has `ac_maintenance` preset: validate entries using `AcMeasurementValidator`
    - Persist validated `preset_data` to the work report
    - When category does NOT have a preset: store null for `preset_data`
    - _Requirements: 1.4, 2.7, 2.8, 3.1, 3.2_

  - [x] 6.3 Update `show()` method to include preset_data in response
    - Load category with `preset_identifier`
    - Include `preset_data` in the response data passed to frontend
    - _Requirements: 5.1, 5.3_

- [x] 7. Modify BapController
  - [x] 7.1 Update `show()` method to pass aggregated AC recap data
    - Inject `AcRecapAggregatorInterface` into controller
    - Call `aggregate()` with the BAP's work reports collection
    - Pass `acRecapRows` to the Inertia response
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 7.2 Update `exportPdf()` method to include AC recap data for PDF generation
    - Use `AcRecapAggregator` to get aggregated rows
    - Pass AC recap data to the PDF export service
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7_

- [x] 8. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create AcMeasurementForm React component
  - [x] 9.1 Implement `AcMeasurementForm` component
    - Create `resources/js/Components/AcMeasurementForm.tsx`
    - Implement dynamic entry list (add/remove AC unit entries)
    - Render fields per entry: lokasi (text input), tipe_ac (select: Splitduct/Cassette/Splitwall), merek (select with custom option: Panasonic/Gree/Daikin), kapasitas (numeric input)
    - Render measurement fields: suhu R/S/T before/after, ampere R/S/T before/after, freon before/after
    - Render keterangan textarea per entry
    - Display inline validation errors from `errors` prop keyed by entry index
    - Support min 1 / max 50 entries
    - Support `disabled` prop for submitted reports
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 2.9_

- [x] 10. Create AcRecapTable React component
  - [x] 10.1 Implement `AcRecapTable` component
    - Create `resources/js/Components/AcRecapTable.tsx`
    - Render table with columns: NO, TANGGAL, LOKASI, TYPE AC, MEREK, KAPASITAS, SUHU BEFORE (R/S/T), SUHU AFTER (R/S/T), AMPERE BEFORE (R/S/T), AMPERE AFTER (R/S/T), TEKANAN FREON BEFORE, TEKANAN FREON AFTER, KETERANGAN
    - Display title "REKAP DATA PEKERJAAN MAINTENANCE AC" with optional client name
    - Handle empty rows gracefully (don't render if no data)
    - _Requirements: 4.2, 4.3, 5.1, 5.2, 5.4, 6.1, 6.2_

- [x] 11. Integrate AcMeasurementForm into WorkReports/Edit.tsx
  - [x] 11.1 Modify `WorkReports/Edit.tsx` to conditionally render AC form
    - Import `AcMeasurementForm` component
    - Track `presetData` state as `AcMeasurementEntry[]`
    - When selected category has `preset_identifier === 'ac_maintenance'`, show the AC form section
    - When category changes away from AC, show confirmation dialog before discarding data
    - Include `preset_data` JSON in form submission (buildFormData)
    - Populate form with existing `preset_data` when editing
    - Update categories prop interface to include `preset_identifier`
    - _Requirements: 1.2, 1.3, 2.1, 2.10, 3.3_

  - [x] 11.2 Apply same integration to `WorkReports/Create.tsx`
    - Mirror the same AC form integration logic as Edit page
    - _Requirements: 1.2, 1.3, 2.1, 2.10_

- [x] 12. Integrate AcRecapTable into detail pages
  - [x] 12.1 Integrate `AcRecapTable` into `WorkReports/Show.tsx`
    - Display AC recap table when `preset_data` exists and is non-empty
    - Pass preset_data entries as rows (with sequential numbering, using report date as tanggal)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 12.2 Integrate `AcRecapTable` into `Baps/Show.tsx`
    - Display AC recap table when `acRecapRows` prop has data
    - Place before the visual documentation section
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 13. Checkpoint - Frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. PDF Blade template for AC recap table
  - [x] 14.1 Create Blade partial for AC recap table in PDF
    - Create `resources/views/pdf/partials/ac-recap-table.blade.php`
    - Render table with title "REKAP DATA PEKERJAAN MAINTENANCE AC" + client name
    - Render columns: NO, TANGGAL, LOKASI, TYPE AC, MEREK, Kapasitas, SUHU BEFORE (R/S/T), SUHU AFTER (R/S/T), AMPERE BEFORE (R/S/T), AMPERE AFTER (R/S/T), TEKANAN FREON BEFORE, TEKANAN FREON AFTER, KETERANGAN
    - Style with borders and proper cell sizing for PDF layout
    - Format TANGGAL as DD/MM/YYYY
    - _Requirements: 4.1, 4.2, 4.3, 4.8_

  - [x] 14.2 Include AC recap partial in BAP PDF Blade template
    - Conditionally render the AC recap section when `$acRecapRows` is not empty
    - Place before the photo documentation section
    - _Requirements: 4.1, 4.5_

- [x] 15. Database seeder for AC category preset
  - [x] 15.1 Create seeder to set `preset_identifier` on AC job category
    - Create or update a seeder that sets `preset_identifier = 'ac_maintenance'` on the AC maintenance job category
    - _Requirements: 1.1, 1.2_

- [x] 16. Checkpoint - Full integration complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Property-based tests (fast-check)
  - [ ]* 17.1 Write property test for AC Measurement Validation Correctness
    - **Property 1: AC Measurement Validation Correctness**
    - Generate random entries with valid/invalid field combinations using fast-check arbitraries
    - Verify validator accepts entries if and only if all fields meet specified constraints
    - Verify field-level error messages for invalid entries
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

  - [ ]* 17.2 Write property test for AC Measurement Data Serialization Round-Trip
    - **Property 2: AC Measurement Data Serialization Round-Trip**
    - Generate random valid entry arrays (1-50 entries) with numeric precision and null keterangan
    - Serialize to JSON, deserialize, compare for deep equality
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

  - [ ]* 17.3 Write property test for AC Recap Table Aggregation and Filtering
    - **Property 3: AC Recap Table Aggregation and Filtering**
    - Generate work report collections with mixed categories and varying preset_data states
    - Verify aggregator includes only AC-category reports with valid non-empty preset_data
    - Verify ordering by date ascending then entry order, with correct sequential numbering
    - **Validates: Requirements 4.4, 4.6, 4.7, 6.3, 6.4**

  - [ ]* 17.4 Write property test for AC Recap Row Completeness
    - **Property 4: AC Recap Row Completeness**
    - Generate valid entries, run through aggregation, verify all columns present with correct values
    - **Validates: Requirements 4.2, 5.1, 5.2, 5.4, 6.2**

  - [ ]* 17.5 Write property test for Preset Data Isolation on Category Change
    - **Property 5: Preset Data Isolation on Category Change**
    - Generate work reports with preset_data, simulate category preset change, verify data unchanged
    - **Validates: Requirements 1.6**

- [ ] 18. PHPUnit tests
  - [ ]* 18.1 Write PHPUnit tests for AcMeasurementValidator
    - Test boundary values: suhu -10 and 100, ampere 0 and 200, freon 0 and 800, kapasitas 0.5 and 30
    - Test null keterangan, empty string lokasi, invalid tipe_ac
    - Test entry count boundaries: 0 entries (reject), 1 entry (accept), 50 entries (accept), 51 entries (reject)
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [ ]* 18.2 Write PHPUnit tests for PresetRegistry
    - Test `has('ac_maintenance')` returns true
    - Test `get('ac_maintenance')` returns correct configuration structure
    - Test `has('nonexistent')` returns false
    - Test `get('nonexistent')` returns null
    - _Requirements: 1.2, 1.5_

  - [ ]* 18.3 Write PHPUnit tests for AcRecapAggregator
    - Test empty collection returns empty array
    - Test collection with all null preset_data returns empty array
    - Test single report with single entry produces correct row
    - Test multiple reports ordered by date with correct sequential numbering
    - Test mixed categories: only AC reports included
    - _Requirements: 4.4, 4.6, 4.7, 6.3, 6.4_

  - [ ]* 18.4 Write PHPUnit feature tests for WorkReportController preset handling
    - Test store with valid AC preset data persists correctly
    - Test store with invalid AC preset data returns 422 with field errors
    - Test update preserves preset_data
    - Test show includes preset_data in response
    - _Requirements: 1.4, 2.7, 2.8, 3.1, 3.3, 5.1_

  - [ ]* 18.5 Write PHPUnit feature tests for BapController AC recap
    - Test show passes acRecapRows when BAP has AC work reports
    - Test show does not pass acRecapRows when BAP has no AC work reports
    - Test exportPdf includes AC recap data
    - _Requirements: 4.1, 6.1, 6.5_

- [x] 19. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check (TypeScript)
- PHPUnit tests validate specific examples, boundary values, and integration flows
- The project uses Laravel + Inertia.js + React (TypeScript) stack
- Backend services follow the existing interface + implementation pattern in `app/Services/`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 3, "tasks": ["6.1", "6.2", "6.3", "9.1", "10.1"] },
    { "id": 4, "tasks": ["7.1", "7.2", "11.1", "11.2", "12.1", "12.2"] },
    { "id": 5, "tasks": ["14.1", "15.1"] },
    { "id": 6, "tasks": ["14.2"] },
    { "id": 7, "tasks": ["17.1", "17.2", "17.3", "17.4", "17.5", "18.1", "18.2", "18.3", "18.4", "18.5"] }
  ]
}
```
