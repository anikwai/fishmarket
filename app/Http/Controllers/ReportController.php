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
use App\Models\Sale;
use App\Models\Supplier;
use Illuminate\Http\Request;
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
