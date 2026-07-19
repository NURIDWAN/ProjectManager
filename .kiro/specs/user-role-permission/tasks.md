# Implementation Plan: User Role & Permission (Spatie Laravel Permission)

## Overview

Migrate from string-based role to Spatie Laravel Permission, implement User CRUD with role assignment, Role management with permission sync, and update middleware to Spatie built-in. Uses existing project patterns (resource controllers, DataTable, shadcn UI, react-hook-form + zod).

## Tasks

- [x] 1. Install Spatie Package and Configure Backend Foundation
  - [x] 1.1 Install Spatie Laravel Permission package and publish config/migrations
    - Run `composer require spatie/laravel-permission`
    - Publish migrations: `php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"`
    - Run `php artisan migrate` to create Spatie tables (roles, permissions, model_has_roles, model_has_permissions, role_has_permissions)
    - Publish config file to `config/permission.php`
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 1.2 Update User model to use HasRoles trait
    - Add `use Spatie\Permission\Traits\HasRoles;` to `app/Models/User.php`
    - Add `HasRoles` to the class `use` statement alongside existing traits
    - _Requirements: 1.3_

  - [x] 1.3 Create RolePermissionSeeder for data migration
    - Create `database/seeders/RolePermissionSeeder.php`
    - Create all predefined permissions: manage-users, manage-roles, view-dashboard, manage-clients, manage-job-categories, manage-services, manage-work-reports, manage-bap, manage-bast, manage-invoices, manage-company-settings
    - Create "admin" and "technician" roles
    - Assign all permissions to "admin" role
    - Assign "manage-work-reports" to "technician" role
    - Migrate existing users from `role` string column to Spatie role assignments
    - Retain legacy `role` column for backward compatibility
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 1.4 Replace custom RoleMiddleware with Spatie middleware
    - Update `bootstrap/app.php` to register Spatie middleware aliases: `role`, `permission`, `role_or_permission`
    - Remove or deprecate `app/Http/Middleware/RoleMiddleware.php`
    - Verify existing route middleware references (`role:admin`) remain compatible with Spatie's middleware signature
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Implement User Management Backend (Controller, Requests, Routes)
  - [x] 2.1 Create Form Request classes for User CRUD
    - Create `app/Http/Requests/StoreUserRequest.php` with validation: name (required, string, max:255), email (required, email, unique:users), password (required, string, min:8), role (required, string, exists:roles,name)
    - Create `app/Http/Requests/UpdateUserRequest.php` with validation: name (required), email (required, unique ignoring current user), password (nullable, min:8), role (required, exists:roles,name)
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.10_

  - [x] 2.2 Create UserController resource controller
    - Create `app/Http/Controllers/UserController.php`
    - `index`: paginated user list with search (name/email) and sort support, load roles relationship
    - `create`: return form with available roles from Spatie
    - `store`: create user, hash password, assign Spatie role via `$user->assignRole($request->role)`
    - `edit`: return user with current roles and all available roles
    - `update`: update user fields, sync role via `$user->syncRoles([$request->role])`, skip password if empty
    - `destroy`: delete user with self-deletion guard (return 403 if deleting own account)
    - Follow patterns from `ClientController` (search, pagination, Inertia::render, Redirect)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 2.3 Create RoleController for role and permission management
    - Create `app/Http/Controllers/RoleController.php`
    - `index`: list all roles with permissions count (`withCount('permissions')`)
    - `show`: return role with all permissions and full list of available permissions
    - `update`: sync permissions via `$role->syncPermissions($request->permissions)`
    - Create `app/Http/Requests/UpdateRoleRequest.php` with validation: permissions (required, array), permissions.* (string, exists:permissions,name)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.4 Register routes for User and Role management
    - Add `use App\Http\Controllers\UserController;` and `use App\Http\Controllers\RoleController;` to `routes/web.php`
    - Add route group with `middleware('role:admin')` containing:
      - `Route::resource('users', UserController::class)->except(['show'])`
      - `Route::get('roles', [RoleController::class, 'index'])->name('roles.index')`
      - `Route::get('roles/{role}', [RoleController::class, 'show'])->name('roles.show')`
      - `Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update')`
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 3. Checkpoint - Backend Verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Add TypeScript Types and Frontend Utilities
  - [x] 4.1 Update TypeScript type definitions
    - Add `Role` interface (id, name, permissions_count?, permissions?) to `resources/js/types/index.d.ts`
    - Add `Permission` interface (id, name) to `resources/js/types/index.d.ts`
    - Update existing `User` interface to include `roles?: Role[]`
    - _Requirements: 3.1, 4.1_

  - [x] 4.2 Create Zod schemas for user forms
    - Create `resources/js/Pages/Users/schemas.ts`
    - Define `createUserSchema`: name (min 1, "Nama wajib diisi"), email (email format, "Format email tidak valid"), password (min 8, "Password minimal 8 karakter"), role (min 1, "Role wajib dipilih")
    - Define `editUserSchema`: same as create but password is optional (z.string().min(8).or(z.literal('')).optional())
    - Export TypeScript types inferred from schemas
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 5. Implement User Management Frontend Pages
  - [x] 5.1 Create Users/Index.tsx page with DataTable
    - Create `resources/js/Pages/Users/Index.tsx`
    - Use existing `DataTable` component with columns: name (sortable), email (sortable), role (badge), actions (edit/delete buttons)
    - Implement server-side search using Inertia router with debounce on search input
    - Implement sort via column headers
    - Add "Tambah User" button linking to `route('users.create')`
    - Add delete confirmation using `DeleteConfirmationDialog` or `ConfirmModal` component
    - Use `AuthenticatedLayout` wrapper
    - _Requirements: 3.1, 3.2, 3.3, 3.8_

  - [x] 5.2 Create Users/Create.tsx page with zod + react-hook-form
    - Create `resources/js/Pages/Users/Create.tsx`
    - Use `react-hook-form` with `zodResolver` and `createUserSchema`
    - Form fields: name (Input), email (Input), password (Input type="password"), role (Select from available roles prop)
    - Submit via `router.post(route('users.store'), data)` after validation passes
    - Display server-side validation errors from Inertia `usePage().props.errors`
    - Use shadcn UI components (Input, Select, Button, Label)
    - Use `AuthenticatedLayout` wrapper
    - _Requirements: 3.4, 3.5, 7.1, 7.2, 7.4, 7.5_

  - [x] 5.3 Create Users/Edit.tsx page with zod + react-hook-form
    - Create `resources/js/Pages/Users/Edit.tsx`
    - Use `react-hook-form` with `zodResolver` and `editUserSchema`
    - Pre-fill form with existing user data
    - Password field optional (placeholder indicates leaving empty retains current password)
    - Submit via `router.put(route('users.update', user.id), data)` after validation passes
    - Display server-side validation errors from Inertia `usePage().props.errors`
    - Use `AuthenticatedLayout` wrapper
    - _Requirements: 3.6, 3.7, 7.3, 7.4_

