<?php

declare(strict_types=1);

use App\Actions\CreateUser;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    // Ensure roles exist for tests
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'manager']);
    Role::firstOrCreate(['name' => 'cashier']);
});

it('may create a user', function (): void {
    Event::fake([Registered::class]);

    $action = app(CreateUser::class);

    $user = $action->handle([
        'name' => 'Test User',
        'email' => 'example@email.com',
    ], 'password');

    expect($user)->toBeInstanceOf(User::class)
        ->and($user->name)->toBe('Test User')
        ->and($user->email)->toBe('example@email.com')
        ->and($user->password)->not->toBe('password');

    Event::assertDispatched(Registered::class);
});

it('assigns role when role name is provided', function (): void {
    Event::fake([Registered::class]);

    $action = app(CreateUser::class);

    $user = $action->handle([
        'name' => 'Test User',
        'email' => 'example@email.com',
    ], 'password', 'admin');

    expect($user->refresh()->hasRole('admin'))->toBeTrue();

    Event::assertDispatched(Registered::class);
});

it('does not assign role when role name is null', function (): void {
    Event::fake([Registered::class]);

    $action = app(CreateUser::class);

    $user = $action->handle([
        'name' => 'Test User',
        'email' => 'example@email.com',
    ], 'password', null);

    expect($user->refresh()->roles()->count())->toBe(0);

    Event::assertDispatched(Registered::class);
});

it('does not assign role when role name is empty string', function (): void {
    Event::fake([Registered::class]);

    $action = app(CreateUser::class);

    $user = $action->handle([
        'name' => 'Test User',
        'email' => 'example@email.com',
    ], 'password', '');

    expect($user->refresh()->roles()->count())->toBe(0);

    Event::assertDispatched(Registered::class);
});
