<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreateSupplier;
use App\Actions\DeleteSupplier;
use App\Actions\PrepareSupplierIndexDataAction;
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
    public function __construct(
        private PrepareSupplierIndexDataAction $prepareSupplierIndexData,
    ) {}

    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 20, 25, 50]) ? (int) $perPage : 10; // @phpstan-ignore cast.int

        $query = Supplier::query()
            ->withSum('purchases', 'quantity_kg')
            ->when($request->search, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $search) => $query->where('name', 'like', '%'.(is_string($search) ? $search : '').'%'));

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if (is_string($sortBy) && is_string($sortDir) && in_array($sortDir, ['asc', 'desc'], true)) {
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

        $suppliers = $this->prepareSupplierIndexData->handle($suppliers, is_string($sortBy) ? $sortBy : null, is_string($sortDir) ? $sortDir : null);

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(StoreSupplierRequest $request, CreateSupplier $action): RedirectResponse
    {
        $action->handle($request->validated());

        return back()->with('success', 'Supplier created successfully.');
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier, UpdateSupplier $action): RedirectResponse
    {
        $action->handle($supplier, $request->validated());

        return back()->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Supplier $supplier, DeleteSupplier $action): RedirectResponse
    {
        $action->handle($supplier);

        return back()->with('success', 'Supplier deleted successfully.');
    }
}
