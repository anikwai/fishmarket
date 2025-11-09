<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Customer;
use App\Support\Stock;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_id' => ['required', Rule::exists(Customer::class, 'id')],
            'sale_date' => ['required', 'date'],
            'quantity_kg' => [
                'required',
                'numeric',
                'min:0.01',
                function ($attribute, $value, $fail): void {
                    $currentStock = Stock::current();
                    if ((float) $value > $currentStock) {
                        $fail('Insufficient stock. Available: '.number_format($currentStock, 2).' kg');
                    }
                },
            ],
            'price_per_kg' => ['required', 'numeric', 'min:0'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0'],
            'is_credit' => ['nullable', 'boolean'],
            'is_delivery' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
