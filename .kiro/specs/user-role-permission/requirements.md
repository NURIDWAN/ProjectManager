# Requirements Document

## Introduction

Fitur ini mengintegrasikan package Spatie Laravel Permission untuk menggantikan sistem role berbasis string yang ada saat ini. Migrasi ini memungkinkan manajemen role dan permission yang lebih granular, menyediakan UI CRUD lengkap untuk manajemen user dan role, serta memperbarui middleware agar menggunakan fitur bawaan Spatie.

## Glossary

- **System**: Aplikasi Laravel (backend) beserta komponen Inertia/React (frontend)
- **Permission_Manager**: Modul backend yang menangani operasi CRUD untuk role dan permission menggunakan Spatie Laravel Permission
- **User_Manager**: Modul backend yang menangani operasi CRUD untuk user termasuk assignment role
- **Migration_Service**: Komponen yang melakukan migrasi data role dari kolom string ke tabel Spatie
- **RoleMiddleware**: Middleware HTTP yang memvalidasi akses user berdasarkan role menggunakan Spatie middleware
- **Admin**: User dengan role admin yang memiliki akses penuh ke semua fitur manajemen
- **Technician**: User dengan role technician yang memiliki akses terbatas sesuai permission yang diberikan
- **Permission**: Hak akses granular yang dapat diberikan ke role (contoh: manage-users, manage-roles, view-dashboard)
- **DataTable_UI**: Komponen tabel React menggunakan @tanstack/react-table untuk menampilkan data dengan fitur search, sort, dan pagination

## Requirements

### Requirement 1: Instalasi dan Konfigurasi Spatie Laravel Permission

**User Story:** As an admin, I want the system to use Spatie Laravel Permission package, so that role and permission management is standardized and extensible.

#### Acceptance Criteria

1. THE System SHALL include Spatie Laravel Permission package as a composer dependency
2. THE System SHALL publish and run the Spatie migration files to create permission-related database tables (roles, permissions, model_has_roles, model_has_permissions, role_has_permissions)
3. THE System SHALL configure the User model to use the HasRoles trait from Spatie Laravel Permission
4. THE System SHALL publish the Spatie permission configuration file to config/permission.php

### Requirement 2: Migrasi Data Role Existing

**User Story:** As an admin, I want existing user roles to be migrated to the new Spatie system, so that no user loses their current access level.

#### Acceptance Criteria

1. WHEN the migration seeder is executed, THE Migration_Service SHALL create roles "admin" and "technician" in the Spatie roles table
2. WHEN the migration seeder is executed, THE Migration_Service SHALL assign the corresponding Spatie role to each existing user based on the current value of the role string column
3. WHEN all existing users have been assigned Spatie roles, THE Migration_Service SHALL retain the legacy role column for backward compatibility until explicitly removed
4. THE Migration_Service SHALL create a predefined set of permissions: manage-users, manage-roles, view-dashboard, manage-clients, manage-job-categories, manage-services, manage-work-reports, manage-bap, manage-bast, manage-invoices, manage-company-settings
5. WHEN the seeder is executed, THE Migration_Service SHALL assign all permissions to the "admin" role
6. WHEN the seeder is executed, THE Migration_Service SHALL assign the "manage-work-reports" permission to the "technician" role

### Requirement 3: User Management CRUD

**User Story:** As an admin, I want to create, view, edit, and delete users with role assignments, so that I can manage team access efficiently.

#### Acceptance Criteria

1. WHEN an admin navigates to the user management page, THE User_Manager SHALL display a paginated list of all users with columns: name, email, role, and action buttons
2. THE DataTable_UI SHALL provide search functionality to filter users by name or email
3. THE DataTable_UI SHALL provide sort functionality on name and email columns
4. WHEN an admin submits the create user form, THE User_Manager SHALL create a new user with name, email, password, and assigned role
5. WHEN an admin submits the create user form with an email that already exists, THE User_Manager SHALL display a validation error indicating the email is already taken
6. WHEN an admin submits the edit user form, THE User_Manager SHALL update the user's name, email, and role assignment
7. WHEN an admin edits a user without providing a new password, THE User_Manager SHALL retain the existing password
8. WHEN an admin confirms user deletion, THE User_Manager SHALL soft-delete or remove the user from the system
9. IF an admin attempts to delete their own account, THEN THE User_Manager SHALL reject the operation and display an error message
10. THE User_Manager SHALL validate that the email field contains a valid email format and the name field is not empty

### Requirement 4: Role Management UI

**User Story:** As an admin, I want to view roles and their associated permissions, so that I can understand the access structure of the system.

#### Acceptance Criteria

1. WHEN an admin navigates to the role management page, THE Permission_Manager SHALL display a list of all roles with their associated permissions
2. THE Permission_Manager SHALL display each role's name and the count of assigned permissions
3. WHEN an admin selects a role, THE Permission_Manager SHALL display the full list of permissions assigned to that role
4. THE Permission_Manager SHALL provide an interface to assign or remove permissions from a role
5. WHEN an admin updates permissions for a role, THE Permission_Manager SHALL persist the changes and reflect the updated permission set immediately

### Requirement 5: Middleware Update ke Spatie

**User Story:** As an admin, I want the middleware to use Spatie's built-in role/permission checking, so that authorization is handled consistently with the new system.

#### Acceptance Criteria

1. THE RoleMiddleware SHALL be replaced with Spatie's built-in role middleware (spatie/laravel-permission RoleMiddleware)
2. THE System SHALL register Spatie's role and permission middleware aliases in the application bootstrap
3. WHEN an unauthenticated user accesses a protected route, THE System SHALL return HTTP 403 response
4. WHEN an authenticated user without the required role accesses a role-protected route, THE System SHALL return HTTP 403 response
5. THE System SHALL maintain all existing route-level role restrictions (admin-only routes remain admin-only)

### Requirement 6: Access Control untuk Halaman Manajemen

**User Story:** As an admin, I want user and role management pages to be accessible only to admins, so that unauthorized users cannot modify system access.

#### Acceptance Criteria

1. THE System SHALL restrict access to the user management page to users with the "admin" role
2. THE System SHALL restrict access to the role management page to users with the "admin" role
3. WHEN a non-admin user attempts to access user or role management routes, THE System SHALL return HTTP 403 response
4. THE System SHALL display navigation menu items for user and role management only to users with the "admin" role

### Requirement 7: Frontend Form Validation

**User Story:** As an admin, I want form inputs to be validated on the client side before submission, so that I receive immediate feedback on errors.

#### Acceptance Criteria

1. WHEN an admin submits the user creation form with empty required fields (name, email, password, role), THE System SHALL display inline validation errors without submitting to the server
2. WHEN an admin submits the user creation form with an invalid email format, THE System SHALL display an inline validation error on the email field
3. WHEN an admin submits the user edit form with empty required fields (name, email, role), THE System SHALL display inline validation errors without submitting to the server
4. THE System SHALL use zod schema validation integrated with react-hook-form for all user management forms
5. WHEN an admin submits the user creation form with a password shorter than 8 characters, THE System SHALL display an inline validation error on the password field
