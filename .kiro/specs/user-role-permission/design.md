# Design Document

## Architecture Overview

This feature migrates the existing string-based role system to Spatie Laravel Permission and provides CRUD interfaces for user and role management. The architecture follows the existing patterns in the project: Laravel resource controllers, Inertia.js page rendering, and React components with shadcn UI + @tanstack/react-table.

### Key Design Decisions

1. **Spatie Laravel Permission** is used as the single source of truth for roles and permissions. The legacy `role` string column is retained temporarily for backward compatibility.
2. **Resource controllers** (`UserController`, `RoleController`) follow the same patterns as `ClientController`.
3. **Frontend forms** use `react-hook-form` + `zod` for client-side validation, unlike the existing `Clients/Create.tsx` which uses Inertia's `useForm`. This is per requirements for zod integration.
4. **DataTable component** is reused for user listing with search and sort.
5. **Middleware** migrates from custom `RoleMiddleware` to Spatie's built-in middleware.

---

## Components

### Backend Components

#### 1. UserController (app/Http/Controllers/UserController.php)

Resource controller for user CRUD operations, accessible only to admin users.

```php
class UserController extends Controller
{
    public function index(Request $request): Response
    // Returns paginated users with search/sort support

    public function create(): Response
    // Returns create form with available roles

    public function store(StoreUserRequest $request): RedirectResponse
    // Creates user and assigns Spatie role

    public function edit(User $user): Response
    // Returns edit form with current user data and roles

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    // Updates user data and syncs Spatie role

    public function destroy(User $user): RedirectResponse
    // Deletes user (with self-deletion guard)
}
```

#### 2. RoleController (app/Http/Controllers/RoleController.php)

Controller for role and permission management.

```php
class RoleController extends Controller
{
    public function index(): Response
    // Returns roles with permission counts

    public function show(Role $role): Response
    // Returns role detail with all assigned permissions

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    // Syncs permissions for the role
}
```

#### 3. Form Requests

```php
// app/Http/Requests/StoreUserRequest.php
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'exists:roles,name'],
        ];
    }
}

// app/Http/Requests/UpdateUserRequest.php
class UpdateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($this->user)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'string', 'exists:roles,name'],
        ];
    }
}

// app/Http/Requests/UpdateRoleRequest.php
class UpdateRoleRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}
```

#### 4. Migration Seeder (database/seeders/RolePermissionSeeder.php)

```php
class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create permissions
        $permissions = [
            'manage-users', 'manage-roles', 'view-dashboard',
            'manage-clients', 'manage-job-categories', 'manage-services',
            'manage-work-reports', 'manage-bap', 'manage-bast',
            'manage-invoices', 'manage-company-settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 2. Create roles and assign permissions
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions($permissions);

        $technician = Role::firstOrCreate(['name' => 'technician']);
        $technician->syncPermissions(['manage-work-reports']);

        // 3. Migrate existing users from string column to Spatie roles
        User::whereNotNull('role')->each(function (User $user) {
            $user->assignRole($user->role);
        });
    }
}
```

#### 5. User Model Update

```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    // ... existing code preserved
}
```

#### 6. Middleware Configuration (bootstrap/app.php)

Replace custom `RoleMiddleware` with Spatie's built-in middleware:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
        'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
        'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
    ]);
})
```

#### 7. Route Registration (routes/web.php)

```php
// User & Role Management (admin only)
Route::middleware('role:admin')->group(function () {
    Route::resource('users', UserController::class)->except(['show']);
    Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
    Route::get('roles/{role}', [RoleController::class, 'show'])->name('roles.show');
    Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
});
```

---

### Frontend Components

#### 1. Pages/Users/Index.tsx

User listing page with DataTable, search, and sort.

```typescript
interface UserListItem {
    id: number;
    name: string;
    email: string;
    roles: { id: number; name: string }[];
    created_at: string;
}

// Columns: name (sortable), email (sortable), role (badge), actions (edit/delete)
// Search: server-side filtering by name or email
// Delete: ConfirmModal with self-deletion guard
```

#### 2. Pages/Users/Create.tsx

User creation form with zod + react-hook-form.

```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const createUserSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    role: z.string().min(1, 'Role wajib dipilih'),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
```

#### 3. Pages/Users/Edit.tsx

User edit form, same schema as create but password is optional.

```typescript
const editUserSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter').or(z.literal('')).optional(),
    role: z.string().min(1, 'Role wajib dipilih'),
});

type EditUserFormData = z.infer<typeof editUserSchema>;
```

#### 4. Pages/Roles/Index.tsx

Role listing with permission count badges.

```typescript
interface RoleListItem {
    id: number;
    name: string;
    permissions_count: number;
    permissions: { id: number; name: string }[];
}
```

#### 5. Pages/Roles/Show.tsx

Role detail view with permission toggle checkboxes for assignment.

```typescript
interface RoleDetailProps {
    role: {
        id: number;
        name: string;
        permissions: { id: number; name: string }[];
    };
    allPermissions: { id: number; name: string }[];
}
```

#### 6. Navigation Update (AuthenticatedLayout.tsx)

Add nav items for user and role management, visible only to admin:

```typescript
const navItems: NavItem[] = [
    // ... existing items
    {
        label: 'Pengguna',
        href: '/users',
        icon: <UserCog className="size-4" />,
        roles: ['admin'],
    },
    {
        label: 'Role & Perizinan',
        href: '/roles',
        icon: <Shield className="size-4" />,
        roles: ['admin'],
    },
];
```

---

## Data Models

### Database Schema (Spatie tables - auto-generated by migration)

```
roles
├── id (bigint, PK)
├── name (string, unique)
├── guard_name (string, default: 'web')
├── created_at (timestamp)
└── updated_at (timestamp)

