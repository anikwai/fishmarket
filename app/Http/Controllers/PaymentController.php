<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreatePayment;
use App\Actions\DeletePayment;
use App\Actions\GetCreditSalesForPaymentAction;
use App\Actions\UpdatePayment;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final readonly class PaymentController
{
    public function __construct(
        private GetCreditSalesForPaymentAction $getCreditSalesForPayment,
    ) {}

    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 20, 25, 50]) ? (int) $perPage : 10;

        $query = Payment::query()
            ->with('sale.customer')
            ->when($request->search, fn ($query, $search) => $query->whereHas('sale.customer', fn ($q) => $q->where('name', 'like', "%{$search}%")))
            ->when($request->sale_id, fn ($query, $saleId) => $query->where('sale_id', $saleId));

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if ($sortBy && in_array($sortDir, ['asc', 'desc'])) {
            $allowedSortColumns = [
                'payment_date' => 'payment_date',
                'sale_id' => 'sale_id',
                'amount' => 'amount',
            ];

            if (isset($allowedSortColumns[$sortBy])) {
                $query->orderBy($allowedSortColumns[$sortBy], $sortDir);
            }
        } else {
            $query->latest();
        }

        $payments = $query->paginate($perPage);

        $creditSales = $this->getCreditSalesForPayment->handle();

        return Inertia::render('Payments/Index', [
            'payments' => $payments,
            'creditSales' => $creditSales,
            'filters' => $request->only(['search', 'sale_id']),
        ]);
    }

    public function store(StorePaymentRequest $request, CreatePayment $action): RedirectResponse
    {
        $action->handle($request->validated());

        return redirect()->back()->with('success', 'Payment created successfully.');
    }

    public function update(UpdatePaymentRequest $request, Payment $payment, UpdatePayment $action): RedirectResponse
    {
        $action->handle($payment, $request->validated());

        return redirect()->back()->with('success', 'Payment updated successfully.');
    }

    public function destroy(Payment $payment, DeletePayment $action): RedirectResponse
    {
        $action->handle($payment);

        return redirect()->back()->with('success', 'Payment deleted successfully.');
    }
}
