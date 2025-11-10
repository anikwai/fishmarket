<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Sale;

final readonly class GenerateOutstandingCreditsReportAction
{
    /**
     * @return array<string, mixed>
     */
    public function handle(): array
    {
        $credits = Sale::query()
            ->where('is_credit', true)
            ->with(['customer', 'payments'])
            ->get()
            ->filter(fn (Sale $sale): bool => $sale->outstanding_balance > 0)
            ->map(fn (Sale $sale): array => [
                'sale_id' => $sale->id,
                'date' => $sale->sale_date->format('Y-m-d'),
                'customer' => $sale->customer->name,
                'total' => (float) $sale->total_amount,
                'paid' => (float) $sale->payments->sum('amount'), // @phpstan-ignore cast.double
                'outstanding' => (float) $sale->outstanding_balance,
                'days_outstanding' => $sale->sale_date->diffInDays(now()),
            ])
            ->sortByDesc('days_outstanding')
            ->values();

        return [
            'credits' => $credits,
            'summary' => [
                'total_outstanding' => $credits->sum(fn (array $credit): float => $credit['outstanding']),
                'count' => $credits->count(),
                'average_days' => $credits->count() > 0
                    ? round((float) $credits->avg('days_outstanding'), 1)
                    : 0.0,
            ],
        ];
    }
}
