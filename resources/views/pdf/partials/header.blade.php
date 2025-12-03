{{-- PDF Document Header --}}
{{-- Required: $config array with keys: headerColor, documentLabel, documentNumber, documentDate --}}
@php
    $headerColor = $config['headerColor'] ?? '#e91e63';
    $documentLabel = $config['documentLabel'] ?? 'Document';
    $documentNumber = $config['documentNumber'] ?? '';
    $documentDate = $config['documentDate'] ?? now();
    $logoPath = $config['logoPath'] ?? public_path('TZ_logo.png');
@endphp

<div class="header" style="background-color: {{ $headerColor }}; color: white; padding: 30px 40px; page-break-inside: avoid;">
    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
        <tr>
            <td class="logo-section" style="width: 55%; padding-right: 20px; vertical-align: top; color: white;">
                <img src="{{ $logoPath }}" alt="TZ Holding" class="logo" style="width: 50px; height: 50px; background: white; border-radius: 6px; padding: 4px; margin-bottom: 10px; display: block;">
                <div class="company-name" style="font-size: 22px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.3px; color: white;">TZ HOLDING LIMITED</div>
                <div class="company-info" style="font-size: 12px; opacity: 0.95; line-height: 1.7; color: white;">
                    Tax ID: 20231076<br>
                    P O Box 407, Honiara<br>
                    Solomon Islands
                </div>
            </td>
            <td class="invoice-section receipt-section" style="width: 45%; text-align: right; padding-left: 20px; vertical-align: top; color: white;">
                <div class="invoice-label receipt-label" style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; margin-bottom: 8px; color: white;">{{ $documentLabel }}</div>
                <div class="invoice-number receipt-number" style="font-size: 28px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.5px; color: white;">{{ $documentNumber }}</div>
                <div class="invoice-date receipt-date" style="font-size: 13px; opacity: 0.9; color: white;">{{ $documentDate->format('F d, Y') }}</div>
            </td>
        </tr>
    </table>
</div>
