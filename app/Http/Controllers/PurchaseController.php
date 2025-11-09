<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreatePurchase;
use App\Actions\DeletePurchase;
use App\Actions\UpdatePurchase;
use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\UpdatePurchaseRequest;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final readonly class PurchaseController
{
    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 20, 25, 50]) ? (int) $perPage : 10;

        $query = Purchase::query()
            ->with('supplier')
            ->withSum('sales as sold_quantity', 'purchase_sale.quantity_kg')
            ->withSum('expenses as total_expenses', 'amount')
            ->when($request->search, fn ($query, $search) => $query->whereHas('supplier', fn ($q) => $q->where('name', 'like', "%{$search}%")))
            ->when($request->supplier_id, fn ($query, $supplierId) => $query->where('supplier_id', $supplierId));

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if ($sortBy && in_array($sortDir, ['asc', 'desc'])) {
            $allowedSortColumns = [
                'purchase_date' => 'purchase_date',
                'supplier.name' => 'supplier_id', // Will sort by supplier name via join
                'quantity_kg' => 'quantity_kg',
                'total_cost' => 'total_cost',
                'profit' => 'id', // Will sort after calculation
            ];

            if (isset($allowedSortColumns[$sortBy])) {
                if ($sortBy === 'supplier.name') {
                    $query->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
                        ->orderBy('suppliers.name', $sortDir)
                        ->select('purchases.*');
                } else {
                    $query->orderBy($allowedSortColumns[$sortBy], $sortDir);
                }
            }
        } else {
            $query->latest();
        }

        $purchases = $query->paginate($perPage);

        // Calculate profit for each purchase
        $purchases->getCollection()->transform(function (Purchase $purchase) {
            // Load sales relationship with pivot data
            $purchase->load(['sales' => function ($query) {
                $query->withPivot('quantity_kg');
            }, 'expenses']);

            // Access the accessors to calculate values
            $purchase->profit = $purchase->profit;
            $purchase->total_revenue = $purchase->total_revenue;
            $purchase->remaining_quantity = $purchase->remaining_quantity;
            $purchase->total_expenses = $purchase->total_expenses;

            return $purchase;
        });

        // Sort by profit if needed (after calculation)
        if ($sortBy === 'profit' && in_array($sortDir, ['asc', 'desc'])) {
            $purchases->getCollection()->sortBy(function (Purchase $purchase) {
                return (float) ($purchase->profit ?? 0);
            }, SORT_REGULAR, $sortDir === 'desc');
        }

        $suppliers = Supplier::query()->orderBy('name')->get();

        return Inertia::render('Purchases/Index', [
            'purchases' => $purchases,
            'suppliers' => $suppliers,
            'filters' => $request->only(['supplier_id', 'search']),
        ]);
    }

    public function store(StorePurchaseRequest $request, CreatePurchase $action): RedirectResponse
    {
        $action->handle($request->validated());

        return redirect()->back()->with('success', 'Purchase created successfully.');
    }

    public function update(UpdatePurchaseRequest $request, Purchase $purchase, UpdatePurchase $action): RedirectResponse
    {
        $action->handle($purchase, $request->validated());

        return redirect()->back()->with('success', 'Purchase updated successfully.');
    }

    public function destroy(Purchase $purchase, DeletePurchase $action): RedirectResponse
    {
        $action->handle($purchase);

        return redirect()->back()->with('success', 'Purchase deleted successfully.');
    }
}
