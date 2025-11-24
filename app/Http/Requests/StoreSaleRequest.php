<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Customer;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create sales') ?? false;
    }

    /**
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_id' => ['required', Rule::exists(Customer::class, 'id')],
            'sale_date' => ['required', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_id' => ['required', Rule::exists('purchases', 'id')],
            'items.*.quantity_kg' => [
                'required',
                'numeric',
                'min:0.01',
                function (string $attribute, mixed $value, Closure $fail): void {
                    // Get the index from the attribute name (items.0.quantity_kg)
                    $index = explode('.', $attribute)[1];
                    $purchaseId = request()->input("items.{$index}.purchase_id");

                    if ($purchaseId) {
                        $purchase = \App\Models\Purchase::query()->find($purchaseId);
                        if ($purchase instanceof \App\Models\Purchase) {
                            if (! is_numeric($value)) {
                                return;
                            }
                            $remaining = (float) $purchase->remaining_quantity;
                            if ((float) $value > $remaining) {
                                $fail("Insufficient stock for this item. Available: {$remaining} kg");
                            }
                        }
                    }
                },
            ],
            'items.*.price_per_kg' => ['required', 'numeric', 'min:0'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0'],
            'is_credit' => ['nullable', 'boolean'],
            'is_delivery' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
