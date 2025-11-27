<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreateSale;
use App\Actions\DeleteSale;
use App\Actions\GenerateReceipt;
use App\Actions\SendReceiptEmail;
use App\Actions\UpdateSale;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\UpdateSaleRequest;
use App\Models\Customer;
use App\Models\Sale;
use App\Support\Stock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final readonly class SaleController
{
    public function index(Request $request): Response
    {
        Gate::authorize('view sales');

        $perPage = $request->get('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 20, 25, 50]) ? (int) $perPage : 10; // @phpstan-ignore cast.int

        $query = Sale::query()
            ->with(['customer', 'payments', 'items.purchase.supplier'])
            ->when($request->search, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $search) => $query->whereHas('customer', fn (\Illuminate\Database\Eloquent\Builder $q) => $q->where('name', 'like', '%'.(is_string($search) ? $search : '').'%')))
            ->when($request->customer_id, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $customerId) => $query->where('customer_id', is_numeric($customerId) ? (int) $customerId : $customerId))
            ->when($request->has('is_credit'), fn (\Illuminate\Database\Eloquent\Builder $query) => $query->where('is_credit', $request->boolean('is_credit')))
            ->when($request->purchase_date, function (\Illuminate\Database\Eloquent\Builder $query, mixed $purchaseDate) {
                if (! is_string($purchaseDate)) {
                    return $query;
                }

                // Filter sales where ALL items are from purchases with the specified date
                return $query->whereDoesntHave('items.purchase', fn (\Illuminate\Database\Eloquent\Builder $q) => $q->whereDate('purchase_date', '!=', $purchaseDate))
                    ->whereHas('items.purchase', fn (\Illuminate\Database\Eloquent\Builder $q) => $q->whereDate('purchase_date', $purchaseDate));
            });

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if (is_string($sortBy) && is_string($sortDir) && in_array($sortDir, ['asc', 'desc'], true)) {
            $allowedSortColumns = [
                'sale_date' => 'sale_date',
                'customer.name' => 'customer_id', // Will sort by customer name via join
                'quantity_kg' => 'quantity_kg',
                'total_amount' => 'total_amount',
            ];

            if (isset($allowedSortColumns[$sortBy])) {
                if ($sortBy === 'customer.name') {
                    $query->join('customers', 'sales.customer_id', '=', 'customers.id')
                        ->orderBy('customers.name', $sortDir)
                        ->select('sales.*');
                } else {
                    $query->orderBy($allowedSortColumns[$sortBy], $sortDir);
                }
            }
        } else {
            $query->latest();
        }

        $sales = $query->paginate($perPage);

        $customers = Customer::query()->orderBy('name')->get();
        $currentStock = Stock::current();

        // Get purchases with remaining stock for the sale form
        // Also include purchases that are already used in existing sales for editing
        $usedPurchaseIds = \App\Models\SaleItem::query()
            ->pluck('purchase_id')
            ->unique()
            ->toArray();

        $availablePurchases = \App\Models\Purchase::query()
            ->with('supplier')
            ->get()
            ->filter(fn ($purchase): bool => $purchase->remaining_quantity > 0 || in_array($purchase->id, $usedPurchaseIds))
            ->map(fn ($purchase): array => [
                'id' => $purchase->id,
                'supplier_name' => $purchase->supplier->name,
                'purchase_date' => $purchase->purchase_date->format('Y-m-d'),
                'remaining_quantity' => $purchase->remaining_quantity,
                'price_per_kg' => $purchase->price_per_kg,
            ])
            ->values();

        // Get all purchases for the filter dropdown
        $allPurchasesForFilter = \App\Models\Purchase::query()
            ->with('supplier')
            ->latest('purchase_date')
            ->get()
            ->map(fn ($purchase): array => [
                'purchase_date' => $purchase->purchase_date->format('Y-m-d'),
                'supplier_name' => $purchase->supplier->name,
                'description' => $purchase->description,
                'quantity_kg' => $purchase->quantity_kg,
            ])
            ->values();

        // Calculate totals based on all active filters (search, customer_id, purchase_date)
        // Note: We don't include is_credit filter here as we need separate totals for credit/paid
        $totalsQuery = Sale::query()
            ->when($request->search, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $search) => $query->whereHas('customer', fn (\Illuminate\Database\Eloquent\Builder $q) => $q->where('name', 'like', '%'.(is_string($search) ? $search : '').'%')))
            ->when($request->customer_id, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $customerId) => $query->where('customer_id', is_numeric($customerId) ? (int) $customerId : $customerId))
            ->when($request->purchase_date, function (\Illuminate\Database\Eloquent\Builder $query, mixed $purchaseDate) {
                if (! is_string($purchaseDate)) {
                    return $query;
                }

                // Filter sales where ALL items are from purchases with the specified date
                return $query->whereDoesntHave('items.purchase', fn (\Illuminate\Database\Eloquent\Builder $q) => $q->whereDate('purchase_date', '!=', $purchaseDate))
                    ->whereHas('items.purchase', fn (\Illuminate\Database\Eloquent\Builder $q) => $q->whereDate('purchase_date', $purchaseDate));
            });

        $totals = [
            'total_sales' => (float) (clone $totalsQuery)->sum('total_amount'),
            'total_count' => (clone $totalsQuery)->count(),
            'credit_total' => (float) (clone $totalsQuery)->where('is_credit', true)->sum('total_amount'),
            'credit_count' => (clone $totalsQuery)->where('is_credit', true)->count(),
            'paid_total' => (float) (clone $totalsQuery)->where('is_credit', false)->sum('total_amount'),
            'paid_count' => (clone $totalsQuery)->where('is_credit', false)->count(),
        ];

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'customers' => $customers,
            'currentStock' => $currentStock,
            'availablePurchases' => $availablePurchases,
            'allPurchasesForFilter' => $allPurchasesForFilter,
            'totals' => $totals,
            'filters' => $request->only(['customer_id', 'is_credit', 'search', 'purchase_date']),
        ]);
    }

    public function store(StoreSaleRequest $request, CreateSale $action): RedirectResponse
    {
        // Authorization handled in StoreSaleRequest::authorize()
        $action->handle($request->validated());

        return back()->with('success', 'Sale created successfully.');
    }

    public function update(UpdateSaleRequest $request, Sale $sale, UpdateSale $action): RedirectResponse
    {
        // Authorization handled in UpdateSaleRequest::authorize()
        $action->handle($sale, $request->validated());

        return back()->with('success', 'Sale updated successfully.');
    }

    public function destroy(Sale $sale, DeleteSale $action): RedirectResponse
    {
        Gate::authorize('delete sales');

        $action->handle($sale);

        return back()->with('success', 'Sale deleted successfully.');
    }

    public function downloadReceipt(Sale $sale, GenerateReceipt $action): HttpResponse|RedirectResponse
    {
        Gate::authorize('download sales receipts');

        $receipt = $sale->activeReceipt ?? $sale->receipts()->latest()->first();

        if (! $receipt instanceof \App\Models\Receipt) {
            return back()->with('error', 'No receipt found for this sale.');
        }

        $pdf = $action->handle($receipt);
        $filename = $receipt->receipt_number.'.pdf';

        return $pdf->download($filename);
    }

    public function sendReceiptEmail(Sale $sale, SendReceiptEmail $action): RedirectResponse
    {
        Gate::authorize('email sales receipts');

        $receipt = $sale->activeReceipt ?? $sale->receipts()->latest()->first();

        if (! $receipt instanceof \App\Models\Receipt) {
            return back()->with('error', 'No receipt found for this sale.');
        }

        $action->handle($receipt);

        return back()->with('success', 'Receipt email sent successfully.');
    }
}
