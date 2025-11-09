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
            ->with('purchase.supplier')
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
            'expenses' => $expenses->map(fn ($expense) => [
                'id' => $expense->id,
                'date' => $expense->expense_date->format('Y-m-d'),
                'type' => ucfirst($expense->type),
                'description' => $expense->description,
                'amount' => $expense->amount,
                'supplier' => $expense->purchase?->supplier?->name,
            ]),
            'breakdown' => $breakdown->map(fn ($item) => [
                'type' => ucfirst($item->type),
                'total' => (float) $item->total,
            ]),
            'daily_data' => $dailyData->map(fn ($item) => [
                'date' => $item->date,
                'total' => (float) $item->total,
            ]),
            'summary' => [
                'total' => $expenses->sum('amount'),
                'count' => $expenses->count(),
            ],
        ];
    }
}
