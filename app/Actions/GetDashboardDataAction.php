<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Expense;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Supplier;
use App\Support\Stock;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

final readonly class GetDashboardDataAction
{
    /**
     * @return array<string, mixed>
     */
    public function handle(?CarbonInterface $startDate = null, ?CarbonInterface $endDate = null): array
    {
        $currentStock = Stock::current();
        $recentSales = Sale::query()
            ->with(['customer', 'payments'])
            ->when($startDate && $endDate, fn ($q) => $q->whereBetween('sale_date', [$startDate, $endDate]))
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Sale $sale): array => [
                'id' => $sale->id,
                'sale_date' => $sale->sale_date->toISOString(),
                'quantity_kg' => (float) $sale->quantity_kg,
                'price_per_kg' => (float) $sale->price_per_kg,
                'discount_percentage' => (float) $sale->discount_percentage,
                'subtotal' => (float) $sale->subtotal,
                'delivery_fee' => (float) $sale->delivery_fee,
                'total_amount' => (float) $sale->total_amount,
                'is_credit' => $sale->is_credit,
                'is_delivery' => $sale->is_delivery,
                'notes' => $sale->notes,
                'customer' => [
                    'id' => $sale->customer->id,
                    'name' => $sale->customer->name,
                    'email' => $sale->customer->email,
                    'phone' => $sale->customer->phone,
                ],
                'payments' => $sale->payments->map(fn ($payment): array => [
                    'id' => $payment->id,
                    'amount' => (float) $payment->amount,
                    'payment_date' => $payment->payment_date->toISOString(),
                ])->all(),
                'outstanding_balance' => (float) $sale->outstanding_balance,
            ]);

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

        // Expense breakdown by type
        $expenseBreakdown = Expense::query()
            ->select('type', DB::raw('SUM(amount) as total'))
            ->when($startDate && $endDate, fn ($q) => $q->whereBetween('expense_date', [$startDate, $endDate]))
            ->groupBy('type')
            ->get()
            ->map(fn (object $item): array => [
                'type' => ucfirst((string) ($item->type ?? '')),
                'total' => (isset($item->total) && is_numeric($item->total)) ? (float) $item->total : 0.0,
            ]);

        // Daily sales for last 30 days or selected period
        $dailySalesQuery = Sale::query()
            ->selectRaw('sale_date::date as date')
            ->selectRaw('SUM(total_amount) as revenue')
            ->selectRaw('SUM(quantity_kg) as quantity')
            ->groupByRaw('sale_date::date')
            ->orderBy('date');

        if ($startDate && $endDate) {
            $dailySalesQuery->whereBetween('sale_date', [$startDate, $endDate]);
        } else {
            $dailySalesQuery->where('sale_date', '>=', now()->subDays(30));
        }

        $dailySalesData = $dailySalesQuery->get()
            ->map(fn (object $item): array => [
                'date' => $item->date ?? '',
                'revenue' => (isset($item->revenue) && is_numeric($item->revenue)) ? (float) $item->revenue : 0.0,
                'quantity' => (isset($item->quantity) && is_numeric($item->quantity)) ? (float) $item->quantity : 0.0,
            ]);

        // Summary statistics
        $totalRevenue = Sale::query()
            ->when($startDate && $endDate, fn ($q) => $q->whereBetween('sale_date', [$startDate, $endDate]))
            ->sum('total_amount');

        $totalCosts = Purchase::query()
            ->when($startDate && $endDate, fn ($q) => $q->whereBetween('purchase_date', [$startDate, $endDate]))
            ->sum('total_cost');

        $totalExpenses = Expense::query()
            ->when($startDate && $endDate, fn ($q) => $q->whereBetween('expense_date', [$startDate, $endDate]))
            ->sum('amount');

        $netProfit = $totalRevenue - $totalCosts - $totalExpenses;

        // For "This Month" stats, if we are filtering, maybe we just return 0 or the same as total?
        // Let's keep "This Month" as actual current month context regardless of filter,
        // or update the UI to not label it "This Month" if filtered.
        // Given the UI structure, let's keep "This Month" as strict calendar month for context.

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

        $totalSales = Sale::query()
            ->when($startDate && $endDate, fn ($q) => $q->whereBetween('sale_date', [$startDate, $endDate]))
            ->count();

        $totalPurchases = Purchase::query()
            ->when($startDate && $endDate, fn ($q) => $q->whereBetween('purchase_date', [$startDate, $endDate]))
            ->count();

        $totalCustomers = \App\Models\Customer::query()->count(); // Customers are global
        $totalSuppliers = Supplier::query()->count(); // Suppliers are global

        // Supplier stock breakdown for pie chart
        // Optimized to avoid N+1 problem on remaining_stock accessor
        $supplierStockData = Supplier::query()
            ->select('suppliers.id', 'suppliers.name') // Ensure 'id' is selected
            ->selectRaw('
                (
                    COALESCE((SELECT SUM(quantity_kg) FROM purchases WHERE supplier_id = suppliers.id), 0)
                    -
                    COALESCE((
                        SELECT SUM(purchase_sale.quantity_kg) 
                        FROM purchase_sale 
                        JOIN purchases ON purchases.id = purchase_sale.purchase_id 
                        WHERE purchases.supplier_id = suppliers.id
                    ), 0)
                ) as remaining_stock
            ')
            ->get()
            ->filter(fn (object $item): bool => ((float) $item->remaining_stock) > 0)
            ->map(fn (object $item): array => [
                'name' => $item->name,
                'value' => (float) $item->remaining_stock,
            ])
            ->values()
            ->all();

        return [
            'currentStock' => $currentStock,
            'recentSales' => $recentSales,
            'outstandingCredits' => $outstandingCredits,
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
