<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ str_pad((string) $purchase->id, 6, '0', STR_PAD_LEFT) }}</title>
    <style>
        /* Theme Colors derived from app.css (converted to Hex for DomPDF support) */
        :root {
            --primary: #171717;
            --primary-foreground: #ffffff;
            --muted: #f5f5f5;
            --muted-foreground: #737373;
            --border: #e5e5e5;
            --card: #ffffff;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #171717; /* --foreground */
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
        }

        /* Layout Helpers */
        .w-full { width: 100%; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-sm { font-size: 12px; }
        .text-xs { font-size: 10px; }
        .uppercase { text-transform: uppercase; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mt-8 { margin-top: 2rem; }
        .p-4 { padding: 1rem; }
        
        /* Colors */
        .text-muted-foreground { color: #737373; }
        .bg-muted { background-color: #f5f5f5; }
        .border-b { border-bottom: 1px solid #e5e5e5; }

        /* Header */
        .header-table {
            width: 100%;
            margin-bottom: 40px;
        }
        .logo-container {
            width: 50%;
            vertical-align: top;
        }
        .invoice-details {
            width: 50%;
            vertical-align: top;
            text-align: right;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #171717;
        }
        .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: #171717;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }

        /* Info Section */
        .info-table {
            width: 100%;
            margin-bottom: 40px;
        }
        .info-col {
            width: 48%;
            vertical-align: top;
        }
        .info-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #737373; /* muted-foreground */
            font-weight: bold;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .info-value {
            font-size: 14px;
            color: #171717;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            text-align: left;
            padding: 12px 10px;
            border-bottom: 1px solid #e5e5e5;
            color: #737373;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        .items-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #f5f5f5;
            font-size: 13px;
        }
        .items-table .text-right {
            text-align: right;
        }
        .items-table tbody tr:last-child td {
            border-bottom: 1px solid #e5e5e5;
        }

        /* Totals */
        .totals-table {
            width: 40%;
            margin-left: auto;
            border-collapse: collapse;
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
            padding-top: 15px;
            padding-bottom: 15px;
        }
        .total-row .totals-value {
            font-size: 18px;
            font-weight: bold;
            color: #171717;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 0;
            left: 40px;
            right: 40px;
            border-top: 1px solid #e5e5e5;
            padding-top: 20px;
            text-align: center;
            color: #737373;
            font-size: 11px;
        }
        .footer-content {
            display: block;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td class="logo-container">
                <!-- Placeholder for Logo if available -->
                <!-- <img src="{{ public_path('TZ_logo.png') }}" alt="Logo" style="height: 60px; margin-bottom: 15px;"> -->
                <div class="company-name">TZ HOLDING LIMITED</div>
                <div class="text-sm text-muted-foreground">
                    20231076<br>
                    P O Box 407, Honiara<br>
                    Solomon Islands
                </div>
            </td>
            <td class="invoice-details">
                <div class="invoice-title">INVOICE</div>
                <table style="margin-left: auto;">
                    <tr>
                        <td class="text-right text-muted-foreground text-sm" style="padding-right: 15px;">Invoice No:</td>
                        <td class="text-right font-bold">#{{ str_pad((string) $purchase->id, 6, '0', STR_PAD_LEFT) }}</td>
                    </tr>
                    <tr>
                        <td class="text-right text-muted-foreground text-sm" style="padding-right: 15px;">Date:</td>
                        <td class="text-right font-bold">{{ $purchase->purchase_date->format('M d, Y') }}</td>
                    </tr>
                    <tr>
                        <td class="text-right text-muted-foreground text-sm" style="padding-right: 15px;">Quotation:</td>
                        <td class="text-right font-bold">{{ str_pad((string) $purchase->id, 8, '0', STR_PAD_LEFT) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="info-table">
        <tr>
            <td class="info-col">
                <div class="info-label">Bill To</div>
                <div class="info-value font-bold">{{ $purchase->supplier->name }}</div>
                <div class="info-value text-muted-foreground">
                    {{ $purchase->supplier->address ?? 'TZ HOLDING LIMITED' }}<br>
                    {{ $purchase->supplier->city ?? 'Honiara, SI' }}<br>
                    {{ $purchase->supplier->phone ?? '' }}
                </div>
            </td>
            <td style="width: 4%;"></td>
            <td class="info-col">
                @if($purchase->notes)
                <div class="info-label">Notes</div>
                <div class="info-value text-muted-foreground">{{ $purchase->notes }}</div>
                @endif
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 10%;">Code</th>
                <th style="width: 40%;">Description</th>
                <th class="text-right" style="width: 15%;">Quantity</th>
                <th class="text-right" style="width: 15%;">Price</th>
                <th class="text-right" style="width: 20%;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>P{{ $purchase->id }}</td>
                <td>
                    <span class="font-bold" style="display: block; margin-bottom: 2px;">Fish Purchase</span>
                    <span class="text-muted-foreground text-xs">{{ $purchase->notes ?: 'Fresh Stock' }}</span>
                </td>
                <td class="text-right">{{ number_format($purchase->quantity_kg, 2) }} kg</td>
                <td class="text-right">SBD {{ number_format($purchase->price_per_kg, 2) }}</td>
                <td class="text-right">SBD {{ number_format($purchase->total_cost, 2) }}</td>
            </tr>
            <!-- Fill lines to maintain structure if needed, or just clean whitespace -->
            @for($i = 0; $i < 3; $i++)
            <tr>
                <td colspan="5" style="height: 30px;"></td>
            </tr>
            @endfor
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td class="totals-label">Subtotal</td>
            <td class="totals-value">SBD {{ number_format($purchase->total_cost, 2) }}</td>
        </tr>
        <tr>
            <td class="totals-label">Discount</td>
            <td class="totals-value">SBD 0.00</td>
        </tr>
        <tr class="total-row">
            <td class="totals-label text-sm" style="vertical-align: middle;">Total</td>
            <td class="totals-value">SBD {{ number_format($purchase->total_cost, 2) }}</td>
        </tr>
    </table>

    <div class="footer">
        <div class="footer-content">
            <p class="font-bold mb-1">Payments can be made to BSP Account Name: TZ Holding Limited Account # : 2001682364</p>
            <p>Should you have any enquiries concerning this invoice, please contact Zefi on +677 7799978, Honiara, Solomon Islands</p>
            <p style="margin-top: 10px;">Generated by {{ config('app.name') }}</p>
        </div>
    </div>
</body>
</html>
