<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Customer;
use App\Models\Purchase;
use Closure;
use Illuminate\Contracts\Validation\Validator;
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
                        $purchase = Purchase::query()->find($purchaseId);
                        if ($purchase instanceof Purchase) {
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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function () use ($validator): void {
            $items = $this->input('items', []);

            if (! is_array($items)) {
                return;
            }

            /** @var \Illuminate\Support\Collection<string, float> $quantitiesByPurchase */
            $quantitiesByPurchase = collect($items)
                ->filter(fn (mixed $item): bool => is_array($item) && isset($item['purchase_id']) && is_scalar($item['purchase_id']))
                ->groupBy(fn (array $item): string => (string) $item['purchase_id'])
                ->map(fn (\Illuminate\Support\Collection $group): float => $group->sum(function (array $item): float {
                    $quantity = $item['quantity_kg'] ?? 0;

                    return is_numeric($quantity) ? (float) $quantity : 0.0;
                }));

            if ($quantitiesByPurchase->isEmpty()) {
                return;
            }

            $purchases = Purchase::query()
                ->whereIn('id', $quantitiesByPurchase->keys()->all())
                ->get()
                ->keyBy('id');

            foreach ($quantitiesByPurchase as $purchaseId => $requestedQuantity) {
                /** @var Purchase|null $purchase */
                $purchase = $purchases->get((int) $purchaseId);

                if ($purchase === null) {
                    continue;
                }

                $remaining = (float) $purchase->remaining_quantity;

                if ($requestedQuantity > $remaining) {
                    $validator->errors()->add(
                        'items',
                        "Total requested quantity for purchase {$purchase->id} exceeds available stock ({$remaining} kg).",
                    );
                }
            }
        });
    }
}
