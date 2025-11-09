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
use Inertia\Inertia;
use Inertia\Response;

final readonly class SaleController
{
    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 20, 25, 50]) ? (int) $perPage : 10;

        $query = Sale::query()
            ->with(['customer', 'payments'])
            ->when($request->search, fn ($query, $search) => $query->whereHas('customer', fn ($q) => $q->where('name', 'like', "%{$search}%")))
            ->when($request->customer_id, fn ($query, $customerId) => $query->where('customer_id', $customerId))
            ->when($request->has('is_credit'), fn ($query) => $query->where('is_credit', $request->boolean('is_credit')));

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if ($sortBy && in_array($sortDir, ['asc', 'desc'])) {
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

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'customers' => $customers,
            'currentStock' => $currentStock,
            'filters' => $request->only(['customer_id', 'is_credit', 'search']),
        ]);
    }

    public function store(StoreSaleRequest $request, CreateSale $action): RedirectResponse
    {
        $action->handle($request->validated());

        return back()->with('success', 'Sale created successfully.');
    }

    public function update(UpdateSaleRequest $request, Sale $sale, UpdateSale $action): RedirectResponse
    {
        $action->handle($sale, $request->validated());

        return back()->with('success', 'Sale updated successfully.');
    }

    public function destroy(Sale $sale, DeleteSale $action): RedirectResponse
    {
        $action->handle($sale);

        return back()->with('success', 'Sale deleted successfully.');
    }

    public function downloadReceipt(Sale $sale, GenerateReceipt $action): HttpResponse
    {
        $receipt = $sale->activeReceipt ?? $sale->receipts()->latest()->first();

        if (! $receipt) {
            return back()->with('error', 'No receipt found for this sale.');
        }

        $pdf = $action->handle($receipt);

        return $pdf->download($receipt->receipt_number.'.pdf');
    }

    public function sendReceiptEmail(Sale $sale, SendReceiptEmail $action): RedirectResponse
    {
        $receipt = $sale->activeReceipt ?? $sale->receipts()->latest()->first();

        if (! $receipt) {
            return back()->with('error', 'No receipt found for this sale.');
        }

        $action->handle($receipt);

        return back()->with('success', 'Receipt email sent successfully.');
    }
}
