<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table): void {
            $table->foreignId('purchase_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->index('purchase_id');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table): void {
            $table->dropForeign(['purchase_id']);
            $table->dropIndex(['purchase_id']);
            $table->dropColumn('purchase_id');
        });
    }
};
