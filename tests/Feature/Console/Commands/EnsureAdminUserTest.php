<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    // Ensure roles exist for tests
    Role::query()->firstOrCreate(['name' => 'admin']);
    Role::query()->firstOrCreate(['name' => 'manager']);
    Role::query()->firstOrCreate(['name' => 'cashier']);
});

it('creates an admin user when none exists', function (): void {
    Artisan::call('users:ensure-admin', [
        '--email' => 'admin@example.com',
        '--name' => 'Admin User',
        '--password' => 'password123',
    ]);

    $output = Artisan::output();

    expect(User::role('admin')->count())->toBe(1)
        ->and(User::query()->where('email', 'admin@example.com')->first())
        ->not->toBeNull()
        ->and(User::query()->where('email', 'admin@example.com')->first()->hasRole('admin'))->toBeTrue()
        ->and($output)->toContain('Admin user created successfully');
});

it('does not create duplicate admin when one already exists', function (): void {
    $existingAdmin = User::factory()->create([
        'email' => 'existing@example.com',
        'name' => 'Existing Admin',
    ]);
    $existingAdmin->assignRole('admin');

    Artisan::call('users:ensure-admin', [
        '--email' => 'newadmin@example.com',
        '--name' => 'New Admin',
        '--password' => 'password123',
    ]);

    $output = Artisan::output();

    expect(User::role('admin')->count())->toBe(1)
        ->and(User::query()->where('email', 'newadmin@example.com')->exists())->toBeFalse()
        ->and($output)->toContain('Admin user(s) already exist')
        ->and($output)->toContain('existing@example.com');
});

it('validates email format', function (): void {
    Artisan::call('users:ensure-admin', [
        '--email' => 'invalid-email',
        '--name' => 'Admin User',
        '--password' => 'password123',
    ]);

    expect(User::role('admin')->count())->toBe(0);
});

it('validates password minimum length', function (): void {
    Artisan::call('users:ensure-admin', [
        '--email' => 'admin@example.com',
        '--name' => 'Admin User',
        '--password' => 'short',
    ]);

    expect(User::role('admin')->count())->toBe(0);
});

it('validates unique email', function (): void {
    User::factory()->create([
        'email' => 'existing@example.com',
    ]);

    Artisan::call('users:ensure-admin', [
        '--email' => 'existing@example.com',
        '--name' => 'Admin User',
        '--password' => 'password123',
    ]);

    expect(User::role('admin')->count())->toBe(0);
});

it('creates admin role if it does not exist', function (): void {
    Role::query()->where('name', 'admin')->delete();

    Artisan::call('users:ensure-admin', [
        '--email' => 'admin@example.com',
        '--name' => 'Admin User',
        '--password' => 'password123',
    ]);

    expect(Role::query()->where('name', 'admin')->exists())->toBeTrue()
        ->and(User::role('admin')->count())->toBe(1);
});
