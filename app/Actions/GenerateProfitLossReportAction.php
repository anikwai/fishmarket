<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Expense;
use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

final readonly class GenerateProfitLossReportAction
{
    /**
     * @return array<string, mixed>
     */
    public function handle(string $startDate, string $endDate): array
    {
        $revenue = Sale::query()
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->sum('total_amount');

        $costs = Purchase::query()
            ->whereBetween('purchase_date', [$startDate, $endDate])
            ->sum('total_cost');

        $expenses = Expense::query()
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        $profit = $revenue - $costs - $expenses;

        $expenseBreakdown = Expense::query()
            ->select('type', DB::raw('SUM(amount) as total'))
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupBy('type')
            ->get();

        return [
            'revenue' => (float) $revenue,
            'costs' => (float) $costs,
            'expenses' => (float) $expenses,
            'profit' => (float) $profit,
            'profit_margin' => $revenue > 0 ? (($profit / $revenue) * 100) : 0,
            'expense_breakdown' => $expenseBreakdown->map(fn ($item): array => [
                'type' => ucfirst((string) $item->type),
                'total' => (float) $item->total,
            ]),
        ];
    }
}
