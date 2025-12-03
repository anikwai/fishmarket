@php
    $fallbackReceiptNumber = 'RCP-' . date('Y') . '-' . str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT);
    $receiptNumber = $receipt->receipt_number ?? $fallbackReceiptNumber;
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt {{ $receiptNumber }}</title>
    @include('pdf.partials.styles', ['headerColor' => '#e91e63'])
    <style>
        /* Receipt-specific payment boxes */
        .payment-confirmation {
            background: #d4edda;
            border: 2px solid #c3e6cb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 32px;
            text-align: center;
            page-break-inside: avoid;
        }

        .payment-confirmation .title {
            font-size: 18px;
            font-weight: 700;
            color: #155724;
            margin-bottom: 8px;
        }

        .payment-confirmation .message {
            font-size: 13px;
            color: #155724;
            line-height: 1.6;
        }

        .credit-notice {
            background: #fff3cd;
            border: 2px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 32px;
            page-break-inside: avoid;
        }

        .credit-notice .title {
            font-size: 16px;
            font-weight: 700;
            color: #856404;
            margin-bottom: 8px;
        }

        .credit-notice .message {
            font-size: 13px;
            color: #856404;
            line-height: 1.7;
        }
    </style>
</head>
<body>
    <div class="receipt-wrapper">
        @include('pdf.partials.header', ['config' => [
            'headerColor' => '#1e88e5',
            'documentLabel' => 'Payment Receipt',
            'documentNumber' => $receiptNumber,
            'documentDate' => $sale->sale_date,
        ]])

        <div class="content">
            @include('pdf.partials.badges', ['config' => [
                'isCredit' => $sale->is_credit,
                'isDelivery' => $sale->is_delivery,
            ]])

            @php
                $leftSection = [
                    'title' => 'Customer Information',
                    'name' => $sale->customer->name,
                    'address' => $sale->customer->address ?? 'Honiara, Solomon Islands',
                    'email' => $sale->customer->email ?? null,
                    'phone' => $sale->customer->phone ?? null,
                ];

                $rightSection = [
                    'title' => 'Transaction Details',
                    'items' => [
                        ['label' => 'Receipt #', 'value' => $receiptNumber],
                        ['label' => 'Sale Date', 'value' => $sale->sale_date->format('F d, Y')],
                        ['label' => 'Order Type', 'value' => $sale->is_delivery ? 'Delivery' : 'Pickup'],
                        ['label' => 'Payment', 'value' => $sale->is_credit ? 'Credit Terms' : 'Paid at Sale'],
                    ]
                ];
            @endphp

            @include('pdf.partials.info-section', [
                'leftSection' => $leftSection,
                'rightSection' => $rightSection,
            ])

            {{-- Payment Confirmation or Credit Notice --}}
            @if($sale->is_credit)
                <div class="credit-notice">
                    <div class="title">Credit Sale</div>
                    <div class="message">
                        This sale was made on credit terms.
                        @if($sale->payments->count() > 0)
                            <br><strong>Payments Received:</strong> SBD {{ number_format($sale->payments->sum('amount'), 2) }}
                            <br><strong>Outstanding Balance:</strong> SBD {{ number_format($sale->outstanding_balance, 2) }}
                        @else
                            <br><strong>Total Amount Due:</strong> SBD {{ number_format($sale->total_amount, 2) }}
                        @endif
                    </div>
                </div>
            @else
                <div class="payment-confirmation">
                    <div class="title">✓ Payment Confirmed</div>
                    <div class="message">
                        Payment of <strong>SBD {{ number_format($sale->total_amount, 2) }}</strong> has been received in full.
                        Thank you for your business!
                    </div>
                </div>
            @endif

            @php
                $items = $sale->items->map(fn($item) => [
                    'description' => $item->purchase?->description ?? $item->purchase?->supplier?->name ?? 'Seafood',
                    'quantity' => number_format($item->quantity_kg, 2) . ' kg',
                    'price' => 'SBD ' . number_format($item->price_per_kg, 2),
                    'amount' => 'SBD ' . number_format($item->total_price, 2),
                ]);
            @endphp

            @include('pdf.partials.items-table', ['config' => [
                'sectionTitle' => 'Items Purchased',
                'showCode' => false,
                'items' => $items,
            ]])

            @include('pdf.partials.totals', ['config' => [
                'subtotal' => $sale->subtotal,
                'deliveryFee' => $sale->delivery_fee ?? 0,
                'total' => $sale->total_amount,
                'showDelivery' => true,
            ]])

            @include('pdf.partials.notes', ['notes' => $sale->notes])

            @include('pdf.partials.footer', ['config' => [
                'documentType' => 'Receipt',
                'documentNumber' => $receiptNumber,
            ]])
        </div>
    </div>
</body>
</html>
