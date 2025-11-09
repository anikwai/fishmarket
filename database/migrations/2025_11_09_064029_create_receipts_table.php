<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table): void {
            $table->id();
            $table->string('receipt_number')->unique();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['active', 'void', 'reissued'])->default('active');
            $table->foreignId('reissued_from_id')->nullable()->constrained('receipts')->nullOnDelete();
            $table->timestamp('issued_at');
            $table->timestamp('voided_at')->nullable();
            $table->text('void_reason')->nullable();
            $table->timestamps();

            $table->index('receipt_number');
            $table->index('status');
            $table->index('issued_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
