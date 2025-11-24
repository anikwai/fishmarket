<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt #{{ $sale->id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            display: block;
        }
        .receipt-info {
            margin-bottom: 20px;
        }
        .receipt-info table {
            width: 100%;
        }
        .receipt-info td {
            padding: 5px 0;
        }
        .receipt-info td:first-child {
            font-weight: bold;
            width: 40%;
        }
        .items {
            margin: 30px 0;
        }
        .items table {
            width: 100%;
            border-collapse: collapse;
        }
        .items th,
        .items td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .items th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .items td:last-child,
        .items th:last-child {
            text-align: right;
        }
        .totals {
            margin-top: 20px;
        }
        .totals table {
            width: 100%;
            margin-left: auto;
            margin-right: 0;
            max-width: 300px;
        }
        .totals td {
            padding: 5px 10px;
        }
        .totals td:first-child {
            text-align: right;
            font-weight: bold;
        }
        .totals td:last-child {
            text-align: right;
        }
        .totals .total-row {
            font-size: 16px;
            font-weight: bold;
            border-top: 2px solid #333;
            padding-top: 10px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .credit-notice {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 10px;
            margin-top: 20px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <img src="{{ public_path('TZ_logo.png') }}" alt="TZ Logo" style="width: 80px; height: 80px; object-fit: contain;" />
        </div>
        <h1>TZ HOLDING LIMITED</h1>
        <p>20231076</p>
        <p>P O Box 407, Honiara, Solomon Islands</p>
        <p style="margin-top: 10px;">{{ config('app.name') }}</p>
    </div>

    <div class="receipt-info">
        <table>
            <tr>
                <td>Receipt Number:</td>
                <td>{{ $receipt->receipt_number ?? '#' . $sale->id }}</td>
            </tr>
            <tr>
                <td>Date:</td>
                <td>{{ $sale->sale_date->format('F d, Y') }}</td>
            </tr>
            <tr>
                <td>Customer:</td>
                <td>{{ $sale->customer->name }}</td>
            </tr>
            @if($sale->customer->email)
            <tr>
                <td>Email:</td>
                <td>{{ $sale->customer->email }}</td>
            </tr>
            @endif
            @if($sale->customer->phone)
            <tr>
                <td>Phone:</td>
                <td>{{ $sale->customer->phone }}</td>
            </tr>
            @endif
            @if($sale->customer->address)
            <tr>
                <td>Address:</td>
                <td>{{ $sale->customer->address }}</td>
            </tr>
            @endif
        </table>
    </div>

    <div class="items">
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Quantity (kg)</th>
                    <th>Price per kg</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
            @foreach($sale->items as $item)
            <tr>
                <td>{{ $item->purchase->description ?? $item->purchase->supplier->name ?? 'Fish' }}</td>
                <td>{{ number_format($item->quantity_kg, 2) }}</td>
                <td>SBD {{ number_format($item->price_per_kg, 2) }}</td>
                <td>SBD {{ number_format($item->total_price, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
        </table>
    </div>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal:</td>
                <td>SBD {{ number_format($sale->subtotal, 2) }}</td>
            </tr>
            @if($sale->delivery_fee > 0)
            <tr>
                <td>Delivery Fee:</td>
                <td>SBD {{ number_format($sale->delivery_fee, 2) }}</td>
            </tr>
            @endif
            <tr class="total-row">
                <td>Total:</td>
                <td>SBD {{ number_format($sale->total_amount, 2) }}</td>
            </tr>
        </table>
    </div>

    @if($sale->is_credit)
    <div class="credit-notice">
        <strong>Credit Sale:</strong> This sale was made on credit.
        @if($sale->payments->count() > 0)
            <br>Payments received: SBD {{ number_format($sale->payments->sum('amount'), 2) }}
            <br>Outstanding balance: SBD {{ number_format($sale->outstanding_balance, 2) }}
        @else
            <br>Outstanding balance: SBD {{ number_format($sale->total_amount, 2) }}
        @endif
    </div>
    @endif

    @if($sale->notes)
    <div style="margin-top: 20px;">
        <strong>Notes:</strong> {{ $sale->notes }}
    </div>
    @endif

    <div class="footer">
        <p>TZ HOLDING LIMITED</p>
        <p>20231076 | P O Box 407, Honiara, Solomon Islands</p>
        <p>Thank you for your business!</p>
        <p>All amounts are in Solomon Islands Dollar (SBD)</p>
    </div>
</body>
</html>

