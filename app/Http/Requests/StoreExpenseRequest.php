<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreExpenseRequest extends FormRequest
{
    public function authorize(): true
    {
        return true;
    }

    /**
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        // Check if expenses array is provided (batch creation)
        if ($this->has('expenses')) {
            return [
                'expenses' => ['required', 'array', 'min:1'],
                'expenses.*.purchase_id' => ['nullable', 'exists:purchases,id'],
                'expenses.*.expense_date' => ['required', 'date'],
                'expenses.*.type' => ['required', 'in:shipping,ice,other'],
                'expenses.*.description' => ['required', 'string'],
                'expenses.*.amount' => ['required', 'numeric', 'min:0'],
            ];
        }

        // Single expense creation (backward compatibility)
        return [
            'purchase_id' => ['nullable', 'exists:purchases,id'],
            'expense_date' => ['required', 'date'],
            'type' => ['required', 'in:shipping,ice,other'],
            'description' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
        ];
    }
}
