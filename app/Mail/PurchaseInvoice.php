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
        return new Envelope(
            subject: 'Invoice '.$this->purchase->invoice_number.' - '.config('app.name'),
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

        return [
            Attachment::fromData(fn (): string => $pdf->output(), $this->purchase->invoice_number.'.pdf')
                ->withMime('application/pdf'),
        ];
    }
}