- [x] 6. Implement Role Management Frontend Pages
  - [x] 6.1 Create Roles/Index.tsx page
    - Create `resources/js/Pages/Roles/Index.tsx`
    - Display list of roles as cards or table rows with role name and permission count badge
    - Each role links to its detail/show page
    - Use `AuthenticatedLayout` wrapper
    - _Requirements: 4.1, 4.2_

  - [x] 6.2 Create Roles/Show.tsx page with permission sync
    - Create `resources/js/Pages/Roles/Show.tsx`
    - Display role name and full list of assigned permissions
    - Show all available permissions as checkboxes (checked = assigned)
    - On save, submit `router.put(route('roles.update', role.id), { permissions: selectedPermissions })`
    - Show success flash message after sync
    - Use `AuthenticatedLayout` wrapper
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 7. Update Navigation and Access Control UI
  - [x] 7.1 Update AuthenticatedLayout navigation for admin-only items
    - Add "Pengguna" nav item (href: /users, icon: UserCog) visible only to admin role
    - Add "Role & Perizinan" nav item (href: /roles, icon: Shield) visible only to admin role
    - Conditionally render based on user's roles (check `auth.user.roles` from Inertia shared data)
    - _Requirements: 6.4_

  - [x] 7.2 Share user roles in Inertia HandleInertiaRequests middleware
    - Update `app/Http/Middleware/HandleInertiaRequests.php` to include user roles in shared data
    - Add `roles` to the auth.user shared prop so frontend can check role-based visibility
    - _Requirements: 6.4_

- [x] 8. Checkpoint - Full Integration Verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 9. Write Property-Based Tests
  - [ ]* 9.1 Write property test for migration role preservation
    - **Property 1: Migration Role Preservation**
    - For any user with a non-null legacy role string, after executing seeder, the Spatie role matches the original string
    - **Validates: Requirements 2.2**

  - [ ]* 9.2 Write property test for user search filter correctness
    - **Property 2: User Search Filter Correctness**
    - For any set of users and search query, filtered results contain only and all users whose name/email contains the search string (case-insensitive)
    - **Validates: Requirements 3.2**

  - [ ]* 9.3 Write property test for user sort correctness
    - **Property 3: User Sort Correctness**
    - For any set of users, sorting by name/email produces lexicographically ordered results
    - **Validates: Requirements 3.3**

  - [ ]* 9.4 Write property test for user creation integrity
    - **Property 4: User Creation Integrity**
    - For any valid creation payload, created user has matching name, email, and Spatie role
    - **Validates: Requirements 3.4**

  - [ ]* 9.5 Write property test for user update integrity
    - **Property 5: User Update Integrity**
    - For any valid update payload, updated user reflects new values; omitted password retains hash
    - **Validates: Requirements 3.6, 3.7**

  - [ ]* 9.6 Write property test for user deletion exclusion
    - **Property 6: User Deletion Exclusion**
    - Deleted non-self user does not appear in subsequent listings
    - **Validates: Requirements 3.8, 3.9**

  - [ ]* 9.7 Write property test for input validation rejects invalid data
    - **Property 7: Input Validation Rejects Invalid Data**
    - For any submission with empty fields, invalid email, or short password, validation rejects with field-specific errors
    - **Validates: Requirements 3.10, 7.1, 7.2, 7.3, 7.5**

  - [ ]* 9.8 Write property test for permission sync round-trip
    - **Property 8: Permission Sync Round-Trip**
    - For any role and permission subset, after sync and re-fetch, returned permissions equal the synced subset
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

  - [ ]* 9.9 Write property test for role-based access control enforcement
    - **Property 9: Role-Based Access Control Enforcement**
    - Any non-admin authenticated user accessing user/role management routes receives HTTP 403
    - **Validates: Requirements 5.4, 6.1, 6.2, 6.3**

- [x] 10. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses PHP/Laravel for backend and TypeScript/React for frontend
- Follow existing patterns from `ClientController` and `Clients/` pages
- Use existing `DataTable`, `ConfirmModal`, `DeleteConfirmationDialog` components
- Spatie middleware signature `role:admin` is compatible with existing route definitions

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "4.1"] },
    { "id": 4, "tasks": ["2.4", "4.2"] },
    { "id": 5, "tasks": ["5.1", "5.2", "5.3", "7.2"] },
    { "id": 6, "tasks": ["6.1", "6.2", "7.1"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8", "9.9"] }
  ]
}
```
