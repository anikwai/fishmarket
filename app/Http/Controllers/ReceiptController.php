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
        $perPage = in_array($perPage, [10, 15, 20, 25, 50]) ? (int) $perPage : 10;

        $query = Receipt::query()
            ->with(['sale.customer'])
            ->when($request->search, fn ($query, $search) => $query->where(function ($q) use ($search) {
                $q->where('receipt_number', 'like', "%{$search}%")
                    ->orWhereHas('sale.customer', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            }))
            ->when($request->status, fn ($query, $status) => $query->where('status', $status));

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if ($sortBy && in_array($sortDir, ['asc', 'desc'])) {
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

        return $pdf->download($receipt->receipt_number.'.pdf');
    }

    public function sendEmail(Receipt $receipt, SendReceiptEmail $action): RedirectResponse
    {
        $action->handle($receipt);

        return redirect()->back()->with('success', 'Receipt email sent successfully.');
    }

    public function void(VoidReceiptRequest $request, Receipt $receipt, VoidReceiptAction $action): RedirectResponse
    {
        $action->handle($receipt, $request->validated()['reason']);

        return redirect()->back()->with('success', 'Receipt voided successfully.');
    }

    public function reissue(Receipt $receipt, ReissueReceiptAction $action): RedirectResponse
    {
        $newReceipt = $action->handle($receipt);

        return redirect()->back()->with('success', 'Receipt reissued successfully. New receipt number: '.$newReceipt->receipt_number);
    }
}
