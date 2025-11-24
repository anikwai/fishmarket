<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreatePurchase;
use App\Actions\DeletePurchase;
use App\Actions\GeneratePurchaseInvoice;
use App\Actions\PreparePurchaseIndexDataAction;
use App\Actions\SendPurchaseInvoiceEmail;
use App\Actions\UpdatePurchase;
use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\UpdatePurchaseRequest;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

final readonly class PurchaseController
{
    public function __construct(
        private PreparePurchaseIndexDataAction $preparePurchaseIndexData,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('view purchases');

        $perPage = $request->get('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 20, 25, 50]) ? (int) $perPage : 10; // @phpstan-ignore cast.int

        $query = Purchase::query()
            ->with('supplier')
            ->withSum('saleItems as sold_quantity', 'quantity_kg')
            ->withSum('expenses as total_expenses', 'amount')
            ->when($request->search, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $search) => $query->whereHas('supplier', fn (\Illuminate\Database\Eloquent\Builder $q) => $q->where('name', 'like', '%'.(is_string($search) ? $search : '').'%')))
            ->when($request->supplier_id, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $supplierId) => $query->where('supplier_id', is_numeric($supplierId) ? (int) $supplierId : $supplierId));

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if (is_string($sortBy) && is_string($sortDir) && in_array($sortDir, ['asc', 'desc'], true)) {
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

        $purchases = $this->preparePurchaseIndexData->handle($purchases, is_string($sortBy) ? $sortBy : null, is_string($sortDir) ? $sortDir : null);

        $suppliers = Supplier::query()->orderBy('name')->get();

        return Inertia::render('Purchases/Index', [
            'purchases' => $purchases,
            'suppliers' => $suppliers,
            'filters' => $request->only(['supplier_id', 'search']),
        ]);
    }

    public function store(StorePurchaseRequest $request, CreatePurchase $action): RedirectResponse
    {
        Gate::authorize('create purchases');

        $action->handle($request->validated());

        return back()->with('success', 'Purchase created successfully.');
    }

    public function update(UpdatePurchaseRequest $request, Purchase $purchase, UpdatePurchase $action): RedirectResponse
    {
        Gate::authorize('update purchases');

        $action->handle($purchase, $request->validated());

        return back()->with('success', 'Purchase updated successfully.');
    }

    public function destroy(Purchase $purchase, DeletePurchase $action): RedirectResponse
    {
        Gate::authorize('delete purchases');

        $action->handle($purchase);

        return back()->with('success', 'Purchase deleted successfully.');
    }

    public function downloadInvoice(Purchase $purchase, GeneratePurchaseInvoice $generator): HttpResponse
    {
        Gate::authorize('view purchases');

        $pdf = $generator->handle($purchase);
        $invoiceNumber = $purchase->invoice_number;

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$invoiceNumber.'.pdf"',
        ]);
    }

    public function sendInvoiceEmail(Purchase $purchase, SendPurchaseInvoiceEmail $sender): RedirectResponse
    {
        Gate::authorize('view purchases');

        if ($sender->handle($purchase)) {
            return back()->with('success', 'Invoice emailed to supplier successfully.');
        }

        return back()->with('error', 'Supplier has no email; invoice not sent.');
    }

    public function printInvoice(Request $request, Purchase $purchase, GeneratePurchaseInvoice $generator): HttpResponse
    {
        abort_unless((bool) $request->hasValidSignature(), 403);

        $pdf = $generator->handle($purchase);
        $invoiceNumber = $purchase->invoice_number;

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$invoiceNumber.'.pdf"',
        ]);
    }

    public function generateInvoiceLink(Purchase $purchase): JsonResponse
    {
        Gate::authorize('view purchases');

        $url = URL::temporarySignedRoute(
            'purchases.invoice.print',
            now()->addDays(7),
            ['purchase' => $purchase]
        );

        return response()->json(['url' => $url]);
    }
}
