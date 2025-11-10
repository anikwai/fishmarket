<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreateCustomer;
use App\Actions\DeleteCustomer;
use App\Actions\UpdateCustomer;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final readonly class CustomerController
{
    public function index(Request $request): Response
    {
        $query = Customer::query()
            ->when($request->search, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $search) => $query->where('name', 'like', '%'.(is_string($search) ? $search : '').'%'))
            ->when($request->type, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $type) => $query->where('type', is_string($type) ? $type : ''));

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if (is_string($sortBy) && is_string($sortDir) && in_array($sortDir, ['asc', 'desc'], true)) {
            $allowedSortColumns = [
                'name' => 'name',
                'email' => 'email',
                'phone' => 'phone',
                'type' => 'type',
            ];

            if (isset($allowedSortColumns[$sortBy])) {
                $query->orderBy($allowedSortColumns[$sortBy], $sortDir);
            }
        } else {
            $query->latest();
        }

        $customers = $query->paginate(10);

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(StoreCustomerRequest $request, CreateCustomer $action): RedirectResponse
    {
        $action->handle($request->validated());

        return back()->with('success', 'Customer created successfully.');
    }

    public function update(UpdateCustomerRequest $request, Customer $customer, UpdateCustomer $action): RedirectResponse
    {
        $action->handle($customer, $request->validated());

        return back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer, DeleteCustomer $action): RedirectResponse
    {
        $action->handle($customer);

        return back()->with('success', 'Customer deleted successfully.');
    }
}
