{{-- Shared PDF Document Styles --}}
{{-- Parameters: $headerColor (default: primary color from theme) --}}
@php
    // DomPDF doesn't support OKLCH, so we use hex equivalents from the theme
    // oklch(0.6726 0.2904 341.4084) = #e91e63 (primary)
    $headerColor = $headerColor ?? '#e91e63';
@endphp

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        color: #1a1625; /* foreground */
        background: #fcfcfd; /* background */
        padding: 0;
        margin: 0;
        font-size: 11.2px;
        line-height: 1.6;
    }

    /* Add page margins for proper spacing on all pages */
    @page {
        margin: 120px 30px 30px 30px;
    }

    /* First page has no top margin (header takes care of it) */
    @page :first {
        margin-top: 0;
    }

    .invoice-wrapper, .receipt-wrapper {
        max-width: 800px;
        margin: 0 auto;
        background: #ffffff; /* card */
        box-shadow: 0px 4px 8px -2px rgba(0, 0, 0, 0.1), 0px 1px 2px -3px rgba(0, 0, 0, 0.1);
        border-radius: 0;
        overflow: hidden;
        padding: 0;
    }

    /* Header */
    .header {
        background: {{ $headerColor }};
        color: #ffffff;
        padding: 30px 40px;
        page-break-inside: avoid;
    }

    .header table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .header td {
        vertical-align: top;
        color: #ffffff;
    }

    .header .logo-section {
        width: 55%;
        padding-right: 20px;
    }

    .header .invoice-section, .header .receipt-section {
        width: 45%;
        text-align: right;
        padding-left: 20px;
    }

    .logo {
        width: 50px;
        height: 50px;
        background: #ffffff;
        border-radius: 6px;
        padding: 4px;
        margin-bottom: 10px;
        display: block;
    }

    .company-name {
        font-size: 19.2px;
        font-weight: 700;
        margin-bottom: 6px;
        letter-spacing: -0.3px;
    }

    .company-info {
        font-size: 10.4px;
        opacity: 0.95;
        line-height: 1.7;
    }

    .invoice-label, .receipt-label {
        font-size: 10.4px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        opacity: 0.9;
        margin-bottom: 8px;
    }

    .invoice-number, .receipt-number {
        font-size: 25.6px;
        font-weight: 700;
        margin-bottom: 6px;
        letter-spacing: -0.5px;
    }

    .invoice-date, .receipt-date {
        font-size: 11.2px;
        opacity: 0.9;
    }

    /* Content */
    .content {
        padding: 36px 40px;
    }

    /* Add top spacing for all sections to prevent them from clipping to top of new pages */
    .status-badges::before,
    .info-section::before,
    .payment-confirmation::before,
    .credit-notice::before,
    .items-section::before,
    .totals-wrapper::before,
    .notes-section::before,
    .footer::before {
        content: '';
        display: block;
        height: 80px;
        margin-bottom: -80px;
    }

    /* Remove extra spacing from first element */
    .content > :first-child::before {
        display: none !important;
    }


    /* Status badges */
    .status-badges {
        margin-bottom: 28px;
        page-break-inside: avoid;
    }

    .badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 9.6px;
        font-weight: 600;
        margin-right: 6px;
        letter-spacing: 0.3px;
    }

    .badge.credit {
        background: #fff3cd;
        color: #856404;
    }

    .badge.paid {
        background: #d4edda;
        color: #155724;
    }

    .badge.delivery {
        background: #d1ecf1;
        color: #0c5460;
    }

    .badge.pickup {
        background: #e2e3e5;
        color: #383d41;
    }

    /* Info section */
    .info-section {
        margin-bottom: 32px;
        page-break-inside: avoid;
    }

    .info-section table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e8e8ea; /* border */
    }

    .info-section td {
        width: 50%;
        padding: 18px;
        background: #f5f5f7; /* secondary/muted */
        border: none;
        vertical-align: top;
    }

    .info-section td:first-child {
        border-right: 1px solid #e8e8ea; /* border */
    }

    .info-label {
        font-size: 8.8px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #1a1625; /* foreground */
        margin-bottom: 10px;
        font-weight: 600;
    }

    .info-content {
        font-size: 11.2px;
        color: #1a1625; /* foreground */
        line-height: 1.7;
    }

    .info-content strong {
        font-size: 12px;
        font-weight: 600;
        color: #1a1625; /* foreground */
    }

    .info-content.muted {
        color: #71717a; /* muted-foreground */
    }

    /* Section title */
    .section-title {
        font-size: 9.6px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #71717a; /* muted-foreground */
        margin-bottom: 12px;
        font-weight: 600;
    }

    /* Items section wrapper - keeps title and table together */
    .items-section {
        page-break-inside: avoid;
        margin-bottom: 24px;
    }

    /* Items table */
    .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 0;
        border: 1px solid #e8e8ea; /* border */
        border-radius: 8px;
        overflow: hidden;
    }

    .items-table thead {
        background: #f5f5f7; /* secondary/muted */
    }

    .items-table th {
        padding: 12px 14px;
        text-align: left;
        font-size: 8.8px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #71717a; /* muted-foreground */
        font-weight: 600;
        border-bottom: 2px solid #e8e8ea; /* border */
    }

    .items-table th.text-right {
        text-align: right;
    }

    .items-table tbody tr {
        border-bottom: 1px solid #f5f5f7; /* secondary/muted */
    }

    .items-table tbody tr:last-child {
        border-bottom: none;
    }

    .items-table td {
        padding: 14px;
        font-size: 11.2px;
        color: #1a1625; /* foreground */
        vertical-align: top;
    }

    .items-table td.text-right {
        text-align: right;
    }

    .item-code {
        font-family: 'Courier New', Courier, monospace;
        font-size: 9.6px;
        color: #71717a; /* muted-foreground */
        font-weight: 500;
    }

    .item-name {
        font-weight: 600;
        color: #1a1625; /* foreground */
    }

    .amount {
        font-weight: 600;
        color: #1a1625; /* foreground */
    }

    /* Totals */
    .totals-wrapper {
        text-align: right;
        margin-bottom: 24px;
        page-break-inside: avoid;
    }

    .totals-table {
        display: inline-block;
        min-width: 300px;
        background: #f5f5f7; /* secondary/muted */
        border: 1px solid #e8e8ea; /* border */
        border-radius: 8px;
        padding: 16px 20px;
        page-break-inside: avoid;
    }

    .totals-table table {
        width: 100%;
        border-collapse: collapse;
    }

    .totals-table td {
        padding: 8px 0;
        font-size: 11.2px;
    }

    .totals-label {
        color: #71717a; /* muted-foreground */
        font-weight: 500;
    }

    .totals-value {
        text-align: right;
        font-weight: 600;
        color: #1a1625; /* foreground */
    }

    .totals-table .subtotal-row td {
        border-bottom: 1px solid #e8e8ea; /* border */
        padding-bottom: 10px;
    }

    .totals-table .total-row td {
        padding-top: 12px;
        font-size: 18px;
        font-weight: 700;
        color: #1a1625; /* foreground */
    }

    /* Notes */
    .notes-section {
        margin-bottom: 32px;
        padding: 16px;
        background: #f5f5f7; /* secondary/muted */
        border-left: 4px solid #5cc9a7; /* accent */
        border-radius: 6px;
        page-break-inside: avoid;
    }

    .notes-title {
        font-size: 8.8px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #71717a; /* muted-foreground */
        margin-bottom: 8px;
        font-weight: 600;
    }

    .notes-content {
        font-size: 11.2px;
        color: #1a1625; /* foreground */
        line-height: 1.6;
    }

    /* Footer */
    .footer {
        border-top: 1px solid #e8e8ea; /* border */
        padding-top: 24px;
        margin-top: 32px;
        page-break-inside: avoid;
    }

    .footer table {
        width: 100%;
        border-collapse: collapse;
    }

    .footer td {
        width: 50%;
        padding: 0 12px;
        vertical-align: top;
    }

    .footer h4 {
        font-size: 8.8px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #71717a; /* muted-foreground */
        margin-bottom: 10px;
        font-weight: 600;
    }

    .footer p {
        font-size: 10.4px;
        color: #71717a; /* muted-foreground */
        line-height: 1.7;
    }

    .footer .highlight {
        font-weight: 600;
        color: #1a1625; /* foreground */
    }

    .generator {
        text-align: center;
        font-size: 8.8px;
        color: #71717a; /* muted-foreground */
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #f5f5f7; /* secondary/muted */
    }

    @media print {
        body {
            background: #ffffff;
            padding: 0;
        }

        .invoice-wrapper, .receipt-wrapper {
            box-shadow: none;
            border-radius: 0;
        }

        @page {
            margin: 120px 30px 30px 30px;
        }

        @page :first {
            margin-top: 0;
        }
    }
</style>
