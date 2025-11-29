<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreatePurchase;
use App\Actions\DeletePurchase;
use App\Actions\GeneratePurchaseReceipt;
use App\Actions\PreparePurchaseIndexDataAction;
use App\Actions\UpdatePurchase;
use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\UpdatePurchaseRequest;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
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

        /** @var array<string, mixed> $payload */
        $payload = $request->validated();

        $supplierIdInput = $request->input('supplier_id');
        $supplierId = is_numeric($supplierIdInput) ? (int) $supplierIdInput : 0;

        $data = $this->withSupplierDocuments(
            $payload,
            $request->file('supplier_invoice_file'),
            $request->file('supplier_receipt_file'),
            $supplierId
        );

        $action->handle($data);

        return back()->with('success', 'Purchase created successfully.');
    }

    public function update(UpdatePurchaseRequest $request, Purchase $purchase, UpdatePurchase $action): RedirectResponse
    {
        Gate::authorize('update purchases');

        /** @var array<string, mixed> $payload */
        $payload = $request->validated();

        $supplierIdInput = $request->input('supplier_id', $purchase->supplier_id);
        $supplierId = is_numeric($supplierIdInput) ? (int) $supplierIdInput : $purchase->supplier_id;

        $data = $this->withSupplierDocuments(
            $payload,
            $request->file('supplier_invoice_file'),
            $request->file('supplier_receipt_file'),
            $supplierId,
            $purchase
        );

        $action->handle($purchase, $data);

        return back()->with('success', 'Purchase updated successfully.');
    }

    public function destroy(Purchase $purchase, DeletePurchase $action): RedirectResponse
    {
        Gate::authorize('delete purchases');

        $action->handle($purchase);

        return back()->with('success', 'Purchase deleted successfully.');
    }

    public function downloadReceipt(Purchase $purchase, GeneratePurchaseReceipt $generator): HttpResponse
    {
        Gate::authorize('view purchases');

        $pdf = $generator->handle($purchase);
        $receiptNumber = $purchase->receipt_number;

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$receiptNumber.'.pdf"',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function withSupplierDocuments(array $data, ?\Illuminate\Http\UploadedFile $invoiceFile, ?\Illuminate\Http\UploadedFile $receiptFile, int $supplierId, ?Purchase $existing = null): array
    {
        if ($invoiceFile instanceof \Illuminate\Http\UploadedFile) {
            if ($existing?->supplier_invoice_path) {
                Storage::disk('public')->delete($existing->supplier_invoice_path);
            }

            $path = $invoiceFile->store("purchases/{$supplierId}/supplier-invoices", 'public');
            $data['supplier_invoice_path'] = $path;
            $data['supplier_invoice_original_name'] = $invoiceFile->getClientOriginalName();
        }

        if ($receiptFile instanceof \Illuminate\Http\UploadedFile) {
            if ($existing?->supplier_receipt_path) {
                Storage::disk('public')->delete($existing->supplier_receipt_path);
            }

            $path = $receiptFile->store("purchases/{$supplierId}/supplier-receipts", 'public');
            $data['supplier_receipt_path'] = $path;
            $data['supplier_receipt_original_name'] = $receiptFile->getClientOriginalName();
        }

        unset($data['supplier_invoice_file'], $data['supplier_receipt_file']);

        return $data;
    }
}
