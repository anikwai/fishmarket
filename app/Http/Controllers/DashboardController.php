<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\GetDashboardDataAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final readonly class DashboardController
{
    public function __construct(
        private GetDashboardDataAction $getDashboardData,
    ) {}

    public function __invoke(Request $request): Response
    {
        // Ensure user is authenticated (middleware should handle this, but double-check)
        abort_unless(auth()->check(), 403, 'Unauthorized');

        Gate::authorize('view dashboard');

        $startDate = $request->string('start_date')->isNotEmpty() ? Date::parse($request->string('start_date')->toString())->startOfDay() : null;
        $endDate = $request->string('end_date')->isNotEmpty() ? Date::parse($request->string('end_date')->toString())->endOfDay() : null;

        $data = $this->getDashboardData->handle($startDate, $endDate);

        return Inertia::render('dashboard', [
            ...$data,
            'filters' => [
                'start_date' => $startDate?->toDateString(),
                'end_date' => $endDate?->toDateString(),
            ],
        ]);
    }
}
