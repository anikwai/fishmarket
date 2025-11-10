<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

final readonly class UserEmailVerification
{
    public function update(EmailVerificationRequest $request, #[CurrentUser] User $user): RedirectResponse
    {
        if ($user->hasVerifiedEmail()) {
            // Redirect users without roles to pending access page
            if ($user->roles()->count() === 0) {
                return to_route('pending-access')->with('verified', '1');
            }

            return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
        }

        $request->fulfill();

        // Redirect users without roles to pending access page
        if ($user->roles()->count() === 0) {
            return to_route('pending-access')->with('verified', '1');
        }

        return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
    }
}
