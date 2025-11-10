<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\GetDashboardDataAction;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final readonly class DashboardController
{
    public function __construct(
        private GetDashboardDataAction $getDashboardData,
    ) {}

    public function __invoke(): Response
    {
        // Ensure user is authenticated (middleware should handle this, but double-check)
        abort_unless(auth()->check(), 403, 'Unauthorized');

        Gate::authorize('view dashboard');

        $data = $this->getDashboardData->handle();

        return Inertia::render('dashboard', $data);
    }
}
