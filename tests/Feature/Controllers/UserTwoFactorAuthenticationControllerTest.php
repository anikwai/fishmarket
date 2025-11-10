<?php

declare(strict_types=1);

use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    // Ensure roles exist for tests
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'manager']);
    Role::firstOrCreate(['name' => 'cashier']);
});

it('renders two factor authentication page', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $response = $this->fromRoute('dashboard')
        ->get(route('two-factor.show'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('user-two-factor-authentication/show')
            ->has('twoFactorEnabled'));
});

it('shows two factor disabled when not enabled', function (): void {
    $user = User::factory()->withoutTwoFactor()->create();
    $user->assignRole('admin');

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $response = $this->fromRoute('dashboard')
        ->get(route('two-factor.show'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('user-two-factor-authentication/show')
            ->where('twoFactorEnabled', false));
});

it('shows two factor enabled when enabled', function (): void {
    $user = User::factory()->create([
        'two_factor_secret' => encrypt('secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => now(),
    ]);
    $user->assignRole('admin');

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $response = $this->fromRoute('dashboard')
        ->get(route('two-factor.show'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('user-two-factor-authentication/show')
            ->where('twoFactorEnabled', true));
});
