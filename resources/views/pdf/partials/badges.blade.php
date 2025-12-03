{{-- Status Badges for PDF Documents --}}
{{-- Required: $config array with keys: isCredit (bool), isDelivery (bool) --}}
@php
    $isCredit = $config['isCredit'] ?? false;
    $isDelivery = $config['isDelivery'] ?? false;
@endphp

<div class="status-badges">
    @if($isCredit)
        <span class="badge credit">Payment on Credit</span>
    @else
        <span class="badge paid">Paid at Sale</span>
    @endif
    @if($isDelivery)
        <span class="badge delivery">Delivery Included</span>
    @else
        <span class="badge pickup">Pickup</span>
    @endif
</div>
