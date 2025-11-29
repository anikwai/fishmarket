<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StorePurchaseRequest extends FormRequest
{
    public function authorize(): true
    {
        return true;
    }

    public function prepareForValidation(): void
    {
        $nullable = static fn (mixed $value): mixed => $value === '' ? null : $value;

        $this->merge([
            'supplier_invoice_number' => $nullable($this->input('supplier_invoice_number')),
            'supplier_invoice_date' => $nullable($this->input('supplier_invoice_date')),
            'supplier_invoice_amount' => $nullable($this->input('supplier_invoice_amount')),
            'supplier_receipt_number' => $nullable($this->input('supplier_receipt_number')),
            'supplier_receipt_date' => $nullable($this->input('supplier_receipt_date')),
            'supplier_receipt_amount' => $nullable($this->input('supplier_receipt_amount')),
        ]);
    }

    /**
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'supplier_id' => ['required', Rule::exists(Supplier::class, 'id')],
            'purchase_date' => ['required', 'date'],
            'quantity_kg' => ['required', 'numeric', 'min:0.01'],
            'price_per_kg' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'supplier_invoice_number' => ['nullable', 'string', 'max:100'],
            'supplier_invoice_date' => ['nullable', 'date'],
            'supplier_invoice_amount' => ['nullable', 'numeric', 'min:0'],
            'supplier_receipt_number' => ['nullable', 'string', 'max:100'],
            'supplier_receipt_date' => ['nullable', 'date'],
            'supplier_receipt_amount' => ['nullable', 'numeric', 'min:0'],
            'supplier_invoice_file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
            'supplier_receipt_file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
        ];
    }
}
