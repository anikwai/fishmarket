<?php

declare(strict_types=1);

namespace App\Mail;

use App\Actions\GeneratePurchaseReceipt;
use App\Models\Purchase;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class PurchaseReceipt extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Purchase $purchase,
    ) {}

    public function envelope(): Envelope
    {
        /** @var string $appName */
        $appName = config('app.name');

        return new Envelope(
            subject: 'Receipt '.$this->purchase->receipt_number.' - '.$appName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.purchase-receipt',
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
        return [
            Attachment::fromData(function (): string {
                $pdf = app(GeneratePurchaseReceipt::class)->handle($this->purchase);

                return $pdf->output();
            }, $this->purchase->receipt_number.'.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
