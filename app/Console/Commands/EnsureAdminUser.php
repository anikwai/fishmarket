<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\CreateUser;
use App\Models\User;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class EnsureAdminUser extends Command
{
    protected $signature = 'users:ensure-admin {--email= : Admin user email} {--name= : Admin user name} {--password= : Admin user password}';

    protected $description = 'Ensure at least one admin user exists in the database';

    public function handle(CreateUser $createUser): int
    {
        // Ensure admin role exists
        $this->ensureAdminRoleExists();

        // Check if any admin users exist
        $adminUsers = User::role('admin')->get();

        if ($adminUsers->isNotEmpty()) {
            $this->info('Admin user(s) already exist:');
            foreach ($adminUsers as $user) {
                $this->line("  - {$user->email} ({$user->name})");
            }

            return self::SUCCESS;
        }

        $this->warn('No admin users found. Creating one...');

        // Get credentials from options or prompt
        $email = $this->option('email');
        $name = $this->option('name');
        $password = $this->option('password');

        // If not provided via options or config, prompt interactively
        if (! $email) {
            $email = $this->ask('Admin email address');
        }

        if (! $name) {
            $name = $this->ask('Admin name');
        }

        if (! $password) {
            $password = $this->secret('Admin password');
            $passwordConfirmation = $this->secret('Confirm admin password');

            if ($password !== $passwordConfirmation) {
                $this->error('Passwords do not match.');

                return self::FAILURE;
            }
        }

        // Validate input
        $validator = Validator::make([
            'email' => $email,
            'name' => $name,
            'password' => $password,
        ], [
            'email' => ['required', 'email', 'unique:users,email'],
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        // Get validated data with proper types
        $validated = $validator->validated();
        /** @var array{email: string, name: string, password: string} $validated */
        $email = $validated['email'];
        $name = $validated['name'];
        $password = $validated['password'];

        // Create admin user
        try {
            $user = $createUser->handle(
                [
                    'name' => $name,
                    'email' => $email,
                ],
                $password,
                'admin'
            );

            $this->info("Admin user created successfully: {$user->email}");

            return self::SUCCESS;
        } catch (Exception $e) {
            $this->error("Failed to create admin user: {$e->getMessage()}");

            return self::FAILURE;
        }
    }

    private function ensureAdminRoleExists(): void
    {
        // Reset cached roles and permissions
        app()->make(PermissionRegistrar::class)->forgetCachedPermissions();

        // Ensure all permissions exist
        $this->ensurePermissionsExist();

        // Ensure admin role exists
        if (! Role::query()->where('name', 'admin')->exists()) {
            $this->warn('Admin role does not exist. Creating admin role...');

            // Create admin role directly
            $adminRole = Role::query()->firstOrCreate(['name' => 'admin']);

            // Assign all permissions to admin role
            $permissions = Permission::all();
            if ($permissions->isNotEmpty()) {
                $adminRole->syncPermissions($permissions);
            }

            $this->info('Admin role created successfully.');
        } else {
            // Ensure admin role has all permissions (in case permissions were added later)
            $adminRole = Role::query()->where('name', 'admin')->first();
            if ($adminRole !== null) {
                $permissions = Permission::all();
                if ($permissions->isNotEmpty()) {
                    $adminRole->syncPermissions($permissions);
                }
            }
        }
    }

    private function ensurePermissionsExist(): void
    {
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
    }
}
