{{-- Items Table for PDF Documents --}}
{{-- Required: $config array with keys: sectionTitle, showCode (bool), items (collection) --}}
@php
    $sectionTitle = $config['sectionTitle'] ?? 'Items';
    $showCode = $config['showCode'] ?? false;
    $items = $config['items'] ?? collect();
@endphp

<div class="items-section">
    <div class="section-title">{{ $sectionTitle }}</div>
    <table class="items-table">
    <thead>
        <tr>
            @if($showCode)
                <th style="width: 10%;">Code</th>
            @endif
            <th style="width: {{ $showCode ? '40%' : '45%' }};">Description</th>
            <th class="text-right" style="width: {{ $showCode ? '18%' : '20%' }};">Quantity</th>
            <th class="text-right" style="width: {{ $showCode ? '16%' : '18%' }};">Price</th>
            <th class="text-right" style="width: {{ $showCode ? '16%' : '17%' }};">Amount</th>
        </tr>
    </thead>
    <tbody>
        @forelse($items as $item)
            <tr>
                @if($showCode)
                    <td><span class="item-code">{{ $item['code'] }}</span></td>
                @endif
                <td><span class="item-name">{{ $item['description'] }}</span></td>
                <td class="text-right">{{ $item['quantity'] }}</td>
                <td class="text-right">{{ $item['price'] }}</td>
                <td class="text-right amount">{{ $item['amount'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="{{ $showCode ? '5' : '4' }}" style="text-align: center; padding: 20px; color: #999;">
                    No items found
                </td>
            </tr>
        @endforelse
    </tbody>
    </table>
</div>
