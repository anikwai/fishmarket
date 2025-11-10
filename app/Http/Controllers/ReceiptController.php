<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\GenerateReceipt;
use App\Actions\ReissueReceiptAction;
use App\Actions\SendReceiptEmail;
use App\Actions\VoidReceiptAction;
use App\Http\Requests\VoidReceiptRequest;
use App\Models\Receipt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

final readonly class ReceiptController
{
    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 20, 25, 50]) ? (int) $perPage : 10; // @phpstan-ignore cast.int

        $query = Receipt::query()
            ->with(['sale.customer'])
            ->when($request->search, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $search) => $query->where(function (\Illuminate\Database\Eloquent\Builder $q) use ($search): void {
                $searchStr = is_string($search) ? $search : '';
                $q->where('receipt_number', 'like', '%'.$searchStr.'%')
                    ->orWhereHas('sale.customer', fn (\Illuminate\Database\Eloquent\Builder $q) => $q->where('name', 'like', '%'.$searchStr.'%'));
            }))
            ->when($request->status, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $status) => $query->where('status', is_string($status) ? $status : ''));

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if (is_string($sortBy) && is_string($sortDir) && in_array($sortDir, ['asc', 'desc'], true)) {
            $allowedSortColumns = [
                'receipt_number' => 'receipt_number',
                'issued_at' => 'issued_at',
                'status' => 'status',
            ];

            if (isset($allowedSortColumns[$sortBy])) {
                $query->orderBy($allowedSortColumns[$sortBy], $sortDir);
            }
        } else {
            $query->latest('issued_at');
        }

        $receipts = $query->paginate($perPage);

        return Inertia::render('Receipts/Index', [
            'receipts' => $receipts,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function download(Receipt $receipt, GenerateReceipt $action): HttpResponse
    {
        $pdf = $action->handle($receipt);
        $filename = $receipt->receipt_number.'.pdf';

        return $pdf->download($filename);
    }

    public function sendEmail(Receipt $receipt, SendReceiptEmail $action): RedirectResponse
    {
        $action->handle($receipt);

        return back()->with('success', 'Receipt email sent successfully.');
    }

    public function void(VoidReceiptRequest $request, Receipt $receipt, VoidReceiptAction $action): RedirectResponse
    {
        $validated = $request->validated();
        $reason = $validated['reason'] ?? '';

        if (! is_string($reason)) {
            $reason = '';
        }

        $action->handle($receipt, $reason);

        return back()->with('success', 'Receipt voided successfully.');
    }

    public function reissue(Receipt $receipt, ReissueReceiptAction $action): RedirectResponse
    {
        $newReceipt = $action->handle($receipt);
        $receiptNumber = $newReceipt->receipt_number;

        return back()->with('success', 'Receipt reissued successfully. New receipt number: '.$receiptNumber);
    }
}
