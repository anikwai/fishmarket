{{-- Totals Section for PDF Documents --}}
{{-- Required: $config array with keys: subtotal, deliveryFee, total, showDelivery (bool) --}}
@php
    $subtotal = $config['subtotal'] ?? 0;
    $deliveryFee = $config['deliveryFee'] ?? 0;
    $total = $config['total'] ?? 0;
    $showDelivery = $config['showDelivery'] ?? true;
@endphp

<div class="totals-wrapper">
    <div class="totals-table">
        <table>
            <tr class="subtotal-row">
                <td class="totals-label">Subtotal</td>
                <td class="totals-value">SBD {{ number_format($subtotal, 2) }}</td>
            </tr>
            @if($showDelivery)
                <tr class="subtotal-row">
                    <td class="totals-label">Delivery Fee</td>
                    <td class="totals-value">SBD {{ number_format($deliveryFee, 2) }}</td>
                </tr>
            @endif
            <tr class="total-row">
                <td class="totals-label">Total</td>
                <td class="totals-value">SBD {{ number_format($total, 2) }}</td>
            </tr>
        </table>
    </div>
</div>
