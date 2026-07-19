# Requirements Document

## Introduction

This feature adds full CRUD (Create, Edit/Rename, Delete) operations to the existing Role management system. Currently, the RoleController only supports listing roles, viewing a single role with its permissions, and syncing permissions. This feature extends it with the ability to create new roles, rename existing roles, and delete roles — all via modal dialogs on the existing Index page. The "admin" role is protected from deletion and renaming to prevent accidental lockout.

## Glossary

- **Role_Management_System**: The Laravel backend (RoleController, form requests, routes) and React frontend (Roles/Index.tsx) responsible for managing Spatie Permission roles.
- **Role**: A Spatie Permission role entity identified by a unique name, used to group permissions for users.
- **Admin_Role**: The role with the name "admin", which is a protected system role that cannot be deleted or renamed.
- **Create_Role_Dialog**: A modal dialog rendered on the Roles Index page that allows the administrator to input a name for a new role.
- **Edit_Role_Dialog**: A modal dialog rendered on the Roles Index page that allows the administrator to rename an existing role.
- **Delete_Confirmation_Dialog**: A confirmation dialog rendered on the Roles Index page that asks the administrator to confirm role deletion.
- **StoreRoleRequest**: A Laravel Form Request class that validates input when creating a new role.
- **Index_Page**: The React page at resources/js/Pages/Roles/Index.tsx that displays all roles in a card grid.
- **Show_Page**: The React page at resources/js/Pages/Roles/Show.tsx where an administrator syncs permissions for a role.

## Requirements

### Requirement 1: Role Creation

**User Story:** As an administrator, I want to create a new role via a modal dialog on the Index page, so that I can define new access levels without navigating away.

#### Acceptance Criteria

1. WHEN the administrator clicks the "Create Role" button on the Index_Page, THE Role_Management_System SHALL display the Create_Role_Dialog.
2. THE StoreRoleRequest SHALL validate that the role name is required, is a string, has a maximum length of 255 characters, and is unique in the roles table.
3. WHEN the administrator submits a valid role name via the Create_Role_Dialog, THE Role_Management_System SHALL create a new Role with the provided name and redirect the administrator to the Show_Page for the newly created Role.
4. IF the submitted role name already exists, THEN THE Role_Management_System SHALL display a validation error message on the Create_Role_Dialog without closing the dialog.
5. IF the submitted role name is empty or exceeds 255 characters, THEN THE Role_Management_System SHALL display a validation error message on the Create_Role_Dialog without closing the dialog.

### Requirement 2: Role Renaming

**User Story:** As an administrator, I want to rename an existing role via a modal dialog on the Index page, so that I can correct or update role names inline.

#### Acceptance Criteria

1. WHEN the administrator triggers the rename action for a non-admin Role on the Index_Page, THE Role_Management_System SHALL display the Edit_Role_Dialog pre-filled with the current role name.
2. THE Role_Management_System SHALL validate that the new role name is required, is a string, has a maximum length of 255 characters, and is unique in the roles table (excluding the current role).
3. WHEN the administrator submits a valid new name via the Edit_Role_Dialog, THE Role_Management_System SHALL update the Role name and redirect the administrator back to the Index_Page with a success message.
4. IF the submitted new name already exists for another role, THEN THE Role_Management_System SHALL display a validation error message on the Edit_Role_Dialog without closing the dialog.
5. WHILE the selected role is the Admin_Role, THE Role_Management_System SHALL disable the rename action and hide the rename trigger on the Index_Page.

### Requirement 3: Role Deletion

**User Story:** As an administrator, I want to delete an existing role via a confirmation dialog on the Index page, so that I can remove obsolete roles from the system.

#### Acceptance Criteria

1. WHEN the administrator triggers the delete action for a non-admin Role on the Index_Page, THE Role_Management_System SHALL display the Delete_Confirmation_Dialog showing the role name.
2. WHEN the administrator confirms deletion in the Delete_Confirmation_Dialog, THE Role_Management_System SHALL delete the Role and redirect the administrator back to the Index_Page with a success message.
3. WHILE the selected role is the Admin_Role, THE Role_Management_System SHALL disable the delete action and hide the delete trigger on the Index_Page.
4. IF the role deletion request targets the Admin_Role on the backend, THEN THE Role_Management_System SHALL reject the request and return a 403 Forbidden response.

### Requirement 4: Admin Role Backend Protection

**User Story:** As a system maintainer, I want the backend to enforce protection of the admin role regardless of frontend state, so that the admin role cannot be corrupted by direct API calls.

#### Acceptance Criteria

1. IF a rename request targets the Admin_Role, THEN THE Role_Management_System SHALL reject the request and return a 403 Forbidden response with an error message.
2. IF a delete request targets the Admin_Role, THEN THE Role_Management_System SHALL reject the request and return a 403 Forbidden response with an error message.
3. THE Role_Management_System SHALL identify the Admin_Role by its name value "admin" (case-sensitive match).

### Requirement 5: Route Registration

**User Story:** As an administrator, I want the new CRUD endpoints registered within the existing admin middleware group, so that only authenticated administrators can manage roles.

#### Acceptance Criteria

1. THE Role_Management_System SHALL register a POST route for role creation at the path "roles" with the name "roles.store".
2. THE Role_Management_System SHALL register a PUT route for role renaming at the path "roles/{role}" with the name "roles.update.name" (or reuse an appropriate named route).
3. THE Role_Management_System SHALL register a DELETE route for role deletion at the path "roles/{role}" with the name "roles.destroy".
4. THE Role_Management_System SHALL place all new role routes within the existing "role:admin" middleware group alongside the current role routes.

### Requirement 6: UI Consistency

**User Story:** As an administrator, I want the CRUD dialogs to match the existing UI patterns (shadcn Dialog, card grid, Shield icons), so that the role management page feels cohesive.

#### Acceptance Criteria

1. THE Role_Management_System SHALL render the Create_Role_Dialog, Edit_Role_Dialog, and Delete_Confirmation_Dialog using the shadcn Dialog component.
2. THE Role_Management_System SHALL display inline validation errors within the dialog forms using the same styling as other forms in the application.
3. THE Index_Page SHALL display a "Create Role" button in a visible, accessible location (e.g., page header area).
4. THE Index_Page SHALL display edit and delete action triggers on each role card for non-admin roles.
