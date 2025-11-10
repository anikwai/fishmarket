<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Expense;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Supplier;
use App\Support\Stock;
use Illuminate\Support\Facades\DB;

final readonly class GetDashboardDataAction
{
    /**
     * @return array<string, mixed>
     */
    public function handle(): array
    {
        $currentStock = Stock::current();
        $recentSales = Sale::query()
            ->with('customer')
            ->latest()
            ->limit(10)
            ->get();

        $outstandingCredits = Sale::query()
            ->where('is_credit', true)
            ->with(['customer', 'payments'])
            ->get()
            ->filter(fn (Sale $sale): bool => $sale->outstanding_balance > 0)
            ->map(fn (Sale $sale): array => [
                'sale_id' => $sale->id,
                'customer' => $sale->customer->name,
                'total' => (float) $sale->total_amount,
                'paid' => (float) $sale->payments->sum('amount'), // @phpstan-ignore cast.double
                'outstanding' => (float) $sale->outstanding_balance,
            ])
            ->values();

        // Sales revenue over last 6 months
        $salesRevenueData = Sale::query()
            ->selectRaw("TO_CHAR(sale_date, 'YYYY-MM') as month")
            ->selectRaw('SUM(total_amount) as revenue')
            ->selectRaw('COUNT(*) as count')
            ->where('sale_date', '>=', now()->subMonths(6)->startOfMonth())
            ->groupByRaw("TO_CHAR(sale_date, 'YYYY-MM')")
            ->orderBy('month')
            ->get()
            ->map(fn (object $item): array => [
                'month' => $item->month ?? '',
                'revenue' => (isset($item->revenue) && is_numeric($item->revenue)) ? (float) $item->revenue : 0.0,
                'count' => (isset($item->count) && is_numeric($item->count)) ? (int) $item->count : 0,
            ]);

        // Purchases cost over last 6 months
        $purchasesCostData = Purchase::query()
            ->selectRaw("TO_CHAR(purchase_date, 'YYYY-MM') as month")
            ->selectRaw('SUM(total_cost) as cost')
            ->selectRaw('SUM(quantity_kg) as quantity')
            ->where('purchase_date', '>=', now()->subMonths(6)->startOfMonth())
            ->groupByRaw("TO_CHAR(purchase_date, 'YYYY-MM')")
            ->orderBy('month')
            ->get()
            ->map(fn (object $item): array => [
                'month' => $item->month ?? '',
                'cost' => (isset($item->cost) && is_numeric($item->cost)) ? (float) $item->cost : 0.0,
                'quantity' => (isset($item->quantity) && is_numeric($item->quantity)) ? (float) $item->quantity : 0.0,
            ]);

        // Combine sales and purchases data for comparison chart
        $monthlyComparison = collect(range(0, 5))
            ->map(fn (int $i): string => now()->subMonths($i)->format('Y-m'))
            ->reverse()
            ->map(function (string $month) use ($salesRevenueData, $purchasesCostData): array {
                $sales = $salesRevenueData->firstWhere('month', $month);
                $purchases = $purchasesCostData->firstWhere('month', $month);

                $revenue = is_array($sales) ? (float) $sales['revenue'] : 0.0;
                $cost = is_array($purchases) ? (float) $purchases['cost'] : 0.0;

                return [
                    'month' => date('M Y', (int) strtotime($month.'-01')),
                    'revenue' => $revenue,
                    'cost' => $cost,
                ];
            });

        // Expense breakdown by type
        $expenseBreakdown = Expense::query()
            ->select('type', DB::raw('SUM(amount) as total'))
            ->groupBy('type')
            ->get()
            ->map(fn (object $item): array => [
                'type' => ucfirst((string) ($item->type ?? '')),
                'total' => (isset($item->total) && is_numeric($item->total)) ? (float) $item->total : 0.0,
            ]);

        // Daily sales for last 30 days
        $dailySalesData = Sale::query()
            ->selectRaw('sale_date::date as date')
            ->selectRaw('SUM(total_amount) as revenue')
            ->selectRaw('SUM(quantity_kg) as quantity')
            ->where('sale_date', '>=', now()->subDays(30))
            ->groupByRaw('sale_date::date')
            ->orderBy('date')
            ->get()
            ->map(fn (object $item): array => [
                'date' => $item->date ?? '',
                'revenue' => (isset($item->revenue) && is_numeric($item->revenue)) ? (float) $item->revenue : 0.0,
                'quantity' => (isset($item->quantity) && is_numeric($item->quantity)) ? (float) $item->quantity : 0.0,
            ]);

        // Summary statistics
        $totalRevenue = Sale::query()->sum('total_amount');
        $totalCosts = Purchase::query()->sum('total_cost');
        $totalExpenses = Expense::query()->sum('amount');
        $netProfit = $totalRevenue - $totalCosts - $totalExpenses;

        $thisMonthRevenue = Sale::query()
            ->where('sale_date', '>=', now()->startOfMonth())
            ->sum('total_amount');

        $thisMonthCosts = Purchase::query()
            ->where('purchase_date', '>=', now()->startOfMonth())
            ->sum('total_cost');

        $thisMonthExpenses = Expense::query()
            ->where('expense_date', '>=', now()->startOfMonth())
            ->sum('amount');

        $thisMonthProfit = $thisMonthRevenue - $thisMonthCosts - $thisMonthExpenses;

        $totalSales = Sale::query()->count();
        $totalPurchases = Purchase::query()->count();
        $totalCustomers = \App\Models\Customer::query()->count();
        $totalSuppliers = Supplier::query()->count();

        // Supplier stock breakdown for pie chart
        $supplierStockData = Supplier::query()
            ->get()
            ->map(fn (Supplier $supplier): array => [
                'name' => $supplier->name,
                'value' => (float) $supplier->remaining_stock,
            ])
            ->filter(fn (array $item): bool => $item['value'] > 0)
            ->values()
            ->all();

        return [
            'currentStock' => $currentStock,
            'recentSales' => $recentSales,
            'outstandingCredits' => $outstandingCredits,
            'monthlyComparison' => $monthlyComparison,
            'expenseBreakdown' => $expenseBreakdown,
            'dailySalesData' => $dailySalesData,
            'supplierStockData' => $supplierStockData,
            'summary' => [
                'totalRevenue' => (float) $totalRevenue,
                'totalCosts' => (float) $totalCosts,
                'totalExpenses' => (float) $totalExpenses,
                'netProfit' => (float) $netProfit,
                'thisMonthRevenue' => (float) $thisMonthRevenue,
                'thisMonthCosts' => (float) $thisMonthCosts,
                'thisMonthExpenses' => (float) $thisMonthExpenses,
                'thisMonthProfit' => (float) $thisMonthProfit,
                'totalSales' => (int) $totalSales,
                'totalPurchases' => (int) $totalPurchases,
                'totalCustomers' => (int) $totalCustomers,
                'totalSuppliers' => (int) $totalSuppliers,
            ],
        ];
    }
}
