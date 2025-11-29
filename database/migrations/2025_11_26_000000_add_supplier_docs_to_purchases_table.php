<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            $table->string('supplier_invoice_number')->nullable()->after('notes');
            $table->date('supplier_invoice_date')->nullable()->after('supplier_invoice_number');
            $table->decimal('supplier_invoice_amount', 12, 2)->nullable()->after('supplier_invoice_date');
            $table->string('supplier_invoice_path')->nullable()->after('supplier_invoice_amount');
            $table->string('supplier_invoice_original_name')->nullable()->after('supplier_invoice_path');

            $table->string('supplier_receipt_number')->nullable()->after('supplier_invoice_original_name');
            $table->date('supplier_receipt_date')->nullable()->after('supplier_receipt_number');
            $table->decimal('supplier_receipt_amount', 12, 2)->nullable()->after('supplier_receipt_date');
            $table->string('supplier_receipt_path')->nullable()->after('supplier_receipt_amount');
            $table->string('supplier_receipt_original_name')->nullable()->after('supplier_receipt_path');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            $table->dropColumn([
                'supplier_invoice_number',
                'supplier_invoice_date',
                'supplier_invoice_amount',
                'supplier_invoice_path',
                'supplier_invoice_original_name',
                'supplier_receipt_number',
                'supplier_receipt_date',
                'supplier_receipt_amount',
                'supplier_receipt_path',
                'supplier_receipt_original_name',
            ]);
        });
    }
};
