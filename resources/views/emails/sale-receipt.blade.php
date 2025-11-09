<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt #{{ $sale->id }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px;">
            <img src="{{ asset('TZ_logo.png') }}" alt="TZ Logo" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px;" />
            <h1 style="margin: 0; color: #333; font-size: 24px;">TZ HOLDING LIMITED</h1>
            <p style="margin: 5px 0; color: #666;">20231076</p>
            <p style="margin: 5px 0; color: #666;">P O Box 407, Honiara, Solomon Islands</p>
        </div>
        
        <h2 style="text-align: center; color: #333;">Receipt #{{ $sale->id }}</h2>
        
        <p>Dear {{ $sale->customer->name }},</p>
        
        <p>Thank you for your purchase! Please find your receipt attached.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Sale Date:</strong> {{ $sale->sale_date->format('F d, Y') }}</p>
            <p><strong>Total Amount:</strong> SBD {{ number_format($sale->total_amount, 2) }}</p>
            @if($sale->is_credit)
            <p><strong>Payment Status:</strong> Credit Sale</p>
            @if($sale->payments->count() > 0)
            <p><strong>Outstanding Balance:</strong> SBD {{ number_format($sale->outstanding_balance, 2) }}</p>
            @endif
            @endif
        </div>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>TZ HOLDING LIMITED<br>{{ config('app.name') }}</p>
    </div>
</body>
</html>

