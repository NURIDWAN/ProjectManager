<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleNameRequest;
use App\Http\Requests\UpdateRoleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Display a listing of roles with permissions count.
     */
    public function index(): Response
    {
        $roles = Role::withCount('permissions')->get();

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
        ]);
    }

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
     * Display the specified role with all permissions.
     */
    public function show(Role $role): Response
    {
        $role->load('permissions');

        $allPermissions = Permission::all();

        return Inertia::render('Roles/Show', [
            'role' => $role,
            'allPermissions' => $allPermissions,
        ]);
    }

    /**
     * Update the permissions for the specified role.
     */
    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $role->syncPermissions($request->permissions);

        return Redirect::route('roles.show', $role)
            ->with('success', 'Permissions berhasil diperbarui.');
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
