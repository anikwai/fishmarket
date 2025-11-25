<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

final readonly class GoogleAuthController
{
    public function redirect(): SymfonyRedirectResponse|RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        /** @var \Laravel\Socialite\Two\User $googleUser */
        $googleUser = Socialite::driver('google')->user();

        // Find user by google_id first, then by email to link existing accounts
        $user = User::query()->where('google_id', $googleUser->id)->first()
            ?? User::query()->where('email', $googleUser->email)->first();

        if ($user) {
            // Update existing user with Google data
            $user->update([
                'google_id' => $googleUser->id,
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'google_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
                'email_verified_at' => now(),
            ]);
        } else {
            // Create new user
            $user = User::query()->create([
                'google_id' => $googleUser->id,
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'google_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
                'email_verified_at' => now(),
            ]);
        }

        Auth::login($user);

        request()->session()->regenerate();

        if ($user->roles()->count() === 0) {
            return to_route('pending-access');
        }

        return to_route('dashboard');
    }
}
