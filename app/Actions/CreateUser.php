<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\User;
use DomainException;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use SensitiveParameter;
use Spatie\Permission\Exceptions\RoleDoesNotExist;
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
        if ($roleName !== null && $roleName !== '') {
            try {
                $role = Role::findByName($roleName);
                $user->assignRole($role);
            } catch (RoleDoesNotExist $e) {
                throw new DomainException("Role '{$roleName}' does not exist.", 0, $e);
            }
        }

        return $user;
    }
}
