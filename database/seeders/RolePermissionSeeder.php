<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

final class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Dashboard
            'view dashboard',

            // Suppliers
            'view suppliers',
            'create suppliers',
            'update suppliers',
            'delete suppliers',

            // Customers
            'view customers',
            'create customers',
            'update customers',
            'delete customers',

            // Purchases
            'view purchases',
            'create purchases',
            'update purchases',
            'delete purchases',

            // Sales
            'view sales',
            'create sales',
            'update sales',
            'delete sales',
            'download sales receipts',
            'email sales receipts',

            // Expenses
            'view expenses',
            'create expenses',
            'update expenses',
            'delete expenses',

            // Payments
            'view payments',
            'create payments',
            'update payments',
            'delete payments',

            // Receipts
            'view receipts',
            'download receipts',
            'email receipts',
            'void receipts',
            'reissue receipts',

            // Reports
            'view reports',
            'export reports',

            // Users
            'view users',
            'create users',
            'update users',
            'delete users',
        ];

        foreach ($permissions as $permission) {
            Permission::query()->firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions

        // Admin - Full access
        $admin = Role::query()->firstOrCreate(['name' => 'admin']);
        $admin->givePermissionTo(Permission::all());

        // Manager - Can manage operations but not users
        $manager = Role::query()->firstOrCreate(['name' => 'manager']);
        $manager->givePermissionTo([
            'view dashboard',
            'view suppliers',
            'create suppliers',
            'update suppliers',
            'delete suppliers',
            'view customers',
            'create customers',
            'update customers',
            'delete customers',
            'view purchases',
            'create purchases',
            'update purchases',
            'delete purchases',
            'view sales',
            'create sales',
            'update sales',
            'delete sales',
            'download sales receipts',
            'email sales receipts',
            'view expenses',
            'create expenses',
            'update expenses',
            'delete expenses',
            'view payments',
            'create payments',
            'update payments',
            'delete payments',
            'view receipts',
            'download receipts',
            'email receipts',
            'void receipts',
            'reissue receipts',
            'view reports',
            'export reports',
        ]);

        // Cashier - Can create sales and view limited data
        $cashier = Role::query()->firstOrCreate(['name' => 'cashier']);
        $cashier->givePermissionTo([
            'view dashboard',
            'view customers',
            'create customers',
            'view sales',
            'create sales',
            'update sales',
            'download sales receipts',
            'email sales receipts',
            'view payments',
            'create payments',
            'view receipts',
            'download receipts',
            'email receipts',
        ]);
    }
}
