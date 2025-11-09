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
            ->with('customer', 'payments')
            ->get()
            ->filter(fn (Sale $sale): bool => $sale->outstanding_balance > 0)
            ->map(fn (Sale $sale): array => [
                'sale_id' => $sale->id,
                'customer' => $sale->customer->name,
                'total' => $sale->total_amount,
                'paid' => $sale->payments->sum('amount'),
                'outstanding' => $sale->outstanding_balance,
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
            ->map(fn ($item): array => [
                'month' => $item->month,
                'revenue' => (float) $item->revenue,
                'count' => (int) $item->count,
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
            ->map(fn ($item): array => [
                'month' => $item->month,
                'cost' => (float) $item->cost,
                'quantity' => (float) $item->quantity,
            ]);

        // Combine sales and purchases data for comparison chart
        $monthlyComparison = collect(range(0, 5))
            ->map(fn ($i) => now()->subMonths($i)->format('Y-m'))
            ->reverse()
            ->map(function (string $month) use ($salesRevenueData, $purchasesCostData): array {
                $sales = $salesRevenueData->firstWhere('month', $month);
                $purchases = $purchasesCostData->firstWhere('month', $month);

                return [
                    'month' => date('M Y', strtotime($month.'-01')),
                    'revenue' => $sales ? (float) $sales['revenue'] : 0,
                    'cost' => $purchases ? (float) $purchases['cost'] : 0,
                ];
            });

        // Expense breakdown by type
        $expenseBreakdown = Expense::query()
            ->select('type', DB::raw('SUM(amount) as total'))
            ->groupBy('type')
            ->get()
            ->map(fn ($item): array => [
                'type' => ucfirst((string) $item->type),
                'total' => (float) $item->total,
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
            ->map(fn ($item): array => [
                'date' => $item->date,
                'revenue' => (float) $item->revenue,
                'quantity' => (float) $item->quantity,
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
            ->filter(fn ($item): bool => $item['value'] > 0)
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
                'totalRevenue' => $totalRevenue,
                'totalCosts' => $totalCosts,
                'totalExpenses' => $totalExpenses,
                'netProfit' => $netProfit,
                'thisMonthRevenue' => $thisMonthRevenue,
                'thisMonthCosts' => $thisMonthCosts,
                'thisMonthExpenses' => $thisMonthExpenses,
                'thisMonthProfit' => $thisMonthProfit,
                'totalSales' => $totalSales,
                'totalPurchases' => $totalPurchases,
                'totalCustomers' => $totalCustomers,
                'totalSuppliers' => $totalSuppliers,
            ],
        ];
    }
}
