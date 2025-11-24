<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $emailConfig = config('admin_user.email', 'admin@example.com');
        $passwordConfig = config('admin_user.password', 'password');
        $email = is_string($emailConfig) ? $emailConfig : 'admin@example.com';
        $password = is_string($passwordConfig) ? $passwordConfig : 'password';

        /** @var User $user */
        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin User',
                'email_verified_at' => now(),
                'password' => Hash::make($password),
                'remember_token' => Str::random(10),
            ],
        );

        if (! $user->hasRole('admin')) {
            $user->assignRole('admin');
        }
    }
}
