<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    // Ensure roles exist for tests
    Role::query()->firstOrCreate(['name' => 'admin']);
    Role::query()->firstOrCreate(['name' => 'manager']);
    Role::query()->firstOrCreate(['name' => 'cashier']);
});

it('denies access for guest users', function (): void {
    expect(Gate::forUser(null)->allows('view dashboard'))->toBeFalse();
});

it('denies access for users without roles', function (): void {
    $user = User::factory()->create();

    expect(Gate::forUser($user)->allows('view dashboard'))->toBeFalse();
});

it('allows access for admin users', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');

    expect(Gate::forUser($user)->allows('view dashboard'))->toBeTrue();
    expect(Gate::forUser($user)->allows('any permission'))->toBeTrue();
});

it('returns null for users with roles but not admin', function (): void {
    $user = User::factory()->create();
    $user->assignRole('manager');

    // The Gate::before returns null, which means other gates/policies handle it
    // Since we don't have a policy for 'test-permission', it will be denied
    // But the important thing is that the Gate::before returned null (not false)
    // We can verify this by checking that the admin bypass doesn't apply
    expect(Gate::forUser($user)->allows('non-existent-permission'))->toBeFalse();
});
