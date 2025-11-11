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

        // Get credentials from options, config (via environment variables), or prompt
        $email = $this->option('email') ?: config('admin.email');
        $name = $this->option('name') ?: config('admin.name');
        $password = $this->option('password') ?: config('admin.password');

        // Check if running in non-interactive mode
        $isNonInteractive = $this->option('no-interaction') || ! $this->input->isInteractive();

        // If not provided via options or environment, prompt interactively (only if interactive)
        if (! $email) {
            if ($isNonInteractive) {
                $this->error('Admin email is required. Provide --email option or set ADMIN_EMAIL in your .env file.');

                return self::FAILURE;
            }
            $email = $this->ask('Admin email address');
        }

        if (! $name) {
            if ($isNonInteractive) {
                $this->error('Admin name is required. Provide --name option or set ADMIN_NAME in your .env file.');

                return self::FAILURE;
            }
            $name = $this->ask('Admin name');
        }

        if (! $password) {
            if ($isNonInteractive) {
                $this->error('Admin password is required. Provide --password option or set ADMIN_PASSWORD in your .env file.');

                return self::FAILURE;
            }
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

        // Check if roles need to be created
        $adminExists = Role::query()->where('name', 'admin')->exists();
        $managerExists = Role::query()->where('name', 'manager')->exists();
        $cashierExists = Role::query()->where('name', 'cashier')->exists();

        if (! $adminExists || ! $managerExists || ! $cashierExists) {
            $this->warn('Roles do not exist. Creating roles and permissions...');
            $this->ensureRolesExist();
            $this->info('Roles created successfully.');
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

    private function ensureRolesExist(): void
    {
        // Admin - Full access
        $admin = Role::query()->firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions(Permission::all());

        // Manager - Can manage operations but not users
        $manager = Role::query()->firstOrCreate(['name' => 'manager']);
        $manager->syncPermissions([
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
        $cashier->syncPermissions([
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
