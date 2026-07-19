<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Migrates existing string-based roles to Spatie Laravel Permission system.
     * Creates predefined permissions, roles, and assigns them accordingly.
     * Retains legacy `role` column for backward compatibility.
     */
    public function run(): void
    {
        // 1. Create permissions
        $permissions = [
            'manage-users',
            'manage-roles',
            'view-dashboard',
            'manage-clients',
            'manage-job-categories',
            'manage-services',
            'manage-work-reports',
            'manage-bap',
            'manage-bast',
            'manage-invoices',
            'manage-company-settings',
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
        // The legacy `role` column is retained for backward compatibility
        User::whereNotNull('role')->each(function (User $user) {
            $user->assignRole($user->role);
        });
    }
}
