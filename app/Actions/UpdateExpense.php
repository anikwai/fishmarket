<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Expense;

final readonly class UpdateExpense
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(Expense $expense, array $attributes): void
    {
        $expense->update($attributes);
    }
}
