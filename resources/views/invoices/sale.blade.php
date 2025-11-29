<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $sale->invoice_number }}</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #171717;
            margin: 0;
            padding: 40px;
            background: #fafafa;
            font-size: 13px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: top;
        }
        .logo-container {
            width: 60%;
        }
        .company-name {
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .invoice-details {
            text-align: right;
            width: 40%;
        }
        .invoice-title {
            font-size: 26px;
            letter-spacing: 1px;
            margin-bottom: 8px;
            color: #0f172a;
        }
        .text-muted-foreground {
            color: #737373;
        }
        .text-sm { font-size: 12px; }
        .text-xs { font-size: 11px; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 600; }
        .info-table {
            margin-top: 30px;
            margin-bottom: 20px;
        }
        .info-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #6b7280;
            margin-bottom: 6px;
        }
        .info-value {
            font-size: 14px;
            color: #111827;
        }
        .items-table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
        }
        .items-table th {
            text-align: left;
            padding: 10px 12px;
            background: #f4f4f5;
            color: #52525b;
            font-size: 12px;
            font-weight: 600;
            border-bottom: 1px solid #e5e5e5;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e5e5;
            font-size: 13px;
            color: #111827;
        }
        .items-table td.text-right,
        .items-table th.text-right {
            text-align: right;
        }
        .totals-table {
            width: 45%;
            margin-left: auto;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .totals-table td {
            padding: 8px 10px;
        }
        .totals-label {
            color: #737373;
            font-size: 13px;
        }
        .totals-value {
            font-weight: 600;
            text-align: right;
            font-size: 13px;
        }
        .total-row td {
            border-top: 1px solid #e5e5e5;
            padding-top: 12px;
            padding-bottom: 12px;
        }
        .total-row .totals-value {
            font-size: 18px;
            font-weight: bold;
            color: #171717;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 40px;
            right: 40px;
            border-top: 1px solid #e5e5e5;
            padding-top: 16px;
            text-align: center;
            color: #737373;
            font-size: 11px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.3px;
        }
        .badge.credit {
            background: #fef3c7;
            color: #92400e;
        }
        .badge.paid {
            background: #dcfce7;
            color: #166534;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td class="logo-container">
                <img src="{{ public_path('TZ_logo.png') }}" alt="Logo" style="height: 60px; margin-bottom: 15px;">
                <div class="company-name">TZ HOLDING LIMITED</div>
                <div class="text-sm text-muted-foreground">
                    20231076<br>
                    P O Box 407, Honiara<br>
                    Solomon Islands
                </div>
            </td>
            <td class="invoice-details">
                <div class="invoice-title">SALES INVOICE</div>
                <table style="margin-left: auto;">
                    <tr>
                        <td class="text-right text-muted-foreground text-sm" style="padding-right: 15px;">Invoice No:</td>
                        <td class="text-right font-bold">{{ $sale->invoice_number }}</td>
                    </tr>
                    <tr>
                        <td class="text-right text-muted-foreground text-sm" style="padding-right: 15px;">Date:</td>
                        <td class="text-right font-bold">{{ $sale->sale_date->format('M d, Y') }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="info-table">
        <tr>
            <td class="info-col">
                <div class="info-label">Bill To</div>
                <div class="info-value font-bold">{{ $sale->customer->name }}</div>
                <div class="info-value text-muted-foreground">
                    {{ $sale->customer->address ?: 'Honiara, Solomon Islands' }}<br>
                    {{ $sale->customer->email ?: '' }}<br>
                    {{ $sale->customer->phone ?: '' }}
                </div>
            </td>
            <td style="width: 4%;"></td>
            <td class="info-col">
                <div class="info-label">Reference</div>
                <div class="info-value text-muted-foreground">
                    Sale #{{ str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT) }}<br>
                    {{ $sale->is_delivery ? 'Delivery Included' : 'Pickup' }}<br>
                    {{ $sale->is_credit ? 'Payment on Credit' : 'Paid at Sale' }}
                </div>
                @if($sale->notes)
                    <div class="info-label" style="margin-top: 12px;">Notes</div>
                    <div class="info-value text-muted-foreground">{{ $sale->notes }}</div>
                @endif
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 12%;">Code</th>
                <th style="width: 42%;">Description</th>
                <th class="text-right" style="width: 16%;">Quantity</th>
                <th class="text-right" style="width: 15%;">Price</th>
                <th class="text-right" style="width: 15%;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($sale->items as $item)
                <tr>
                    <td>S{{ str_pad((string) $item->id, 5, '0', STR_PAD_LEFT) }}</td>
                    <td>
                        <span class="font-bold" style="display: block; margin-bottom: 2px;">
                            {{ $item->purchase->description ?? $item->purchase->supplier->name ?? 'Seafood' }}
                        </span>
                        <span class="text-muted-foreground text-xs">
                            From purchase #{{ $item->purchase->id }} &bullet; Supplier: {{ $item->purchase->supplier->name ?? 'N/A' }}
                        </span>
                    </td>
                    <td class="text-right">{{ number_format($item->quantity_kg, 2) }} kg</td>
                    <td class="text-right">SBD {{ number_format($item->price_per_kg, 2) }}</td>
                    <td class="text-right">SBD {{ number_format($item->total_price, 2) }}</td>
                </tr>
            @endforeach
            @for($i = 0; $i < max(0, 4 - $sale->items->count()); $i++)
                <tr>
                    <td colspan="5" style="height: 26px;"></td>
                </tr>
            @endfor
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td class="totals-label">Subtotal</td>
            <td class="totals-value">SBD {{ number_format($sale->subtotal, 2) }}</td>
        </tr>
        @if($sale->delivery_fee > 0)
            <tr>
                <td class="totals-label">Delivery Fee</td>
                <td class="totals-value">SBD {{ number_format($sale->delivery_fee, 2) }}</td>
            </tr>
        @endif
        <tr class="total-row">
            <td class="totals-label text-sm" style="vertical-align: middle;">Total</td>
            <td class="totals-value">SBD {{ number_format($sale->total_amount, 2) }}</td>
        </tr>
    </table>

    <div class="footer">
        <div class="footer-content">
            <p class="font-bold mb-1">Payments can be made to BSP Account Name: TZ Holding Limited Account # : 2001682364</p>
            <p>For questions about this invoice, contact Zefi on +677 7799978, Honiara, Solomon Islands</p>
            <p style="margin-top: 8px;">Generated by {{ config('app.name') }}</p>
        </div>
    </div>
</body>
</html>
