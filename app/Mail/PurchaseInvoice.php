<?php

declare(strict_types=1);

namespace App\Mail;

use App\Actions\GeneratePurchaseInvoice;
use App\Models\Purchase;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class PurchaseInvoice extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Purchase $purchase,
    ) {}

    public function envelope(): Envelope
    {
        $invoiceNumber = 'INV-'.str_pad((string) $this->purchase->id, 6, '0', STR_PAD_LEFT);

        return new Envelope(
            subject: 'Invoice '.$invoiceNumber.' - '.config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.purchase-invoice',
            with: [
                'purchase' => $this->purchase,
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $pdf = (new GeneratePurchaseInvoice)->handle($this->purchase);
        $invoiceNumber = 'INV-'.str_pad((string) $this->purchase->id, 6, '0', STR_PAD_LEFT);

        return [
            Attachment::fromData(fn (): string => $pdf->output(), $invoiceNumber.'.pdf')
                ->withMime('application/pdf'),
        ];
    }
}

