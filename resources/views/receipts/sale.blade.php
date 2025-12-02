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
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            color: #2c2c2c;
            background: #f5f5f5;
            padding: 20px;
            font-size: 13px;
            line-height: 1.6;
        }

        .receipt-wrapper {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }

        /* Header */
        .header {
            background: #e91e63;
            color: white;
            padding: 30px 40px;
            page-break-inside: avoid;
        }

        .header table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .header td {
            vertical-align: top;
            color: white;
        }

        .header .logo-section {
            width: 55%;
            padding-right: 20px;
        }

        .header .receipt-section {
            width: 45%;
            text-align: right;
            padding-left: 20px;
        }

        .logo {
            width: 50px;
            height: 50px;
            background: white;
            border-radius: 6px;
            padding: 4px;
            margin-bottom: 10px;
            display: block;
        }

        .company-name {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 6px;
            letter-spacing: -0.3px;
        }

        .company-info {
            font-size: 12px;
            opacity: 0.95;
            line-height: 1.7;
        }

        .receipt-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            opacity: 0.9;
            margin-bottom: 8px;
        }

        .receipt-number {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
        }

        .receipt-date {
            font-size: 13px;
            opacity: 0.9;
        }

        /* Content */
        .content {
            padding: 36px 40px;
        }

        /* Status badges */
        .status-badges {
            margin-bottom: 28px;
        }

        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            margin-right: 6px;
            letter-spacing: 0.3px;
        }

        .badge.credit {
            background: #fff3cd;
            color: #856404;
        }

        .badge.paid {
            background: #d4edda;
            color: #155724;
        }

        .badge.delivery {
            background: #d1ecf1;
            color: #0c5460;
        }

        .badge.pickup {
            background: #e2e3e5;
            color: #383d41;
        }

        /* Info section */
        .info-section {
            margin-bottom: 32px;
        }

        .info-section table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-section td {
            width: 50%;
            padding: 18px;
            background: #fafafa;
            border: 1px solid #e5e5e5;
            vertical-align: top;
        }

        .info-section td:first-child {
            border-right: none;
            border-radius: 8px 0 0 8px;
        }

        .info-section td:last-child {
            border-radius: 0 8px 8px 0;
        }

        .info-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #666;
            margin-bottom: 10px;
            font-weight: 600;
        }

        .info-content {
            font-size: 13px;
            color: #2c2c2c;
            line-height: 1.7;
        }

        .info-content strong {
            font-size: 14px;
            font-weight: 600;
            display: block;
            margin-bottom: 4px;
            color: #000;
        }

        .info-content.muted {
            color: #666;
        }

        /* Section title */
        .section-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #666;
            margin-bottom: 12px;
            font-weight: 600;
        }

        /* Items table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            overflow: hidden;
        }

        .items-table thead {
            background: #f8f9fa;
        }

        .items-table th {
            padding: 12px 14px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #666;
            font-weight: 600;
            border-bottom: 2px solid #e5e5e5;
        }

        .items-table th.text-right {
            text-align: right;
        }

        .items-table tbody tr {
            border-bottom: 1px solid #f0f0f0;
        }

        .items-table tbody tr:last-child {
            border-bottom: none;
        }

        .items-table td {
            padding: 14px;
            font-size: 13px;
            color: #2c2c2c;
            vertical-align: top;
        }

        .items-table td.text-right {
            text-align: right;
        }

        .item-name {
            font-weight: 600;
            color: #000;
        }

        .amount {
            font-weight: 600;
            color: #000;
        }

        /* Totals */
        .totals-wrapper {
            text-align: right;
            margin-bottom: 24px;
        }

        .totals-table {
            display: inline-block;
            min-width: 300px;
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            padding: 16px 20px;
        }

        .totals-table table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 8px 0;
            font-size: 13px;
        }

        .totals-label {
            color: #666;
            font-weight: 500;
        }

        .totals-value {
            text-align: right;
            font-weight: 600;
            color: #2c2c2c;
        }

        .totals-table .subtotal-row td {
            border-bottom: 1px solid #e5e5e5;
            padding-bottom: 10px;
        }

        .totals-table .total-row td {
            padding-top: 12px;
            font-size: 18px;
            font-weight: 700;
            color: #000;
        }

        /* Payment confirmation box */
        .payment-confirmation {
            margin-bottom: 28px;
            padding: 16px 20px;
            background: #d4edda;
            border-left: 4px solid #28a745;
            border-radius: 6px;
        }

        .payment-confirmation .title {
            font-size: 12px;
            font-weight: 700;
            color: #155724;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .payment-confirmation .message {
            font-size: 13px;
            color: #155724;
            line-height: 1.6;
        }

        /* Credit notice */
        .credit-notice {
            margin-bottom: 28px;
            padding: 16px 20px;
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            border-radius: 6px;
        }

        .credit-notice .title {
            font-size: 12px;
            font-weight: 700;
            color: #856404;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .credit-notice .message {
            font-size: 13px;
            color: #856404;
            line-height: 1.6;
        }

        /* Notes */
        .notes-section {
            margin-bottom: 32px;
            padding: 16px;
            background: #f8f9fa;
            border-left: 4px solid #6c757d;
            border-radius: 6px;
        }

        .notes-title {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #666;
            margin-bottom: 8px;
            font-weight: 600;
        }

        .notes-content {
            font-size: 13px;
            color: #444;
            line-height: 1.6;
        }

        /* Footer */
        .footer {
            border-top: 1px solid #e5e5e5;
            padding-top: 24px;
            margin-top: 32px;
        }

        .footer table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer td {
            width: 50%;
            padding: 0 12px;
            vertical-align: top;
        }

        .footer h4 {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #666;
            margin-bottom: 10px;
            font-weight: 600;
        }

        .footer p {
            font-size: 12px;
            color: #666;
            line-height: 1.7;
        }

        .footer .highlight {
            font-weight: 600;
            color: #000;
        }

        .generator {
            text-align: center;
            font-size: 10px;
            color: #999;
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #f0f0f0;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .receipt-wrapper {
                box-shadow: none;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-wrapper">
        <!-- Header -->
        <div class="header" style="background-color: #e91e63; color: white; padding: 30px 40px; page-break-inside: avoid;">
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                <tr>
                    <td class="logo-section" style="width: 55%; padding-right: 20px; vertical-align: top; color: white;">
                        <img src="{{ public_path('TZ_logo.png') }}" alt="TZ Holding" class="logo" style="width: 50px; height: 50px; background: white; border-radius: 6px; padding: 4px; margin-bottom: 10px; display: block;">
                        <div class="company-name" style="font-size: 22px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.3px; color: white;">TZ HOLDING LIMITED</div>
                        <div class="company-info" style="font-size: 12px; opacity: 0.95; line-height: 1.7; color: white;">
                            Tax ID: 20231076<br>
                            P O Box 407, Honiara<br>
                            Solomon Islands
                        </div>
                    </td>
                    <td class="receipt-section" style="width: 45%; text-align: right; padding-left: 20px; vertical-align: top; color: white;">
                        <div class="receipt-label" style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; margin-bottom: 8px; color: white;">Payment Receipt</div>
                        <div class="receipt-number" style="font-size: 28px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.5px; color: white;">{{ $receiptNumber }}</div>
                        <div class="receipt-date" style="font-size: 13px; opacity: 0.9; color: white;">{{ $sale->sale_date->format('F d, Y') }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Status badges -->
            <div class="status-badges">
                @if($sale->is_credit)
                    <span class="badge credit">Payment on Credit</span>
                @else
                    <span class="badge paid">Paid in Full</span>
                @endif
                @if($sale->is_delivery)
                    <span class="badge delivery">Delivery Included</span>
                @else
                    <span class="badge pickup">Pickup</span>
                @endif
            </div>

            <!-- Customer Info & Transaction Details -->
            <div class="info-section">
                <table>
                    <tr>
                        <td>
                            <div class="info-label">Customer Information</div>
                            <div class="info-content">
                                <strong>{{ $sale->customer->name }}</strong>
                                @if($sale->customer->address)
                                    {{ $sale->customer->address }}<br>
                                @else
                                    Honiara, Solomon Islands<br>
                                @endif
                                @if($sale->customer->email)
                                    {{ $sale->customer->email }}<br>
                                @endif
                                @if($sale->customer->phone)
                                    {{ $sale->customer->phone }}
                                @endif
                            </div>
                        </td>
                        <td>
                            <div class="info-label">Transaction Details</div>
                            <div class="info-content muted">
                                <strong>Receipt #{{ str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT) }}</strong>
                                Order Type: {{ $sale->is_delivery ? 'Delivery' : 'Pickup' }}<br>
                                Payment: {{ $sale->is_credit ? 'Credit Terms' : 'Immediate' }}<br>
                                Date: {{ $sale->sale_date->format('M d, Y') }}
                            </div>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Payment Confirmation or Credit Notice -->
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

            <!-- Items -->
            <div class="section-title">Items Purchased</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 45%;">Description</th>
                        <th class="text-right" style="width: 20%;">Quantity</th>
                        <th class="text-right" style="width: 18%;">Price</th>
                        <th class="text-right" style="width: 17%;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($sale->items as $item)
                        <tr>
                            <td><span class="item-name">{{ $item->purchase?->description ?? $item->purchase?->supplier?->name ?? 'Seafood' }}</span></td>
                            <td class="text-right">{{ number_format($item->quantity_kg, 2) }} kg</td>
                            <td class="text-right">SBD {{ number_format($item->price_per_kg, 2) }}</td>
                            <td class="text-right amount">SBD {{ number_format($item->total_price, 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <!-- Totals -->
            <div class="totals-wrapper">
                <div class="totals-table">
                    <table>
                        @if($sale->delivery_fee > 0)
                            <tr class="subtotal-row">
                                <td class="totals-label">Subtotal</td>
                                <td class="totals-value">SBD {{ number_format($sale->subtotal, 2) }}</td>
                            </tr>
                            <tr class="subtotal-row">
                                <td class="totals-label">Delivery Fee</td>
                                <td class="totals-value">SBD {{ number_format($sale->delivery_fee, 2) }}</td>
                            </tr>
                        @else
                            <tr class="subtotal-row">
                                <td class="totals-label">Subtotal</td>
                                <td class="totals-value">SBD {{ number_format($sale->subtotal, 2) }}</td>
                            </tr>
                        @endif
                        <tr class="total-row">
                            <td class="totals-label">Total Amount</td>
                            <td class="totals-value">SBD {{ number_format($sale->total_amount, 2) }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Notes -->
            @if($sale->notes)
                <div class="notes-section">
                    <div class="notes-title">Additional Notes</div>
                    <div class="notes-content">{{ $sale->notes }}</div>
                </div>
            @endif

            <!-- Footer -->
            <div class="footer">
                <table>
                    <tr>
                        <td>
                            <h4>Payment Information</h4>
                            <p>
                                <span class="highlight">BSP Account</span><br>
                                Account Name: TZ Holding Limited<br>
                                Account #: 2001682364
                            </p>
                        </td>
                        <td>
                            <h4>Questions or Support</h4>
                            <p>
                                Contact: Zefi<br>
                                Phone: +677 7799978<br>
                                Location: Honiara, Solomon Islands
                            </p>
                        </td>
                    </tr>
                </table>

                <div class="generator">
                    Generated by {{ config('app.name') }} • Receipt {{ $receiptNumber }}
                </div>
            </div>
        </div>
    </div>
</body>
</html>
