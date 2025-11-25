<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\assertDatabaseHas;

beforeEach(function (): void {
    Role::query()->firstOrCreate(['name' => 'admin']);
});

test('it redirects to Google OAuth', function (): void {
    $response = $this->get(route('google.redirect'));

    $response->assertRedirect();
});

test('it creates new user from Google callback', function (): void {
    $googleUser = new SocialiteUser;
    $googleUser->id = '123456789';
    $googleUser->name = 'John Doe';
    $googleUser->email = 'john@example.com';
    $googleUser->token = 'mock-token';
    $googleUser->refreshToken = 'mock-refresh-token';

    Socialite::shouldReceive('driver->user')
        ->once()
        ->andReturn($googleUser);

    $response = $this->get(route('google.callback'));

    $response->assertRedirectToRoute('pending-access');

    assertDatabaseHas('users', [
        'google_id' => '123456789',
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);

    expect(Auth::check())->toBeTrue();

    $user = User::query()->where('google_id', '123456789')->first();
    expect($user->email_verified_at)->not->toBeNull();
});

test('it updates existing user from Google callback', function (): void {
    $existingUser = User::factory()->withoutTwoFactor()->create([
        'google_id' => '123456789',
        'name' => 'Old Name',
        'email' => 'old@example.com',
    ]);

    $googleUser = new SocialiteUser;
    $googleUser->id = '123456789';
    $googleUser->name = 'New Name';
    $googleUser->email = 'new@example.com';
    $googleUser->token = 'new-mock-token';
    $googleUser->refreshToken = 'new-mock-refresh-token';

    Socialite::shouldReceive('driver->user')
        ->once()
        ->andReturn($googleUser);

    $response = $this->get(route('google.callback'));

    $response->assertRedirectToRoute('pending-access');

    $existingUser->refresh();
    expect($existingUser->name)->toBe('New Name');
    expect($existingUser->email)->toBe('new@example.com');
    expect(Auth::id())->toBe($existingUser->id);
});

test('it redirects to dashboard when user has roles', function (): void {
    $existingUser = User::factory()->withoutTwoFactor()->create([
        'google_id' => '987654321',
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
    ]);
    $existingUser->assignRole('admin');

    $googleUser = new SocialiteUser;
    $googleUser->id = '987654321';
    $googleUser->name = 'Jane Doe';
    $googleUser->email = 'jane@example.com';
    $googleUser->token = 'mock-token';
    $googleUser->refreshToken = 'mock-refresh-token';

    Socialite::shouldReceive('driver->user')
        ->once()
        ->andReturn($googleUser);

    $response = $this->get(route('google.callback'));

    $response->assertRedirectToRoute('dashboard');
});

test('it links Google account to existing user with same email', function (): void {
    $existingUser = User::factory()->withoutTwoFactor()->create([
        'google_id' => null,
        'name' => 'Existing User',
        'email' => 'existing@example.com',
    ]);

    $googleUser = new SocialiteUser;
    $googleUser->id = '111222333';
    $googleUser->name = 'Google User';
    $googleUser->email = 'existing@example.com';
    $googleUser->token = 'google-token';
    $googleUser->refreshToken = 'google-refresh-token';

    Socialite::shouldReceive('driver->user')
        ->once()
        ->andReturn($googleUser);

    $response = $this->get(route('google.callback'));

    $response->assertRedirectToRoute('pending-access');

    // Should only have one user in database
    expect(User::query()->count())->toBe(1);

    // Existing user should be updated with Google data
    $existingUser->refresh();
    expect($existingUser->google_id)->toBe('111222333');
    expect($existingUser->name)->toBe('Google User');
    expect($existingUser->email)->toBe('existing@example.com');
    expect($existingUser->google_token)->toBe('google-token');
    expect($existingUser->google_refresh_token)->toBe('google-refresh-token');
    expect($existingUser->email_verified_at)->not->toBeNull();
    expect(Auth::id())->toBe($existingUser->id);
});
