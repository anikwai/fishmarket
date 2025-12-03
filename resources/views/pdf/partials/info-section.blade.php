{{-- Info Section for Customer/Supplier Details --}}
{{-- Required: $leftSection and $rightSection arrays with 'title', 'name', 'address', 'city', 'phone', 'email' --}}
@php
    $leftSection = $leftSection ?? [];
    $rightSection = $rightSection ?? [];
@endphp

<div class="info-section">
    <table>
        <tr>
            @if(!empty($leftSection))
                <td>
                    <div class="info-label">{{ $leftSection['title'] ?? '' }}</div>
                    <div class="info-content">
                        <strong>{{ $leftSection['name'] ?? '' }}</strong>
                        @if(!empty($leftSection['address']))
                            {{ $leftSection['address'] }}<br>
                        @endif
                        @if(!empty($leftSection['city']))
                            {{ $leftSection['city'] }}<br>
                        @endif
                        @if(!empty($leftSection['phone']))
                            {{ $leftSection['phone'] }}<br>
                        @endif
                        @if(!empty($leftSection['email']))
                            {{ $leftSection['email'] }}
                        @endif
                    </div>
                </td>
            @endif

            @if(!empty($rightSection))
                <td>
                    <div class="info-label">{{ $rightSection['title'] ?? '' }}</div>
                    <div class="info-content">
                        @if(!empty($rightSection['items']))
                            @foreach($rightSection['items'] as $item)
                                <strong>{{ $item['label'] ?? '' }}</strong>
                                <span class="info-content muted">{{ $item['value'] ?? '' }}</span><br>
                            @endforeach
                        @endif
                        @if(!empty($rightSection['content']))
                            {!! $rightSection['content'] !!}
                        @endif
                    </div>
                </td>
            @endif
        </tr>
    </table>
</div>
