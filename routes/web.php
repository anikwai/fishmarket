<?php

declare(strict_types=1);

use App\Http\Controllers\SessionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserEmailResetNotification;
use App\Http\Controllers\UserEmailVerification;
use App\Http\Controllers\UserEmailVerificationNotificationController;
use App\Http\Controllers\UserPasswordController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\UserTwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('s/purchases/{purchase}/invoice', [App\Http\Controllers\PurchaseController::class, 'printInvoice'])
    ->name('purchases.invoice.print')
    ->middleware('signed');

Route::get('/', [SessionController::class, 'create'])->name('home');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('dashboard', App\Http\Controllers\DashboardController::class)->name('dashboard');

    Route::resource('suppliers', App\Http\Controllers\SupplierController::class)->except(['create', 'edit', 'show']);
    Route::resource('customers', App\Http\Controllers\CustomerController::class)->except(['create', 'edit', 'show']);
    Route::resource('sales', App\Http\Controllers\SaleController::class)->except(['create', 'edit', 'show']);
    Route::get('sales/{sale}/receipt/download', [App\Http\Controllers\SaleController::class, 'downloadReceipt'])->name('sales.receipt.download');
    Route::post('sales/{sale}/receipt/email', [App\Http\Controllers\SaleController::class, 'sendReceiptEmail'])->name('sales.receipt.email');

    Route::resource('purchases', App\Http\Controllers\PurchaseController::class)->except(['create', 'edit', 'show']);
    Route::get('purchases/{purchase}/invoice/download', [App\Http\Controllers\PurchaseController::class, 'downloadInvoice'])->name('purchases.invoice.download');
    Route::get('purchases/{purchase}/invoice/link', [App\Http\Controllers\PurchaseController::class, 'generateInvoiceLink'])->name('purchases.invoice.link');
    Route::post('purchases/{purchase}/invoice/email', [App\Http\Controllers\PurchaseController::class, 'sendInvoiceEmail'])->name('purchases.invoice.email');

    Route::resource('expenses', App\Http\Controllers\ExpenseController::class)->except(['create', 'edit', 'show']);
    Route::resource('payments', App\Http\Controllers\PaymentController::class)->except(['create', 'edit', 'show']);
    Route::resource('receipts', App\Http\Controllers\ReceiptController::class)->only(['index']);
    Route::get('reports', [App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/export', [App\Http\Controllers\ReportController::class, 'export'])->name('reports.export');

    Route::get('receipts/{receipt}/download', [App\Http\Controllers\ReceiptController::class, 'download'])->name('receipts.download');
    Route::post('receipts/{receipt}/email', [App\Http\Controllers\ReceiptController::class, 'sendEmail'])->name('receipts.email');
    Route::post('receipts/{receipt}/void', [App\Http\Controllers\ReceiptController::class, 'void'])->name('receipts.void');
    Route::post('receipts/{receipt}/reissue', [App\Http\Controllers\ReceiptController::class, 'reissue'])->name('receipts.reissue');

    // User Management (Admin only)
    Route::resource('users', UserController::class)->except(['create', 'store']);
    Route::post('users', [UserController::class, 'storeAdmin'])->name('users.store');
});

Route::middleware('auth')->group(function (): void {
    // Pending Access Page (for users without roles)
    Route::get('pending-access', function () {
        if (auth()->user()->roles()->exists()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('pending-access');
    })->name('pending-access');

    // User deleting themselves...
    Route::delete('user', [UserController::class, 'destroySelf'])->name('user.destroy');

    // User Profile...
    Route::redirect('settings', '/settings/profile');
    Route::get('settings/profile', [UserProfileController::class, 'edit'])->name('user-profile.edit');
    Route::patch('settings/profile', [UserProfileController::class, 'update'])->name('user-profile.update');

    // User Password...
    Route::get('settings/password', [UserPasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [UserPasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.update');

    // Appearance...
    Route::get('settings/appearance', fn () => Inertia::render('appearance/update'))->name('appearance.edit');

    // User Two-Factor Authentication...
    Route::get('settings/two-factor', [UserTwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');
});

Route::middleware('guest')->group(function (): void {
    // User...
    Route::get('register', [UserController::class, 'create'])
        ->name('register');
    Route::post('register', [UserController::class, 'store'])
        ->name('register.store');

    // User Password...
    Route::get('reset-password/{token}', [UserPasswordController::class, 'create'])
        ->name('password.reset');
    Route::post('reset-password', [UserPasswordController::class, 'store'])
        ->name('password.store');

    // User Email Reset Notification...
    Route::get('forgot-password', [UserEmailResetNotification::class, 'create'])
        ->name('password.request');
    Route::post('forgot-password', [UserEmailResetNotification::class, 'store'])
        ->name('password.email');

    // Session...
    Route::get('login', [SessionController::class, 'create'])
        ->name('login');
    Route::post('login', [SessionController::class, 'store'])
        ->name('login.store');

    // Google OAuth...
    Route::get('auth/google/redirect', [App\Http\Controllers\GoogleAuthController::class, 'redirect'])
        ->name('google.redirect');
    Route::get('auth/google/callback', [App\Http\Controllers\GoogleAuthController::class, 'callback'])
        ->name('google.callback');
});

Route::middleware('auth')->group(function (): void {
    // User Email Verification...
    Route::get('verify-email', [UserEmailVerificationNotificationController::class, 'create'])
        ->name('verification.notice');
    Route::post('email/verification-notification', [UserEmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    // User Email Verification...
    Route::get('verify-email/{id}/{hash}', [UserEmailVerification::class, 'update'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    // Session...
    Route::post('logout', [SessionController::class, 'destroy'])
        ->name('logout');
});
