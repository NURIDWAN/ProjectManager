# Implementation Plan: Role CRUD

## Overview

Extend the existing RoleController and Roles/Index.tsx with full CRUD capabilities (create, rename, delete) using modal dialogs. Backend enforces admin role protection. Two new form requests handle validation, three new routes are registered, and three dialog components are added to the frontend.

## Tasks

- [x] 1. Create backend form requests and route registration
  - [x] 1.1 Create StoreRoleRequest form request
    - Create `app/Http/Requests/StoreRoleRequest.php`
    - Validate: name is required, string, max:255, unique in roles table
    - Add Indonesian error messages (Nama role wajib diisi, maksimal 255 karakter, sudah digunakan)
    - _Requirements: 1.2, 1.4, 1.5_

  - [x] 1.2 Create UpdateRoleNameRequest form request
    - Create `app/Http/Requests/UpdateRoleNameRequest.php`
    - Validate: name is required, string, max:255, unique in roles table (excluding current role via `Rule::unique()->ignore()`)
    - Add Indonesian error messages
    - _Requirements: 2.2, 2.4_

  - [x] 1.3 Register new routes in web.php
    - Add `Route::post('roles', [RoleController::class, 'store'])->name('roles.store')` within the existing admin middleware group
    - Add `Route::put('roles/{role}/name', [RoleController::class, 'updateName'])->name('roles.update.name')`
    - Add `Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')`
    - Place all routes alongside existing role routes inside the `role:admin` middleware group
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2. Implement RoleController CRUD methods
  - [x] 2.1 Add `store` method to RoleController
    - Accept `StoreRoleRequest`, create a new Role with the validated name
    - Redirect to `roles.show` with a success flash message
    - _Requirements: 1.3_

  - [x] 2.2 Add `updateName` method to RoleController
    - Accept `UpdateRoleNameRequest` and `Role` model
    - Check if `$role->name === 'admin'` and abort(403) if so
    - Update the role name and redirect to `roles.index` with success flash
    - _Requirements: 2.3, 2.5, 4.1, 4.3_

  - [x] 2.3 Add `destroy` method to RoleController
    - Accept `Role` model
    - Check if `$role->name === 'admin'` and abort(403) if so
    - Delete the role and redirect to `roles.index` with success flash
    - _Requirements: 3.2, 3.3, 3.4, 4.2, 4.3_

  - [ ]* 2.4 Write feature tests for RoleController CRUD actions
    - Test store with valid data creates role and redirects to show page
    - Test store with duplicate name returns 422 validation error
    - Test updateName with valid data renames role and redirects
    - Test updateName on admin role returns 403
    - Test destroy deletes role and redirects
    - Test destroy on admin role returns 403
    - Test non-admin user cannot access any route (middleware protection)
    - _Requirements: 1.3, 2.3, 3.2, 3.4, 4.1, 4.2_

- [x] 3. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement frontend dialog components
  - [x] 4.1 Create CreateRoleDialog component
    - Create `resources/js/Pages/Roles/CreateRoleDialog.tsx`
    - Use shadcn Dialog component with form containing Input for role name
    - Use Inertia `useForm` hook with `post(route('roles.store'))` on submit
    - Display inline validation errors from `errors.name`
    - Reset form and close dialog on success
    - _Requirements: 1.1, 1.4, 1.5, 6.1, 6.2_

  - [x] 4.2 Create EditRoleDialog component
    - Create `resources/js/Pages/Roles/EditRoleDialog.tsx`
    - Use shadcn Dialog component with form pre-filled with current role name
    - Use Inertia `useForm` hook with `put(route('roles.update.name', role.id))` on submit
    - Sync form data when `role` prop changes via `useEffect`
    - Display inline validation errors; keep dialog open on failure
    - _Requirements: 2.1, 2.4, 6.1, 6.2_

  - [x] 4.3 Create DeleteRoleDialog component
    - Create `resources/js/Pages/Roles/DeleteRoleDialog.tsx`
    - Use shadcn AlertDialog component showing the role name in the confirmation message
    - Use Inertia `useForm` hook with `delete(route('roles.destroy', role.id))` on confirm
    - Close dialog on success
    - _Requirements: 3.1, 3.2, 6.1_

- [x] 5. Extend Roles/Index.tsx with dialog integration and action triggers
  - [x] 5.1 Add state management and dialog wiring to Index.tsx
    - Add state for `createDialogOpen`, `editDialogOpen`, `deleteDialogOpen`, and `selectedRole`
    - Import and render CreateRoleDialog, EditRoleDialog, DeleteRoleDialog components
    - Add a "Create Role" button in the page header area
    - _Requirements: 1.1, 6.3_

  - [x] 5.2 Add edit/delete action triggers to role cards
    - For each role card where `role.name !== 'admin'`, render Pencil (edit) and Trash2 (delete) icon buttons
    - Clicking edit opens EditRoleDialog with the selected role
    - Clicking delete opens DeleteRoleDialog with the selected role
    - Ensure action buttons don't trigger the card's Link navigation (stopPropagation)
    - _Requirements: 2.1, 2.5, 3.1, 3.3, 6.4_

- [x] 6. Final checkpoint - Ensure everything works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design uses PHP (Laravel) for backend and TypeScript (React) for frontend
- Existing `UpdateRoleRequest` for permission sync remains unchanged
- The admin role protection check uses case-sensitive string comparison (`=== 'admin'`)
- No new migrations are needed — the feature operates on the existing Spatie `roles` table

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2"] }
  ]
}
```
