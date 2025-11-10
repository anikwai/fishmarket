<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Expense;
use Illuminate\Support\Facades\DB;

final readonly class CreateExpense
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(array $attributes): Expense
    {
        // Handle batch creation
        if (isset($attributes['expenses']) && is_array($attributes['expenses'])) {
            return DB::transaction(function () use ($attributes): Expense {
                $expenses = [];
                foreach ($attributes['expenses'] as $expenseData) {
                    if (! is_array($expenseData)) {
                        continue;
                    }
                    /** @var array<string, mixed> $expenseData */
                    $expenses[] = Expense::query()->create($expenseData);
                }

                // Return the first expense for backward compatibility
                return $expenses[0];
            });
        }

        // Single expense creation (backward compatibility)
        return Expense::query()->create($attributes);
    }
}
