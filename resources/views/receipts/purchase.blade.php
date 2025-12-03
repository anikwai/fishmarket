<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt {{ $purchase->receipt_number }}</title>
    @include('pdf.partials.styles', ['headerColor' => '#5cc9a7'])
</head>
<body>
    <div class="receipt-wrapper">
        @include('pdf.partials.header', ['config' => [
            'headerColor' => '#5cc9a7',
            'documentLabel' => 'Purchase Receipt',
            'documentNumber' => $purchase->receipt_number,
            'documentDate' => $purchase->purchase_date,
        ]])

        <div class="content">
            @php
                $leftSection = [
                    'title' => 'Paid To (Supplier)',
                    'name' => $purchase->supplier->name,
                    'address' => $purchase->supplier->address ?? 'Honiara, Solomon Islands',
                    'city' => $purchase->supplier->city ?? null,
                    'phone' => $purchase->supplier->phone ?? null,
                    'email' => $purchase->supplier->email ?? null,
                ];

                $rightSection = [
                    'title' => 'Purchase Details',
                    'items' => [
                        ['label' => 'Receipt #', 'value' => $purchase->receipt_number],
                        ['label' => 'Purchase Date', 'value' => $purchase->purchase_date->format('F d, Y')],
                        ['label' => 'Reference', 'value' => str_pad((string) $purchase->id, 8, '0', STR_PAD_LEFT)],
                    ]
                ];
            @endphp

            @include('pdf.partials.info-section', [
                'leftSection' => $leftSection,
                'rightSection' => $rightSection,
            ])

            @php
                $items = [[
                    'code' => 'P' . str_pad((string) $purchase->id, 5, '0', STR_PAD_LEFT),
                    'description' => $purchase->description ?? 'Fish Purchase',
                    'quantity' => number_format($purchase->quantity_kg, 2) . ' kg',
                    'price' => 'SBD ' . number_format($purchase->price_per_kg, 2),
                    'amount' => 'SBD ' . number_format($purchase->total_cost, 2),
                ]];
            @endphp

            @include('pdf.partials.items-table', ['config' => [
                'sectionTitle' => 'Purchase Items',
                'showCode' => true,
                'items' => $items,
            ]])

            @include('pdf.partials.totals', ['config' => [
                'subtotal' => $purchase->total_cost,
                'deliveryFee' => 0,
                'total' => $purchase->total_cost,
                'showDelivery' => false,
            ]])

            @include('pdf.partials.notes', ['notes' => $purchase->notes])

            @include('pdf.partials.footer', ['config' => [
                'documentType' => 'Receipt',
                'documentNumber' => $purchase->receipt_number,
            ]])
        </div>
    </div>
</body>
</html>
