<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $sale->invoice_number }}</title>
    @include('pdf.partials.styles', ['headerColor' => '#e91e63'])
</head>
<body>
    <div class="invoice-wrapper">
        @include('pdf.partials.header', ['config' => [
            'headerColor' => '#e91e63',
            'documentLabel' => 'Sales Invoice',
            'documentNumber' => $sale->invoice_number,
            'documentDate' => $sale->sale_date,
        ]])

        <div class="content">
            @include('pdf.partials.badges', ['config' => [
                'isCredit' => $sale->is_credit,
                'isDelivery' => $sale->is_delivery,
            ]])

            @php
                $leftSection = [
                    'title' => 'Bill To',
                    'name' => $sale->customer->name,
                    'address' => $sale->customer->address ?? null,
                    'city' => $sale->customer->city ?? null,
                    'phone' => $sale->customer->phone ?? null,
                    'email' => $sale->customer->email ?? null,
                ];

                $rightSection = [
                    'title' => 'Reference',
                    'items' => [
                        ['label' => 'Invoice #', 'value' => $sale->invoice_number],
                        ['label' => 'Sale Date', 'value' => $sale->sale_date->format('F d, Y')],
                        ['label' => 'Payment', 'value' => $sale->is_credit ? 'Credit Sale' : 'Paid at Sale'],
                    ]
                ];
            @endphp

            @include('pdf.partials.info-section', [
                'leftSection' => $leftSection,
                'rightSection' => $rightSection,
            ])

            @php
                $items = $sale->items->map(fn($item) => [
                    'code' => 'S' . str_pad((string) $item->id, 5, '0', STR_PAD_LEFT),
                    'description' => $item->purchase?->description ?? $item->purchase?->supplier?->name ?? 'Seafood',
                    'quantity' => number_format($item->quantity_kg, 2) . ' kg',
                    'price' => 'SBD ' . number_format($item->price_per_kg, 2),
                    'amount' => 'SBD ' . number_format($item->total_price, 2),
                ]);
            @endphp

            @include('pdf.partials.items-table', ['config' => [
                'sectionTitle' => 'Invoice Items',
                'showCode' => true,
                'items' => $items,
            ]])

            @include('pdf.partials.totals', ['config' => [
                'subtotal' => $sale->subtotal,
                'deliveryFee' => $sale->delivery_fee ?? 0,
                'total' => $sale->total_amount,
                'showDelivery' => ($sale->delivery_fee ?? 0) > 0,
            ]])

            @include('pdf.partials.notes', ['notes' => $sale->notes])

            @include('pdf.partials.footer', ['config' => [
                'documentType' => 'Invoice',
                'documentNumber' => $sale->invoice_number,
            ]])
        </div>
    </div>
</body>
</html>
