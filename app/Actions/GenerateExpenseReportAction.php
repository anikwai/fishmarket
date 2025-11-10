<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Expense;
use Illuminate\Support\Facades\DB;

final readonly class GenerateExpenseReportAction
{
    /**
     * @return array<string, mixed>
     */
    public function handle(string $startDate, string $endDate): array
    {
        $expenses = Expense::query()
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->with(['purchase.supplier'])
            ->orderBy('expense_date', 'desc')
            ->get();

        $breakdown = Expense::query()
            ->select('type', DB::raw('SUM(amount) as total'))
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupBy('type')
            ->get();

        $dailyData = Expense::query()
            ->selectRaw('expense_date::date as date')
            ->selectRaw('SUM(amount) as total')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupByRaw('expense_date::date')
            ->orderBy('date')
            ->get();

        return [
            'expenses' => $expenses->map(fn (Expense $expense): array => [
                'id' => $expense->id,
                'date' => $expense->expense_date->format('Y-m-d'),
                'type' => ucfirst((string) $expense->type),
                'description' => $expense->description,
                'amount' => (float) $expense->amount,
                'supplier' => $expense->purchase?->supplier?->name,
            ]),
            'breakdown' => $breakdown->map(fn (object $item): array => [
                'type' => ucfirst((string) ($item->type ?? '')),
                'total' => (isset($item->total) && is_numeric($item->total)) ? (float) $item->total : 0.0,
            ]),
            'daily_data' => $dailyData->map(fn (object $item): array => [
                'date' => $item->date ?? '',
                'total' => (isset($item->total) && is_numeric($item->total)) ? (float) $item->total : 0.0,
            ]),
            'summary' => [
                'total' => (float) $expenses->sum('amount'), // @phpstan-ignore cast.double
                'count' => $expenses->count(),
            ],
        ];
    }
}
