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
            ->when($request->search, fn ($query, $search) => $query->where('name', 'like', "%{$search}%"))
            ->when($request->type, fn ($query, $type) => $query->where('type', $type));

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if ($sortBy && in_array($sortDir, ['asc', 'desc'])) {
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

        return redirect()->back()->with('success', 'Customer created successfully.');
    }

    public function update(UpdateCustomerRequest $request, Customer $customer, UpdateCustomer $action): RedirectResponse
    {
        $action->handle($customer, $request->validated());

        return redirect()->back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer, DeleteCustomer $action): RedirectResponse
    {
        $action->handle($customer);

        return redirect()->back()->with('success', 'Customer deleted successfully.');
    }
}
