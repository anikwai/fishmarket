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
        $roleName = $attributes['role'] ?? null;

        // Exclude 'role' from attributes since it's handled separately via Spatie Permission
        $userAttributes = array_diff_key($attributes, ['role' => true]);

        $user->update([
            ...$userAttributes,
            ...$user->email === $email ? [] : ['email_verified_at' => null],
        ]);

        // Handle role assignment separately using Spatie Permission
        if (is_string($roleName) && $roleName !== '') {
            try {
                $role = Role::findByName($roleName);
                $user->syncRoles([$role]);
            } catch (RoleDoesNotExist $e) {
                throw new DomainException("Role '{$roleName}' does not exist.", 0, $e);
            }
        } elseif ($roleName === '') {
            // If role is empty string, remove all roles
            $user->syncRoles([]);
        }
        // If $roleName is null, do nothing - don't change roles (partial update)
    }
}
