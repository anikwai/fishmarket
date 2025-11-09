<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Supplier;
use App\Support\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

final readonly class ReportController
{
    public function index(Request $request): InertiaResponse
    {
        $reportType = $request->query('type', 'sales-summary');
        $startDate = $request->query('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->query('end_date', now()->format('Y-m-d'));
        $customerId = $request->query('customer_id');
        $supplierId = $request->query('supplier_id');

        $data = match ($reportType) {
            'sales-summary' => $this->salesSummary($startDate, $endDate, $customerId),
            'sales-by-customer' => $this->salesByCustomer($startDate, $endDate),
            'profit-loss' => $this->profitLoss($startDate, $endDate),
            'outstanding-credits' => $this->outstandingCredits(),
            'expense-report' => $this->expenseReport($startDate, $endDate),
            'purchase-report' => $this->purchaseReport($startDate, $endDate, $supplierId),
            'stock-report' => $this->stockReport(),
            'customer-report' => $this->customerReport($customerId),
            'supplier-report' => $this->supplierReport($supplierId),
            default => $this->salesSummary($startDate, $endDate, $customerId),
        };

        return Inertia::render('Reports/Index', [
            'reportType' => $reportType,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'customerId' => $customerId,
            'supplierId' => $supplierId,
            'customers' => Customer::query()->orderBy('name')->get(['id', 'name']),
            'suppliers' => Supplier::query()->orderBy('name')->get(['id', 'name']),
            'reportData' => $data,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $reportType = $request->query('type', 'sales-summary');
        $startDate = $request->query('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->query('end_date', now()->format('Y-m-d'));
        $customerId = $request->query('customer_id');
        $supplierId = $request->query('supplier_id');

        $filename = match ($reportType) {
            'sales-summary' => "sales-summary-{$startDate}-to-{$endDate}.csv",
            'sales-by-customer' => "sales-by-customer-{$startDate}-to-{$endDate}.csv",
            'outstanding-credits' => 'outstanding-credits-'.now()->format('Y-m-d').'.csv',
            'expense-report' => "expenses-{$startDate}-to-{$endDate}.csv",
            'purchase-report' => "purchases-{$startDate}-to-{$endDate}.csv",
            'stock-report' => 'stock-report-'.now()->format('Y-m-d').'.csv',
            'customer-report' => $customerId ? "customer-{$customerId}-report.csv" : 'all-customers-report.csv',
            'supplier-report' => $supplierId ? "supplier-{$supplierId}-report.csv" : 'all-suppliers-report.csv',
            default => "report-{$reportType}-".now()->format('Y-m-d').'.csv',
        };

        return response()->streamDownload(function () use ($reportType, $startDate, $endDate, $customerId, $supplierId) {
            $handle = fopen('php://output', 'w');

            match ($reportType) {
                'sales-summary' => $this->exportSalesSummary($handle, $startDate, $endDate, $customerId),
                'sales-by-customer' => $this->exportSalesByCustomer($handle, $startDate, $endDate),
                'outstanding-credits' => $this->exportOutstandingCredits($handle),
                'expense-report' => $this->exportExpenseReport($handle, $startDate, $endDate),
                'purchase-report' => $this->exportPurchaseReport($handle, $startDate, $endDate, $supplierId),
                'stock-report' => $this->exportStockReport($handle),
                'customer-report' => $this->exportCustomerReport($handle, $customerId),
                'supplier-report' => $this->exportSupplierReport($handle, $supplierId),
                default => $this->exportSalesSummary($handle, $startDate, $endDate, $customerId),
            };

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function salesSummary(string $startDate, string $endDate, ?string $customerId): array
    {
        $query = Sale::query()
            ->whereBetween('sale_date', [$startDate, $endDate]);

        if ($customerId) {
            $query->where('customer_id', $customerId);
        }

        $sales = $query->with('customer')->get();

        $dailyData = Sale::query()
            ->selectRaw('sale_date::date as date')
            ->selectRaw('SUM(total_amount) as revenue')
            ->selectRaw('SUM(quantity_kg) as quantity')
            ->selectRaw('COUNT(*) as count')
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->when($customerId, fn ($q) => $q->where('customer_id', $customerId))
            ->groupByRaw('sale_date::date')
            ->orderBy('date')
            ->get();

        return [
            'summary' => [
                'total_revenue' => $sales->sum('total_amount'),
                'total_quantity' => $sales->sum('quantity_kg'),
                'total_sales' => $sales->count(),
                'average_sale' => $sales->count() > 0 ? $sales->sum('total_amount') / $sales->count() : 0,
                'credit_sales' => $sales->where('is_credit', true)->sum('total_amount'),
                'cash_sales' => $sales->where('is_credit', false)->sum('total_amount'),
            ],
            'daily_data' => $dailyData->map(fn ($item) => [
                'date' => $item->date,
                'revenue' => (float) $item->revenue,
                'quantity' => (float) $item->quantity,
                'count' => (int) $item->count,
            ]),
            'recent_sales' => $sales->take(10)->map(fn ($sale) => [
                'id' => $sale->id,
                'date' => $sale->sale_date->format('Y-m-d'),
                'customer' => $sale->customer->name,
                'amount' => $sale->total_amount,
                'quantity' => $sale->quantity_kg,
                'is_credit' => $sale->is_credit,
            ]),
        ];
    }

    private function salesByCustomer(string $startDate, string $endDate): array
    {
        $data = Sale::query()
            ->select('customers.id', 'customers.name')
            ->selectRaw('SUM(sales.total_amount) as total_revenue')
            ->selectRaw('SUM(sales.quantity_kg) as total_quantity')
            ->selectRaw('COUNT(sales.id) as sale_count')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->whereBetween('sales.sale_date', [$startDate, $endDate])
            ->groupBy('customers.id', 'customers.name')
            ->orderByDesc('total_revenue')
            ->get();

        return [
            'customers' => $data->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'total_revenue' => (float) $item->total_revenue,
                'total_quantity' => (float) $item->total_quantity,
                'sale_count' => (int) $item->sale_count,
                'average_sale' => (int) $item->sale_count > 0
                    ? (float) $item->total_revenue / (int) $item->sale_count
                    : 0,
            ]),
            'summary' => [
                'total_customers' => $data->count(),
                'total_revenue' => $data->sum('total_revenue'),
            ],
        ];
    }

    private function profitLoss(string $startDate, string $endDate): array
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
            'expense_breakdown' => $expenseBreakdown->map(fn ($item) => [
                'type' => ucfirst($item->type),
                'total' => (float) $item->total,
            ]),
        ];
    }

    private function outstandingCredits(): array
    {
        $credits = Sale::query()
            ->where('is_credit', true)
            ->with('customer', 'payments')
            ->get()
            ->filter(fn (Sale $sale) => $sale->outstanding_balance > 0)
            ->map(fn (Sale $sale) => [
                'sale_id' => $sale->id,
                'date' => $sale->sale_date->format('Y-m-d'),
                'customer' => $sale->customer->name,
                'total' => $sale->total_amount,
                'paid' => $sale->payments->sum('amount'),
                'outstanding' => $sale->outstanding_balance,
                'days_outstanding' => $sale->sale_date->diffInDays(now()),
            ])
            ->sortByDesc('days_outstanding')
            ->values();

        return [
            'credits' => $credits,
            'summary' => [
                'total_outstanding' => $credits->sum('outstanding'),
                'count' => $credits->count(),
                'average_days' => $credits->count() > 0
                    ? round($credits->avg('days_outstanding'), 1)
                    : 0,
            ],
        ];
    }

    private function expenseReport(string $startDate, string $endDate): array
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

    private function purchaseReport(string $startDate, string $endDate, ?string $supplierId): array
    {
        $query = Purchase::query()
            ->whereBetween('purchase_date', [$startDate, $endDate])
            ->with('supplier');

        if ($supplierId) {
            $query->where('supplier_id', $supplierId);
        }

        $purchases = $query->get();

        $bySupplier = Purchase::query()
            ->select('suppliers.id', 'suppliers.name')
            ->selectRaw('SUM(purchases.total_cost) as total_cost')
            ->selectRaw('SUM(purchases.quantity_kg) as total_quantity')
            ->selectRaw('COUNT(purchases.id) as purchase_count')
            ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->whereBetween('purchases.purchase_date', [$startDate, $endDate])
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderByDesc('total_cost')
            ->get();

        return [
            'purchases' => $purchases->map(fn ($purchase) => [
                'id' => $purchase->id,
                'date' => $purchase->purchase_date->format('Y-m-d'),
                'supplier' => $purchase->supplier->name,
                'quantity' => $purchase->quantity_kg,
                'price_per_kg' => $purchase->price_per_kg,
                'total_cost' => $purchase->total_cost,
            ]),
            'by_supplier' => $bySupplier->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'total_cost' => (float) $item->total_cost,
                'total_quantity' => (float) $item->total_quantity,
                'purchase_count' => (int) $item->purchase_count,
                'average_price' => (float) $item->total_quantity > 0
                    ? (float) $item->total_cost / (float) $item->total_quantity
                    : 0,
            ]),
            'summary' => [
                'total_cost' => $purchases->sum('total_cost'),
                'total_quantity' => $purchases->sum('quantity_kg'),
                'count' => $purchases->count(),
                'average_price_per_kg' => $purchases->sum('quantity_kg') > 0
                    ? $purchases->sum('total_cost') / $purchases->sum('quantity_kg')
                    : 0,
            ],
        ];
    }

    private function stockReport(): array
    {
        $suppliers = Supplier::query()->get();
        $currentStock = Stock::current();

        return [
            'current_stock' => $currentStock,
            'by_supplier' => $suppliers->map(fn ($supplier) => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'remaining_stock' => (float) $supplier->remaining_stock,
            ])->filter(fn ($item) => $item['remaining_stock'] > 0),
            'summary' => [
                'total_suppliers' => $suppliers->count(),
                'suppliers_with_stock' => $suppliers->filter(fn ($s) => $s->remaining_stock > 0)->count(),
            ],
        ];
    }

    private function customerReport(?string $customerId): array
    {
        if (! $customerId) {
            return [
                'customers' => Customer::query()
                    ->withCount('sales')
                    ->withSum('sales', 'total_amount')
                    ->orderBy('name')
                    ->get()
                    ->map(fn ($customer) => [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'email' => $customer->email,
                        'phone' => $customer->phone,
                        'type' => $customer->type,
                        'total_sales' => (int) $customer->sales_count,
                        'total_revenue' => (float) $customer->sales_sum_total_amount,
                    ]),
            ];
        }

        $customer = Customer::query()
            ->with(['sales' => fn ($q) => $q->orderByDesc('sale_date')->limit(20)])
            ->findOrFail($customerId);

        $outstandingCredits = $customer->sales()
            ->where('is_credit', true)
            ->with('payments')
            ->get()
            ->filter(fn (Sale $sale) => $sale->outstanding_balance > 0);

        return [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'type' => $customer->type,
                'address' => $customer->address,
            ],
            'summary' => [
                'total_sales' => $customer->sales()->count(),
                'total_revenue' => $customer->sales()->sum('total_amount'),
                'outstanding_credits' => $outstandingCredits->sum('outstanding_balance'),
                'credit_count' => $outstandingCredits->count(),
            ],
            'recent_sales' => $customer->sales->map(fn ($sale) => [
                'id' => $sale->id,
                'date' => $sale->sale_date->format('Y-m-d'),
                'amount' => $sale->total_amount,
                'quantity' => $sale->quantity_kg,
                'is_credit' => $sale->is_credit,
                'outstanding' => $sale->is_credit ? $sale->outstanding_balance : 0,
            ]),
            'outstanding_credits' => $outstandingCredits->map(fn ($sale) => [
                'sale_id' => $sale->id,
                'date' => $sale->sale_date->format('Y-m-d'),
                'total' => $sale->total_amount,
                'paid' => $sale->payments->sum('amount'),
                'outstanding' => $sale->outstanding_balance,
            ]),
        ];
    }

    private function supplierReport(?string $supplierId): array
    {
        if (! $supplierId) {
            return [
                'suppliers' => Supplier::query()
                    ->withCount('purchases')
                    ->withSum('purchases', 'total_cost')
                    ->orderBy('name')
                    ->get()
                    ->map(fn ($supplier) => [
                        'id' => $supplier->id,
                        'name' => $supplier->name,
                        'email' => $supplier->email,
                        'phone' => $supplier->phone,
                        'total_purchases' => (int) $supplier->purchases_count,
                        'total_cost' => (float) $supplier->purchases_sum_total_cost,
                        'remaining_stock' => (float) $supplier->remaining_stock,
                    ]),
            ];
        }

        $supplier = Supplier::query()
            ->with(['purchases' => fn ($q) => $q->orderByDesc('purchase_date')->limit(20)])
            ->findOrFail($supplierId);

        return [
            'supplier' => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'email' => $supplier->email,
                'phone' => $supplier->phone,
                'address' => $supplier->address,
            ],
            'summary' => [
                'total_purchases' => $supplier->purchases()->count(),
                'total_cost' => $supplier->purchases()->sum('total_cost'),
                'total_quantity' => $supplier->purchases()->sum('quantity_kg'),
                'remaining_stock' => (float) $supplier->remaining_stock,
                'average_price_per_kg' => $supplier->purchases()->sum('quantity_kg') > 0
                    ? $supplier->purchases()->sum('total_cost') / $supplier->purchases()->sum('quantity_kg')
                    : 0,
            ],
            'recent_purchases' => $supplier->purchases->map(fn ($purchase) => [
                'id' => $purchase->id,
                'date' => $purchase->purchase_date->format('Y-m-d'),
                'quantity' => $purchase->quantity_kg,
                'price_per_kg' => $purchase->price_per_kg,
                'total_cost' => $purchase->total_cost,
            ]),
        ];
    }

    private function exportSalesSummary($handle, string $startDate, string $endDate, ?string $customerId): void
    {
        $query = Sale::query()
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->with('customer')
            ->orderBy('sale_date', 'desc');

        if ($customerId) {
            $query->where('customer_id', $customerId);
        }

        $sales = $query->get();

        // Header
        fputcsv($handle, ['Sale ID', 'Date', 'Customer', 'Quantity (kg)', 'Price per kg', 'Discount %', 'Subtotal', 'Delivery Fee', 'Total Amount', 'Type', 'Notes']);

        // Data rows
        foreach ($sales as $sale) {
            fputcsv($handle, [
                $sale->id,
                $sale->sale_date->format('Y-m-d'),
                $sale->customer->name,
                number_format((float) $sale->quantity_kg, 2),
                number_format((float) $sale->price_per_kg, 2),
                number_format((float) $sale->discount_percentage, 2),
                number_format((float) $sale->subtotal, 2),
                number_format((float) $sale->delivery_fee, 2),
                number_format((float) $sale->total_amount, 2),
                $sale->is_credit ? 'Credit' : 'Cash',
                $sale->notes ?? '',
            ]);
        }

        // Summary row
        fputcsv($handle, []);
        fputcsv($handle, ['Summary']);
        fputcsv($handle, ['Total Revenue', number_format($sales->sum('total_amount'), 2)]);
        fputcsv($handle, ['Total Quantity (kg)', number_format($sales->sum('quantity_kg'), 2)]);
        fputcsv($handle, ['Total Sales', $sales->count()]);
        fputcsv($handle, ['Average Sale', number_format($sales->count() > 0 ? $sales->sum('total_amount') / $sales->count() : 0, 2)]);
        fputcsv($handle, ['Credit Sales', number_format($sales->where('is_credit', true)->sum('total_amount'), 2)]);
        fputcsv($handle, ['Cash Sales', number_format($sales->where('is_credit', false)->sum('total_amount'), 2)]);
    }

    private function exportSalesByCustomer($handle, string $startDate, string $endDate): void
    {
        $data = Sale::query()
            ->select('customers.id', 'customers.name')
            ->selectRaw('SUM(sales.total_amount) as total_revenue')
            ->selectRaw('SUM(sales.quantity_kg) as total_quantity')
            ->selectRaw('COUNT(sales.id) as sale_count')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->whereBetween('sales.sale_date', [$startDate, $endDate])
            ->groupBy('customers.id', 'customers.name')
            ->orderByDesc('total_revenue')
            ->get();

        fputcsv($handle, ['Customer ID', 'Customer Name', 'Total Revenue', 'Total Quantity (kg)', 'Sales Count', 'Average Sale']);

        foreach ($data as $item) {
            fputcsv($handle, [
                $item->id,
                $item->name,
                number_format((float) $item->total_revenue, 2),
                number_format((float) $item->total_quantity, 2),
                $item->sale_count,
                number_format((int) $item->sale_count > 0 ? (float) $item->total_revenue / (int) $item->sale_count : 0, 2),
            ]);
        }
    }

    private function exportOutstandingCredits($handle): void
    {
        $credits = Sale::query()
            ->where('is_credit', true)
            ->with('customer', 'payments')
            ->get()
            ->filter(fn (Sale $sale) => $sale->outstanding_balance > 0)
            ->sortByDesc(fn (Sale $sale) => $sale->sale_date->diffInDays(now()))
            ->values();

        fputcsv($handle, ['Sale ID', 'Date', 'Customer', 'Total Amount', 'Paid', 'Outstanding', 'Days Outstanding']);

        foreach ($credits as $credit) {
            fputcsv($handle, [
                $credit->id,
                $credit->sale_date->format('Y-m-d'),
                $credit->customer->name,
                number_format((float) $credit->total_amount, 2),
                number_format((float) $credit->payments->sum('amount'), 2),
                number_format((float) $credit->outstanding_balance, 2),
                $credit->sale_date->diffInDays(now()),
            ]);
        }
    }

    private function exportExpenseReport($handle, string $startDate, string $endDate): void
    {
        $expenses = Expense::query()
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->with('purchase.supplier')
            ->orderBy('expense_date', 'desc')
            ->get();

        fputcsv($handle, ['ID', 'Date', 'Type', 'Description', 'Amount', 'Supplier']);

        foreach ($expenses as $expense) {
            fputcsv($handle, [
                $expense->id,
                $expense->expense_date->format('Y-m-d'),
                ucfirst($expense->type),
                $expense->description,
                number_format((float) $expense->amount, 2),
                $expense->purchase?->supplier?->name ?? '',
            ]);
        }

        fputcsv($handle, []);
        fputcsv($handle, ['Total', '', '', '', number_format($expenses->sum('amount'), 2), '']);
    }

    private function exportPurchaseReport($handle, string $startDate, string $endDate, ?string $supplierId): void
    {
        $query = Purchase::query()
            ->whereBetween('purchase_date', [$startDate, $endDate])
            ->with('supplier')
            ->orderBy('purchase_date', 'desc');

        if ($supplierId) {
            $query->where('supplier_id', $supplierId);
        }

        $purchases = $query->get();

        fputcsv($handle, ['Purchase ID', 'Date', 'Supplier', 'Quantity (kg)', 'Price per kg', 'Total Cost', 'Notes']);

        foreach ($purchases as $purchase) {
            fputcsv($handle, [
                $purchase->id,
                $purchase->purchase_date->format('Y-m-d'),
                $purchase->supplier->name,
                number_format((float) $purchase->quantity_kg, 2),
                number_format((float) $purchase->price_per_kg, 2),
                number_format((float) $purchase->total_cost, 2),
                $purchase->notes ?? '',
            ]);
        }

        fputcsv($handle, []);
        fputcsv($handle, ['Summary']);
        fputcsv($handle, ['Total Cost', number_format($purchases->sum('total_cost'), 2)]);
        fputcsv($handle, ['Total Quantity (kg)', number_format($purchases->sum('quantity_kg'), 2)]);
        fputcsv($handle, ['Purchase Count', $purchases->count()]);
    }

    private function exportStockReport($handle): void
    {
        $suppliers = Supplier::query()
            ->orderBy('name')
            ->get();

        fputcsv($handle, ['Supplier ID', 'Supplier Name', 'Remaining Stock (kg)']);

        foreach ($suppliers as $supplier) {
            fputcsv($handle, [
                $supplier->id,
                $supplier->name,
                number_format((float) $supplier->remaining_stock, 2),
            ]);
        }

        fputcsv($handle, []);
        fputcsv($handle, ['Total Stock', number_format(Stock::current(), 2)]);
    }

    private function exportCustomerReport($handle, ?string $customerId): void
    {
        if ($customerId) {
            $customer = Customer::query()
                ->with(['sales' => fn ($q) => $q->orderByDesc('sale_date')])
                ->findOrFail($customerId);

            fputcsv($handle, ['Customer Details']);
            fputcsv($handle, ['ID', $customer->id]);
            fputcsv($handle, ['Name', $customer->name]);
            fputcsv($handle, ['Email', $customer->email ?? '']);
            fputcsv($handle, ['Phone', $customer->phone ?? '']);
            fputcsv($handle, ['Type', $customer->type]);
            fputcsv($handle, ['Address', $customer->address ?? '']);
            fputcsv($handle, []);

            $outstandingCredits = $customer->sales()
                ->where('is_credit', true)
                ->with('payments')
                ->get()
                ->filter(fn (Sale $sale) => $sale->outstanding_balance > 0);

            fputcsv($handle, ['Summary']);
            fputcsv($handle, ['Total Sales', $customer->sales()->count()]);
            fputcsv($handle, ['Total Revenue', number_format($customer->sales()->sum('total_amount'), 2)]);
            fputcsv($handle, ['Outstanding Credits', number_format($outstandingCredits->sum('outstanding_balance'), 2)]);
            fputcsv($handle, ['Credit Count', $outstandingCredits->count()]);
            fputcsv($handle, []);

            fputcsv($handle, ['Sales History']);
            fputcsv($handle, ['Sale ID', 'Date', 'Amount', 'Quantity (kg)', 'Type', 'Outstanding']);

            foreach ($customer->sales as $sale) {
                fputcsv($handle, [
                    $sale->id,
                    $sale->sale_date->format('Y-m-d'),
                    number_format((float) $sale->total_amount, 2),
                    number_format((float) $sale->quantity_kg, 2),
                    $sale->is_credit ? 'Credit' : 'Cash',
                    $sale->is_credit ? number_format((float) $sale->outstanding_balance, 2) : '0.00',
                ]);
            }
        } else {
            $customers = Customer::query()
                ->withCount('sales')
                ->withSum('sales', 'total_amount')
                ->orderBy('name')
                ->get();

            fputcsv($handle, ['Customer ID', 'Name', 'Email', 'Phone', 'Type', 'Total Sales', 'Total Revenue']);

            foreach ($customers as $customer) {
                fputcsv($handle, [
                    $customer->id,
                    $customer->name,
                    $customer->email ?? '',
                    $customer->phone ?? '',
                    $customer->type,
                    $customer->sales_count,
                    number_format((float) $customer->sales_sum_total_amount, 2),
                ]);
            }
        }
    }

    private function exportSupplierReport($handle, ?string $supplierId): void
    {
        if ($supplierId) {
            $supplier = Supplier::query()
                ->with(['purchases' => fn ($q) => $q->orderByDesc('purchase_date')])
                ->findOrFail($supplierId);

            fputcsv($handle, ['Supplier Details']);
            fputcsv($handle, ['ID', $supplier->id]);
            fputcsv($handle, ['Name', $supplier->name]);
            fputcsv($handle, ['Email', $supplier->email ?? '']);
            fputcsv($handle, ['Phone', $supplier->phone ?? '']);
            fputcsv($handle, ['Address', $supplier->address ?? '']);
            fputcsv($handle, []);

            fputcsv($handle, ['Summary']);
            fputcsv($handle, ['Total Purchases', $supplier->purchases()->count()]);
            fputcsv($handle, ['Total Cost', number_format($supplier->purchases()->sum('total_cost'), 2)]);
            fputcsv($handle, ['Total Quantity (kg)', number_format($supplier->purchases()->sum('quantity_kg'), 2)]);
            fputcsv($handle, ['Remaining Stock (kg)', number_format((float) $supplier->remaining_stock, 2)]);
            fputcsv($handle, []);

            fputcsv($handle, ['Purchase History']);
            fputcsv($handle, ['Purchase ID', 'Date', 'Quantity (kg)', 'Price per kg', 'Total Cost']);

            foreach ($supplier->purchases as $purchase) {
                fputcsv($handle, [
                    $purchase->id,
                    $purchase->purchase_date->format('Y-m-d'),
                    number_format((float) $purchase->quantity_kg, 2),
                    number_format((float) $purchase->price_per_kg, 2),
                    number_format((float) $purchase->total_cost, 2),
                ]);
            }
        } else {
            $suppliers = Supplier::query()
                ->withCount('purchases')
                ->withSum('purchases', 'total_cost')
                ->orderBy('name')
                ->get();

            fputcsv($handle, ['Supplier ID', 'Name', 'Email', 'Phone', 'Total Purchases', 'Total Cost', 'Remaining Stock (kg)']);

            foreach ($suppliers as $supplier) {
                fputcsv($handle, [
                    $supplier->id,
                    $supplier->name,
                    $supplier->email ?? '',
                    $supplier->phone ?? '',
                    $supplier->purchases_count,
                    number_format((float) $supplier->purchases_sum_total_cost, 2),
                    number_format((float) $supplier->remaining_stock, 2),
                ]);
            }
        }
    }
}
