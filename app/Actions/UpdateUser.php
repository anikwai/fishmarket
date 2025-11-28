<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\User;
use DomainException;
use Spatie\Permission\Exceptions\RoleDoesNotExist;
use Spatie\Permission\Models\Role;

final readonly class UpdateUser
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(User $user, array $attributes): void
    {
        $email = $attributes['email'] ?? null;

        // Exclude 'role' from attributes since it's handled separately via Spatie Permission
        $userAttributes = array_diff_key($attributes, ['role' => true]);

        $user->update([
            ...$userAttributes,
            ...$user->email === $email ? [] : ['email_verified_at' => null],
        ]);

        // Handle role assignment separately using Spatie Permission
        // Only process role if the 'role' key exists in attributes (even if null/empty)
        // This distinguishes between "remove role" and "don't touch roles" (partial update)
        if (array_key_exists('role', $attributes)) {
            $roleName = $attributes['role'];

            if (is_string($roleName) && $roleName !== '') {
                try {
                    $role = Role::findByName($roleName);
                    $user->syncRoles([$role]);
                } catch (RoleDoesNotExist $e) {
                    throw new DomainException("Role '{$roleName}' does not exist.", 0, $e);
                }
            } else {
                // If role is null or empty string, remove all roles
                // (null happens due to ConvertEmptyStringsToNull middleware)
                $user->syncRoles([]);
            }
        }
        // If 'role' key doesn't exist in attributes, don't change roles (partial update)
    }
}
