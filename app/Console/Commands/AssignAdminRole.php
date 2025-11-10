<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

final class AssignAdminRole extends Command
{
    protected $signature = 'users:assign-admin {email? : The email of the user to assign admin role}';

    protected $description = 'Assign admin role to a user (or all users if no email provided)';

    public function handle(): int
    {
        $adminRole = Role::findByName('admin');

        $email = $this->argument('email');

        if ($email) {
            $user = User::query()->where('email', $email)->first();

            if (! $user) {
                $this->error("User with email {$email} not found.");

                return self::FAILURE;
            }

            $user->assignRole($adminRole);
            $this->info("Admin role assigned to {$user->email}.");

            return self::SUCCESS;
        }

        // Assign to all users if no email provided
        $users = User::all();

        if ($users->isEmpty()) {
            $this->warn('No users found.');

            return self::SUCCESS;
        }

        foreach ($users as $user) {
            $user->assignRole($adminRole);
            $this->info("Admin role assigned to {$user->email}.");
        }

        $this->info('Admin role assigned to all users.');

        return self::SUCCESS;
    }
}
