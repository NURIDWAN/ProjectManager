# Design Document

## Overview

This feature extends the existing RoleController with full CRUD capabilities (create, rename, delete) while preserving the current permission-sync functionality. All new operations are performed via modal dialogs on the existing Index page, avoiding additional page navigation. The "admin" role receives backend-enforced protection against renaming and deletion.

## Architecture

### Key Design Decisions

1. **Modal-based CRUD** — Create, rename, and delete operations use shadcn Dialog modals on the Index page rather than separate pages. This matches the request to keep the workflow inline.
2. **Separate form request for creation** — A new `StoreRoleRequest` handles create validation. The existing `UpdateRoleRequest` (permission sync) stays unchanged; a new `UpdateRoleNameRequest` handles rename validation.
3. **Backend admin protection** — The controller checks `$role->name === 'admin'` before rename/destroy and returns 403, regardless of frontend state.
4. **Route naming** — New routes: `roles.store` (POST), `roles.update.name` (PUT for rename), `roles.destroy` (DELETE). The existing `roles.update` (PUT for permission sync) is unchanged.
5. **Redirect after create** — After successful role creation, redirect to the Show page so the admin can immediately assign permissions.

---

## Components and Interfaces

### Backend Components

#### 1. RoleController (extended)

New methods added to the existing controller:

```php
class RoleController extends Controller
{
    // Existing methods: index(), show(), update()

    /**
     * Store a newly created role.
     */
    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $role = Role::create(['name' => $request->validated('name')]);

        return Redirect::route('roles.show', $role)
            ->with('success', 'Role berhasil dibuat.');
    }

    /**
     * Update the name of the specified role.
     */
    public function updateName(UpdateRoleNameRequest $request, Role $role): RedirectResponse
    {
        if ($role->name === 'admin') {
            abort(403, 'Role admin tidak dapat diubah namanya.');
        }

        $role->update(['name' => $request->validated('name')]);

        return Redirect::route('roles.index')
            ->with('success', 'Nama role berhasil diperbarui.');
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role): RedirectResponse
    {
        if ($role->name === 'admin') {
            abort(403, 'Role admin tidak dapat dihapus.');
        }

        $role->delete();

        return Redirect::route('roles.index')
            ->with('success', 'Role berhasil dihapus.');
    }
}
```

#### 2. StoreRoleRequest (new)

```php
// app/Http/Requests/StoreRoleRequest.php
class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama role wajib diisi.',
            'name.max' => 'Nama role maksimal 255 karakter.',
            'name.unique' => 'Nama role sudah digunakan.',
        ];
    }
}
```

#### 3. UpdateRoleNameRequest (new)

```php
// app/Http/Requests/UpdateRoleNameRequest.php
class UpdateRoleNameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->ignore($this->route('role')),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama role wajib diisi.',
            'name.max' => 'Nama role maksimal 255 karakter.',
            'name.unique' => 'Nama role sudah digunakan.',
        ];
    }
}
```

#### 4. Route Registration

New routes added within the existing `role:admin` middleware group:

```php
// routes/web.php — inside the admin middleware group
Route::middleware('role:admin')->group(function () {
    Route::resource('users', UserController::class)->except(['show']);

    Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
    Route::get('roles/{role}', [RoleController::class, 'show'])->name('roles.show');
    Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::put('roles/{role}/name', [RoleController::class, 'updateName'])->name('roles.update.name');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
});
```

---

### Frontend Components

#### 1. Pages/Roles/Index.tsx (extended)

The existing Index page is extended with three modal dialogs and action triggers on role cards.

```typescript
interface RoleListItem {
    id: number;
    name: string;
    permissions_count: number;
}

interface Props {
    roles: RoleListItem[];
}

// State management for modals
const [createDialogOpen, setCreateDialogOpen] = useState(false);
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [selectedRole, setSelectedRole] = useState<RoleListItem | null>(null);
```

#### 2. CreateRoleDialog Component

Inline component or extracted to `components/Roles/CreateRoleDialog.tsx`:

```typescript
interface CreateRoleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Uses Inertia's useForm for form state + server-side validation display
function CreateRoleDialog({ open, onOpenChange }: CreateRoleDialogProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('roles.store'), {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    // Renders: Dialog → DialogContent → form with Input + error display + submit Button
}
```

#### 3. EditRoleDialog Component

```typescript
interface EditRoleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: RoleListItem | null;
}

function EditRoleDialog({ open, onOpenChange, role }: EditRoleDialogProps) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: role?.name ?? '',
    });

    // Re-sync form data when role prop changes
    useEffect(() => {
        if (role) setData('name', role.name);
    }, [role]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('roles.update.name', role!.id), {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    // Renders: Dialog → DialogContent → form with pre-filled Input + error display + submit Button
}
```

#### 4. DeleteRoleDialog Component

