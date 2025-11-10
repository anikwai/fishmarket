<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateExpenseRequest extends FormRequest
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
        return [
            'purchase_id' => ['nullable', 'exists:purchases,id'],
            'expense_date' => ['required', 'date'],
            'type' => ['required', 'in:shipping,ice,other'],
            'description' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
        ];
    }
}
