<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Customer;
use App\Models\Sale;
use App\Support\Stock;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateSaleRequest extends FormRequest
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
        $sale = $this->route('sale');
        $currentQuantity = $sale instanceof Sale ? $sale->quantity_kg : 0;

        return [
            'customer_id' => ['required', Rule::exists(Customer::class, 'id')],
            'sale_date' => ['required', 'date'],
            'quantity_kg' => [
                'required',
                'numeric',
                'min:0.01',
                function (string $attribute, mixed $value, Closure $fail) use ($currentQuantity): void {
                    if (! is_numeric($value)) {
                        return;
                    }
                    $newQuantity = (float) $value;
                    $quantityDifference = $newQuantity - $currentQuantity;

                    if ($quantityDifference > 0) {
                        $currentStock = Stock::current();
                        if ($quantityDifference > $currentStock) {
                            $fail('Insufficient stock. Available: '.number_format($currentStock, 2).' kg');
                        }
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
