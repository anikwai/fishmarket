<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\User;
use Spatie\Permission\Models\Role;

final readonly class UpdateUser
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(User $user, array $attributes): void
    {
        $email = $attributes['email'] ?? null;
        $roleName = $attributes['role'] ?? null;

        // Exclude 'role' from attributes since it's handled separately via Spatie Permission
        $userAttributes = array_diff_key($attributes, ['role' => true]);

        $user->update([
            ...$userAttributes,
            ...$user->email === $email ? [] : ['email_verified_at' => null],
        ]);

        // Handle role assignment separately using Spatie Permission
        if (is_string($roleName) && $roleName !== '') {
            $role = Role::findByName($roleName);
            $user->syncRoles([$role]);
        } elseif ($roleName === '' || $roleName === null) {
            // If role is empty string or null, remove all roles
            $user->syncRoles([]);
        }
    }
}
