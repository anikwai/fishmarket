<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Payment;

final readonly class UpdatePayment
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(Payment $payment, array $attributes): void
    {
        $payment->update($attributes);
    }
}
