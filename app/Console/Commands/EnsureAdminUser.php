<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\CreateUser;
use App\Models\User;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;

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
        if (! Role::query()->where('name', 'admin')->exists()) {
            $this->warn('Admin role does not exist. Creating roles and permissions...');
            $this->call('db:seed', ['--class' => 'RolePermissionSeeder', '--no-interaction' => true]);
        }
    }
}
