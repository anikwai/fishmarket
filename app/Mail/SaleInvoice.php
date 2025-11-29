<?php

declare(strict_types=1);

namespace App\Mail;

use App\Actions\GenerateSaleInvoice;
use App\Models\Sale;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class SaleInvoice extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Sale $sale,
    ) {}

    public function envelope(): Envelope
    {
        /** @var string $appName */
        $appName = config('app.name');

        return new Envelope(
            subject: 'Invoice '.$this->sale->invoice_number.' - '.$appName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.sale-invoice',
            with: [
                'sale' => $this->sale,
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(function (): string {
                $pdf = app(GenerateSaleInvoice::class)->handle($this->sale);

                return $pdf->output();
            }, $this->sale->invoice_number.'.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
