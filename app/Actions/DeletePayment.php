<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Payment;

final readonly class DeletePayment
{
    public function handle(Payment $payment): void
    {
        $payment->delete();
    }
}
