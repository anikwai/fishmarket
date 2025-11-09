<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Payment;

final readonly class CreatePayment
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(array $attributes): Payment
    {
        return Payment::query()->create($attributes);
    }
}
