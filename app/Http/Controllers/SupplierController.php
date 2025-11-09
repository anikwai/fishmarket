<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreateSupplier;
use App\Actions\DeleteSupplier;
use App\Actions\UpdateSupplier;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final readonly class SupplierController
{
    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 20, 25, 50]) ? (int) $perPage : 10;

        $query = Supplier::query()
            ->withSum('purchases', 'quantity_kg')
            ->when($request->search, fn ($query, $search) => $query->where('name', 'like', "%{$search}%"));

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if ($sortBy && in_array($sortDir, ['asc', 'desc'])) {
            $allowedSortColumns = [
                'name' => 'name',
                'total_purchases' => 'purchases_sum_quantity_kg',
                'remaining_stock' => 'id', // We'll handle this specially
                'created_at' => 'created_at',
            ];

            if (isset($allowedSortColumns[$sortBy])) {
                if ($sortBy === 'remaining_stock') {
                    // For remaining_stock, we need to sort after calculating
                    // We'll sort by ID for now and handle it in the transform
                    $query->orderBy('id', $sortDir);
                } else {
                    $query->orderBy($allowedSortColumns[$sortBy], $sortDir);
                }
            }
        } else {
            $query->latest();
        }

        $suppliers = $query->paginate($perPage);

        // Calculate remaining stock for each supplier
        $suppliers->getCollection()->transform(function (Supplier $supplier) {
            $supplier->remaining_stock = $supplier->remaining_stock;

            return $supplier;
        });

        // Sort by remaining_stock if needed (after calculation)
        if ($sortBy === 'remaining_stock' && in_array($sortDir, ['asc', 'desc'])) {
            $suppliers->getCollection()->sortBy(function (Supplier $supplier) {
                return (float) ($supplier->remaining_stock ?? 0);
            }, SORT_REGULAR, $sortDir === 'desc');
        }

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(StoreSupplierRequest $request, CreateSupplier $action): RedirectResponse
    {
        $action->handle($request->validated());

        return redirect()->back()->with('success', 'Supplier created successfully.');
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier, UpdateSupplier $action): RedirectResponse
    {
        $action->handle($supplier, $request->validated());

        return redirect()->back()->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Supplier $supplier, DeleteSupplier $action): RedirectResponse
    {
        $action->handle($supplier);

        return redirect()->back()->with('success', 'Supplier deleted successfully.');
    }
}
