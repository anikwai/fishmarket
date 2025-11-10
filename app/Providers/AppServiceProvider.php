<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

final class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->bootModelsDefaults();
        $this->bootPasswordDefaults();
        $this->bootAuthorization();
    }

    private function bootAuthorization(): void
    {
        // Deny all permissions for users without any roles
        // This ensures users without roles cannot access any protected areas
        Gate::before(function (?User $user, string $ability): ?bool {
            // If no user is authenticated (guest), deny all access
            if (! $user) {
                return false;
            }

            // If user has no roles, deny all access
            // Use count($user->roles) instead of $user->roles()->count() to avoid N+1 queries
            // Spatie Permission caches roles, so accessing $user->roles uses cached data
            if (count($user->roles) === 0) {
                return false;
            }

            // Admin role bypass: Users with the 'admin' role bypass all permission checks
            // This ensures admins always have full access, even if permissions change in the future
            // The 'admin' role already has all permissions assigned, but this hook provides an extra layer
            // Following Spatie Permission best practices for defining a super-admin
            if ($user->hasRole('admin')) {
                return true;
            }

            return null; // Let other gates/policies handle the authorization
        });
    }

    private function bootModelsDefaults(): void
    {
        Model::unguard();
    }

    private function bootPasswordDefaults(): void
    {
        Password::defaults(fn () => app()->isLocal() || app()->runningUnitTests() ? Password::min(12)->max(255) : Password::min(12)->max(255)->uncompromised());
    }
}