```typescript
interface DeleteRoleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: RoleListItem | null;
}

function DeleteRoleDialog({ open, onOpenChange, role }: DeleteRoleDialogProps) {
    const { delete: destroy, processing } = useForm({});

    const handleConfirm = () => {
        destroy(route('roles.destroy', role!.id), {
            onSuccess: () => onOpenChange(false),
        });
    };

    // Renders: AlertDialog → description with role name → Cancel + Confirm buttons
}
```

#### 5. Role Card Action Triggers

Each role card (except admin) shows edit (Pencil icon) and delete (Trash icon) buttons. Clicking them opens the respective dialog:

```typescript
{role.name !== 'admin' && (
    <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => openEditDialog(role)}>
            <Pencil className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(role)}>
            <Trash2 className="size-4" />
        </Button>
    </div>
)}
```

---

## Data Models

### Existing Schema (unchanged)

The feature operates on the existing Spatie `roles` table:

```
roles
├── id (bigint, PK)
├── name (string, unique)
├── guard_name (string, default: 'web')
├── created_at (timestamp)
└── updated_at (timestamp)
```

No new migrations are required. The feature only adds/modifies/deletes rows in the existing table.

### TypeScript Interfaces (unchanged)

```typescript
interface RoleListItem {
    id: number;
    name: string;
    permissions_count: number;
}
```

---

## Interfaces

### API Contracts

#### POST /roles (roles.store)

```typescript
// Request body
{ name: string }

// Success: Redirect to /roles/{id} (Show page) with flash.success
// Validation error: 422 with errors.name
```

#### PUT /roles/{role}/name (roles.update.name)

```typescript
// Request body
{ name: string }

// Success: Redirect to /roles with flash.success
// Validation error: 422 with errors.name
// Admin protection: 403 Forbidden
```

#### DELETE /roles/{role} (roles.destroy)

```typescript
// No request body

// Success: Redirect to /roles with flash.success
// Admin protection: 403 Forbidden
```

#### GET /roles (roles.index) — unchanged

```typescript
{
    roles: RoleListItem[];
}
```

---

## Error Handling

### Backend Error Responses

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| Role name empty | 422 | `{ errors: { name: "Nama role wajib diisi." } }` |
| Role name > 255 chars | 422 | `{ errors: { name: "Nama role maksimal 255 karakter." } }` |
| Role name already exists | 422 | `{ errors: { name: "Nama role sudah digunakan." } }` |
| Rename admin role | 403 | `"Role admin tidak dapat diubah namanya."` |
| Delete admin role | 403 | `"Role admin tidak dapat dihapus."` |
| Unauthenticated | 302 | Redirect to login |
| Non-admin user | 403 | Spatie middleware rejection |

### Frontend Error Display

- Validation errors from Inertia's `errors` object are displayed inline below the input field in the dialog.
- The dialog remains open on validation failure so the user can correct the input.
- Flash success messages are displayed via the existing `toast` (sonner) pattern used in Show.tsx.

### Edge Cases

- **Creating a role named "admin"** — Allowed by creation logic (uniqueness prevents duplicate if admin already exists). If somehow no admin role exists, creating one is valid.
- **Renaming a role to the same name** — The `unique` rule with `ignore($this->route('role'))` allows this, so it effectively becomes a no-op rename.
- **Deleting a role that has users assigned** — Spatie handles this gracefully; users lose the role assignment. The feature does not add a user-count guard.
- **Concurrent rename/delete** — Laravel's route model binding returns 404 if the role is deleted between request and resolution. Standard behavior, no special handling needed.

---

## Testing Strategy

- **Unit tests**: Verify StoreRoleRequest and UpdateRoleNameRequest validation rules with specific examples (empty name, max-length name, duplicate name).
- **Feature/integration tests**: Test the controller actions (store, updateName, destroy) including admin protection (403 responses), successful CRUD flows, and redirect behavior.
- **Property tests**: Validate universal correctness properties (validation logic, round-trip creation, admin immutability) across generated inputs.
- **Frontend**: Example-based tests for dialog rendering, conditional action trigger visibility, and form submission behavior.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role Name Validation Correctness

*For any* input string submitted as a role name, the validation layer SHALL accept the input if and only if it is a non-empty string of at most 255 characters that does not match any existing role name (excluding the current role in rename scenarios).

**Validates: Requirements 1.2, 1.4, 1.5, 2.2, 2.4**

### Property 2: Role Creation Round-Trip

*For any* valid role name that passes validation, after the store action completes, querying the roles table SHALL return a role with that exact name.

**Validates: Requirements 1.3**

### Property 3: Role Rename Persistence

*For any* non-admin role and any valid new name, after the rename action completes, the role's name in the database SHALL equal the submitted new name.

**Validates: Requirements 2.3**

### Property 4: Role Deletion Exclusion

*For any* non-admin role that is deleted, querying the roles table SHALL no longer return that role.

**Validates: Requirements 3.2**

### Property 5: Admin Role Immutability

*For any* rename or delete request targeting the role with name "admin" (case-sensitive), the system SHALL reject the request with a 403 response and the admin role SHALL remain unchanged in the database.

**Validates: Requirements 3.4, 4.1, 4.2, 4.3**
