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
            'profit_margin' => ((float) $revenue > 0) ? (((float) $profit / (float) $revenue) * 100) : 0.0,
            'expense_breakdown' => $expenseBreakdown->map(fn (object $item): array => [
                'type' => ucfirst((string) ($item->type ?? '')),
                'total' => (isset($item->total) && is_numeric($item->total)) ? (float) $item->total : 0.0,
            ]),
        ];
    }
}
