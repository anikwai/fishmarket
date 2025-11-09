<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\GetDashboardDataAction;
use Inertia\Inertia;
use Inertia\Response;

final readonly class DashboardController
{
    public function __construct(
        private GetDashboardDataAction $getDashboardData,
    ) {}

    public function __invoke(): Response
    {
        $data = $this->getDashboardData->handle();

        return Inertia::render('dashboard', $data);
    }
}
