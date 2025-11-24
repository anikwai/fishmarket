<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\GenerateCustomerReportAction;
use App\Actions\GenerateExpenseReportAction;
use App\Actions\GenerateOutstandingCreditsReportAction;
use App\Actions\GenerateProfitLossReportAction;
use App\Actions\GeneratePurchaseReportAction;
use App\Actions\GenerateSalesByCustomerReportAction;
use App\Actions\GenerateSalesSummaryReportAction;
use App\Actions\GenerateStockReportAction;
use App\Actions\GenerateSupplierReportAction;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Supplier;
use App\Support\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

final readonly class ReportController
{
    public function __construct(
        private GenerateSalesSummaryReportAction $generateSalesSummaryReport,
        private GenerateSalesByCustomerReportAction $generateSalesByCustomerReport,
        private GenerateProfitLossReportAction $generateProfitLossReport,
        private GenerateOutstandingCreditsReportAction $generateOutstandingCreditsReport,
        private GenerateExpenseReportAction $generateExpenseReport,
        private GeneratePurchaseReportAction $generatePurchaseReport,
        private GenerateStockReportAction $generateStockReport,
        private GenerateCustomerReportAction $generateCustomerReport,
        private GenerateSupplierReportAction $generateSupplierReport,
    ) {}

    public function index(Request $request): InertiaResponse
    {
        Gate::authorize('view reports');

        $reportType = $request->query('type', 'sales-summary');
        $startDate = $request->query('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->query('end_date', now()->format('Y-m-d'));
        $customerId = $request->query('customer_id');
        $supplierId = $request->query('supplier_id');

        $data = match ($reportType) {
            'sales-summary' => $this->generateSalesSummaryReport->handle($startDate, $endDate, $customerId),
            'sales-by-customer' => $this->generateSalesByCustomerReport->handle($startDate, $endDate),
            'profit-loss' => $this->generateProfitLossReport->handle($startDate, $endDate),
            'outstanding-credits' => $this->generateOutstandingCreditsReport->handle(),
            'expense-report' => $this->generateExpenseReport->handle($startDate, $endDate),
            'purchase-report' => $this->generatePurchaseReport->handle($startDate, $endDate, $supplierId),
            'stock-report' => $this->generateStockReport->handle(),
            'customer-report' => $this->generateCustomerReport->handle($customerId),
            'supplier-report' => $this->generateSupplierReport->handle($supplierId),
            default => $this->generateSalesSummaryReport->handle($startDate, $endDate, $customerId),
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
        Gate::authorize('export reports');

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

        return response()->streamDownload(function () use ($reportType, $startDate, $endDate, $customerId, $supplierId): void {
            /** @var resource $handle */
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

    /**
     * @param  resource  $handle
     */
    private function exportSalesSummary(mixed $handle, string $startDate, string $endDate, ?string $customerId): void
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
        fputcsv($handle, ['Sale ID', 'Date', 'Customer', 'Quantity (kg)', 'Subtotal', 'Delivery Fee', 'Total Amount', 'Type', 'Notes'], escape: '\\');

        // Data rows
        foreach ($sales as $sale) {
            fputcsv($handle, [
                $sale->id,
                $sale->sale_date->format('Y-m-d'),
                $sale->customer->name,
                number_format((float) $sale->quantity_kg, 2),
                number_format((float) $sale->subtotal, 2),
                number_format((float) $sale->delivery_fee, 2),
                number_format((float) $sale->total_amount, 2),
                $sale->is_credit ? 'Credit' : 'Cash',
                $sale->notes ?? '',
            ],
                escape: '\\');
        }

        // Summary row
        fputcsv($handle, [], escape: '\\');
        fputcsv($handle, ['Summary'], escape: '\\');
        $totalRevenue = (float) $sales->sum('total_amount'); // @phpstan-ignore cast.double
        $totalQuantity = (float) $sales->sum('quantity_kg'); // @phpstan-ignore cast.double
        $salesCount = $sales->count();
        fputcsv($handle, ['Total Revenue', number_format($totalRevenue, 2)], escape: '\\');
        fputcsv($handle, ['Total Quantity (kg)', number_format($totalQuantity, 2)], escape: '\\');
        fputcsv($handle, ['Total Sales', $salesCount], escape: '\\');
        fputcsv($handle, ['Average Sale', number_format($salesCount > 0 ? $totalRevenue / $salesCount : 0.0, 2)], escape: '\\');
        $creditSales = (float) $sales->where('is_credit', true)->sum('total_amount'); // @phpstan-ignore cast.double
        $cashSales = (float) $sales->where('is_credit', false)->sum('total_amount'); // @phpstan-ignore cast.double
        fputcsv($handle, ['Credit Sales', number_format($creditSales, 2)], escape: '\\');
        fputcsv($handle, ['Cash Sales', number_format($cashSales, 2)], escape: '\\');
    }

    /**
     * @param  resource  $handle
     */
    private function exportSalesByCustomer(mixed $handle, string $startDate, string $endDate): void
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

        fputcsv($handle, ['Customer ID', 'Customer Name', 'Total Revenue', 'Total Quantity (kg)', 'Sales Count', 'Average Sale'], escape: '\\');

        foreach ($data as $item) {
            $itemId = isset($item->id) ? (int) $item->id : 0;
            $itemName = (isset($item->name) && is_string($item->name)) ? $item->name : '';
            $totalRevenue = (isset($item->total_revenue) && is_numeric($item->total_revenue)) ? (float) $item->total_revenue : 0.0;
            $totalQuantity = (isset($item->total_quantity) && is_numeric($item->total_quantity)) ? (float) $item->total_quantity : 0.0;
            $saleCount = (isset($item->sale_count) && is_numeric($item->sale_count)) ? (int) $item->sale_count : 0;
            $averageSale = ($saleCount > 0 && $totalRevenue > 0.0) ? $totalRevenue / $saleCount : 0.0;
            fputcsv($handle, [
                $itemId,
                $itemName,
                number_format($totalRevenue, 2),
                number_format($totalQuantity, 2),
                $saleCount,
                number_format($averageSale, 2),
            ],
                escape: '\\');
        }
    }

    /**
     * @param  resource  $handle
     */
    private function exportOutstandingCredits(mixed $handle): void
    {
        $credits = Sale::query()
            ->where('is_credit', true)
            ->with(['customer', 'payments'])
            ->get()
            ->filter(fn (Sale $sale): bool => $sale->outstanding_balance > 0)
            ->sortByDesc(fn (Sale $sale): int => (int) $sale->sale_date->diffInDays(now()))
            ->values();

        fputcsv($handle, ['Sale ID', 'Date', 'Customer', 'Total Amount', 'Paid', 'Outstanding', 'Days Outstanding'], escape: '\\');

        foreach ($credits as $credit) {
            $paidAmount = (float) $credit->payments->sum('amount'); // @phpstan-ignore cast.double
            $daysOutstanding = $credit->sale_date->diffInDays(now());
            fputcsv($handle, [
                $credit->id,
                $credit->sale_date->format('Y-m-d'),
                $credit->customer->name,
                number_format((float) $credit->total_amount, 2),
                number_format($paidAmount, 2),
                number_format((float) $credit->outstanding_balance, 2),
                $daysOutstanding,
            ],
                escape: '\\');
        }
    }

    /**
     * @param  resource  $handle
     */
    private function exportExpenseReport(mixed $handle, string $startDate, string $endDate): void
    {
        $expenses = Expense::query()
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->with(['purchase.supplier'])
            ->orderBy('expense_date', 'desc')
            ->get();

        fputcsv($handle, ['ID', 'Date', 'Type', 'Description', 'Amount', 'Supplier'], escape: '\\');

        foreach ($expenses as $expense) {
            fputcsv($handle, [
                $expense->id,
                $expense->expense_date->format('Y-m-d'),
                ucfirst((string) $expense->type),
                $expense->description,
                number_format((float) $expense->amount, 2),
                $expense->purchase?->supplier?->name ?: '',
            ],
                escape: '\\');
        }

        fputcsv($handle, [], escape: '\\');
        fputcsv($handle, ['Total', '', '', '', number_format((float) $expenses->sum('amount'), 2), ''], escape: '\\'); // @phpstan-ignore cast.double
    }

    /**
     * @param  resource  $handle
     */
    private function exportPurchaseReport(mixed $handle, string $startDate, string $endDate, ?string $supplierId): void
    {
        $query = Purchase::query()
            ->whereBetween('purchase_date', [$startDate, $endDate])
            ->with('supplier')
            ->orderBy('purchase_date', 'desc');

        if ($supplierId) {
            $query->where('supplier_id', $supplierId);
        }

        $purchases = $query->get();

        fputcsv($handle, ['Purchase ID', 'Date', 'Supplier', 'Quantity (kg)', 'Price per kg', 'Total Cost', 'Notes'], escape: '\\');

        foreach ($purchases as $purchase) {
            fputcsv($handle, [
                $purchase->id,
                $purchase->purchase_date->format('Y-m-d'),
                $purchase->supplier->name,
                number_format((float) $purchase->quantity_kg, 2),
                number_format((float) $purchase->price_per_kg, 2),
                number_format((float) $purchase->total_cost, 2),
                $purchase->notes ?? '',
            ],
                escape: '\\');
        }

        fputcsv($handle, [], escape: '\\');
        fputcsv($handle, ['Summary'], escape: '\\');
        $totalCost = (float) $purchases->sum('total_cost'); // @phpstan-ignore cast.double
        $totalQuantity = (float) $purchases->sum('quantity_kg'); // @phpstan-ignore cast.double
        fputcsv($handle, ['Total Cost', number_format($totalCost, 2)], escape: '\\');
        fputcsv($handle, ['Total Quantity (kg)', number_format($totalQuantity, 2)], escape: '\\');
        fputcsv($handle, ['Purchase Count', $purchases->count()], escape: '\\');
    }

    /**
     * @param  resource  $handle
     */
    private function exportStockReport(mixed $handle): void
    {
        $suppliers = Supplier::query()
            ->orderBy('name')
            ->get();

        fputcsv($handle, ['Supplier ID', 'Supplier Name', 'Remaining Stock (kg)'], escape: '\\');

        foreach ($suppliers as $supplier) {
            fputcsv($handle, [
                $supplier->id,
                $supplier->name,
                number_format((float) $supplier->remaining_stock, 2),
            ],
                escape: '\\');
        }

        fputcsv($handle, [], escape: '\\');
        fputcsv($handle, ['Total Stock', number_format(Stock::current(), 2)], escape: '\\');
    }

    /**
     * @param  resource  $handle
     */
    private function exportCustomerReport(mixed $handle, ?string $customerId): void
    {
        if ($customerId) {
            $customer = Customer::query()
                /** @phpstan-ignore-next-line */
                ->with(['sales' => function (\Illuminate\Database\Eloquent\Relations\HasMany $q): void {
                    $q->latest('sale_date');
                }])
                ->findOrFail($customerId);

            fputcsv($handle, ['Customer Details'], escape: '\\');
            fputcsv($handle, ['ID', $customer->id], escape: '\\');
            fputcsv($handle, ['Name', $customer->name], escape: '\\');
            fputcsv($handle, ['Email', $customer->email ?? ''], escape: '\\');
            fputcsv($handle, ['Phone', $customer->phone ?? ''], escape: '\\');
            fputcsv($handle, ['Type', $customer->type], escape: '\\');
            fputcsv($handle, ['Address', $customer->address ?? ''], escape: '\\');
            fputcsv($handle, [], escape: '\\');

            $outstandingCredits = $customer->sales()
                ->where('is_credit', true)
                ->with(['payments'])
                ->get()
                ->filter(fn (Sale $sale): bool => $sale->outstanding_balance > 0);

            fputcsv($handle, ['Summary'], escape: '\\');
            $totalSales = $customer->sales()->count();
            $totalRevenue = (float) $customer->sales()->sum('total_amount');
            $outstandingCreditsSum = (float) $outstandingCredits->sum('outstanding_balance'); // @phpstan-ignore cast.double
            fputcsv($handle, ['Total Sales', $totalSales], escape: '\\');
            fputcsv($handle, ['Total Revenue', number_format($totalRevenue, 2)], escape: '\\');
            fputcsv($handle, ['Outstanding Credits', number_format($outstandingCreditsSum, 2)], escape: '\\');
            fputcsv($handle, ['Credit Count', $outstandingCredits->count()], escape: '\\');
            fputcsv($handle, [], escape: '\\');

            fputcsv($handle, ['Sales History'], escape: '\\');
            fputcsv($handle, ['Sale ID', 'Date', 'Amount', 'Quantity (kg)', 'Type', 'Outstanding'], escape: '\\');

            foreach ($customer->sales as $sale) {
                fputcsv($handle, [
                    $sale->id,
                    $sale->sale_date->format('Y-m-d'),
                    number_format((float) $sale->total_amount, 2),
                    number_format((float) $sale->quantity_kg, 2),
                    $sale->is_credit ? 'Credit' : 'Cash',
                    $sale->is_credit ? number_format((float) $sale->outstanding_balance, 2) : '0.00',
                ],
                    escape: '\\');
            }
        } else {
            $customers = Customer::query()
                ->withCount('sales')
                ->withSum('sales', 'total_amount')
                ->orderBy('name')
                ->get();

            fputcsv($handle, ['Customer ID', 'Name', 'Email', 'Phone', 'Type', 'Total Sales', 'Total Revenue'], escape: '\\');

            foreach ($customers as $customer) {
                $customerSalesSum = $customer->sales_sum_total_amount ?? null;
                $customerSalesTotal = is_numeric($customerSalesSum) ? (float) $customerSalesSum : 0.0;

                fputcsv($handle, [
                    $customer->id,
                    $customer->name,
                    $customer->email ?? '',
                    $customer->phone ?? '',
                    $customer->type,
                    $customer->sales_count ?? 0,
                    number_format($customerSalesTotal, 2),
                ],
                    escape: '\\');
            }
        }
    }

    /**
     * @param  resource  $handle
     */
    private function exportSupplierReport(mixed $handle, ?string $supplierId): void
    {
        if ($supplierId) {
            $supplier = Supplier::query()
                /** @phpstan-ignore-next-line */
                ->with(['purchases' => function (\Illuminate\Database\Eloquent\Relations\HasMany $q): void {
                    $q->latest('purchase_date');
                }])
                ->findOrFail($supplierId);

            fputcsv($handle, ['Supplier Details'], escape: '\\');
            fputcsv($handle, ['ID', $supplier->id], escape: '\\');
            fputcsv($handle, ['Name', $supplier->name], escape: '\\');
            fputcsv($handle, ['Email', $supplier->email ?? ''], escape: '\\');
            fputcsv($handle, ['Phone', $supplier->phone ?? ''], escape: '\\');
            fputcsv($handle, ['Address', $supplier->address ?? ''], escape: '\\');
            fputcsv($handle, [], escape: '\\');

            fputcsv($handle, ['Summary'], escape: '\\');
            $totalPurchases = $supplier->purchases()->count();
            $totalCost = (float) $supplier->purchases()->sum('total_cost');
            $totalQuantity = (float) $supplier->purchases()->sum('quantity_kg');
            fputcsv($handle, ['Total Purchases', $totalPurchases], escape: '\\');
            fputcsv($handle, ['Total Cost', number_format($totalCost, 2)], escape: '\\');
            fputcsv($handle, ['Total Quantity (kg)', number_format($totalQuantity, 2)], escape: '\\');
            fputcsv($handle, ['Remaining Stock (kg)', number_format((float) $supplier->remaining_stock, 2)], escape: '\\');
            fputcsv($handle, [], escape: '\\');

            fputcsv($handle, ['Purchase History'], escape: '\\');
            fputcsv($handle, ['Purchase ID', 'Date', 'Quantity (kg)', 'Price per kg', 'Total Cost'], escape: '\\');

            foreach ($supplier->purchases as $purchase) {
                fputcsv($handle, [
                    $purchase->id,
                    $purchase->purchase_date->format('Y-m-d'),
                    number_format((float) $purchase->quantity_kg, 2),
                    number_format((float) $purchase->price_per_kg, 2),
                    number_format((float) $purchase->total_cost, 2),
                ],
                    escape: '\\');
            }
        } else {
            $suppliers = Supplier::query()
                ->withCount('purchases')
                ->withSum('purchases', 'total_cost')
                ->orderBy('name')
                ->get();

            fputcsv($handle, ['Supplier ID', 'Name', 'Email', 'Phone', 'Total Purchases', 'Total Cost', 'Remaining Stock (kg)'], escape: '\\');

            foreach ($suppliers as $supplier) {
                $totalCost = $supplier->purchases_sum_total_cost ?? null;
                $supplierCostTotal = is_numeric($totalCost) ? (float) $totalCost : 0.0;

                fputcsv($handle, [
                    $supplier->id,
                    $supplier->name,
                    $supplier->email ?? '',
                    $supplier->phone ?? '',
                    $supplier->purchases_count ?? 0,
                    number_format($supplierCostTotal, 2),
                    number_format((float) $supplier->remaining_stock, 2),
                ],
                    escape: '\\');
            }
        }
    }
}