permissions
├── id (bigint, PK)
├── name (string, unique)
├── guard_name (string, default: 'web')
├── created_at (timestamp)
└── updated_at (timestamp)

model_has_roles
├── role_id (bigint, FK → roles.id)
├── model_type (string)
└── model_id (bigint)

model_has_permissions
├── permission_id (bigint, FK → permissions.id)
├── model_type (string)
└── model_id (bigint)

role_has_permissions
├── permission_id (bigint, FK → permissions.id)
└── role_id (bigint, FK → roles.id)
```

### TypeScript Interfaces

```typescript
// types/index.d.ts additions
export interface Role {
    id: number;
    name: string;
    permissions_count?: number;
    permissions?: Permission[];
}

export interface Permission {
    id: number;
    name: string;
}

// Updated User interface
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: 'admin' | 'technician'; // legacy field
    roles?: Role[];
}
```

---

## Interfaces

### API Contracts (Inertia page props)

#### GET /users (Users/Index)

```typescript
{
    users: PaginatedData<UserListItem>;
    filters: { search: string };
}
```

#### GET /users/create (Users/Create)

```typescript
{
    roles: Role[];
}
```

#### POST /users

```typescript
// Request body
{ name: string; email: string; password: string; role: string; }
// Redirects to /users with flash success/error
```

#### GET /users/{id}/edit (Users/Edit)

```typescript
{
    user: UserListItem;
    roles: Role[];
}
```

#### PUT /users/{id}

```typescript
// Request body
{ name: string; email: string; password?: string; role: string; }
// Redirects to /users with flash success/error
```

#### DELETE /users/{id}

```typescript
// Redirects to /users with flash success/error
// Returns 403 if self-deletion attempted
```

#### GET /roles (Roles/Index)

```typescript
{
    roles: RoleListItem[];
}
```

#### GET /roles/{id} (Roles/Show)

```typescript
{
    role: { id: number; name: string; permissions: Permission[] };
    allPermissions: Permission[];
}
```

#### PUT /roles/{id}

```typescript
// Request body
{ permissions: string[]; }
// Redirects to /roles/{id} with flash success
```

---

## Error Handling

### Backend Validation Errors

| Scenario | Response |
|----------|----------|
| Missing required fields | 422 with field-level error messages |
| Duplicate email | 422 with `email` error: "The email has already been taken" |
| Invalid role name | 422 with `role` error: "The selected role is invalid" |
| Password too short | 422 with `password` error |
| Self-deletion attempt | 403 with error message |
| Unauthorized access | 403 via Spatie middleware |

### Frontend Validation (Zod)

- Inline errors displayed below each field immediately on submit
- Email format validation via `z.string().email()`
- Password min length via `z.string().min(8)`
- Required fields via `z.string().min(1)`

### Edge Cases

- Editing user without changing password: `password` field left empty → backend retains existing hash
- Deleting user who is the current admin: rejected with 403
- Attempting to access /users or /roles as technician: Spatie middleware returns 403
- Syncing empty permissions array for a role: allowed (role has no permissions)

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Migration Role Preservation

*For any* user with a non-null legacy `role` string column value, after executing the migration seeder, the user's Spatie role assignment SHALL match the original string value exactly.

**Validates: Requirements 2.2**

### Property 2: User Search Filter Correctness

*For any* set of users and any search query string, the filtered results SHALL contain only users whose name or email contains the search string (case-insensitive), and SHALL include all users matching that criterion.

**Validates: Requirements 3.2**

### Property 3: User Sort Correctness

*For any* set of users, sorting by name (ascending) SHALL produce a list where each user's name is lexicographically less than or equal to the next user's name, and sorting by email SHALL produce a list ordered by email.

**Validates: Requirements 3.3**

### Property 4: User Creation Integrity

*For any* valid user creation payload (non-empty name, valid email, password ≥ 8 chars, existing role name), after creation the system SHALL contain a user with matching name, email, and Spatie role assignment.

**Validates: Requirements 3.4**

### Property 5: User Update Integrity

*For any* existing user and any valid update payload, after update the user's name, email, and role SHALL equal the new values. If password is omitted, the password hash SHALL remain unchanged.

**Validates: Requirements 3.6, 3.7**

### Property 6: User Deletion Exclusion

*For any* user that is deleted (and is not the currently authenticated admin), that user SHALL not appear in subsequent user listing queries.

**Validates: Requirements 3.8, 3.9**

### Property 7: Input Validation Rejects Invalid Data

*For any* user form submission where at least one required field is empty, the email is not valid RFC format, or the password is shorter than 8 characters, the validation layer SHALL reject the submission and produce field-specific error messages.

**Validates: Requirements 3.10, 7.1, 7.2, 7.3, 7.5**

### Property 8: Permission Sync Round-Trip

*For any* role and any subset of the available permissions, after syncing that subset to the role and re-fetching the role's permissions, the returned permission set SHALL be exactly equal to the synced subset.

**Validates: Requirements 4.2, 4.3, 4.4, 4.5**

### Property 9: Role-Based Access Control Enforcement

*For any* authenticated user without the "admin" role, accessing any user management or role management route SHALL result in an HTTP 403 response.

**Validates: Requirements 5.4, 6.1, 6.2, 6.3**
