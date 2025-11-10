<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use SensitiveParameter;
use Spatie\Permission\Models\Role;

final readonly class CreateUser
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(array $attributes, #[SensitiveParameter] string $password, ?string $roleName = null): User
    {
        $user = User::query()->create([
            ...$attributes,
            'password' => Hash::make($password),
        ]);

        event(new Registered($user));

        // Handle role assignment if provided
        if ($roleName !== null) {
            $role = Role::findByName($roleName);
            $user->assignRole($role);
        }

        return $user;
    }
}
