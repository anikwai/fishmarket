<?php

declare(strict_types=1);

namespace App\Mail;

use App\Actions\GenerateReceipt;
use App\Models\Receipt;
use App\Models\Sale;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

final class SaleReceipt extends Mailable
{
    public function __construct(
        public Sale $sale,
        public ?Receipt $receipt = null
    ) {
        if (! $this->receipt) {
            $this->receipt = $sale->activeReceipt;
        }
    }

    public function envelope(): Envelope
    {
        $receiptNumber = $this->receipt?->receipt_number ?? '#'.$this->sale->id;

        return new Envelope(
            subject: 'Receipt '.$receiptNumber.' - '.config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.sale-receipt',
            with: [
                'sale' => $this->sale,
                'receipt' => $this->receipt,
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $receipt = $this->receipt ?? $this->sale->activeReceipt;

        if (! $receipt) {
            return [];
        }

        $pdf = (new GenerateReceipt)->handle($receipt);
        $receiptNumber = $receipt->receipt_number ?? 'receipt-'.$this->sale->id;

        return [
            Attachment::fromData(fn () => $pdf->output(), $receiptNumber.'.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
