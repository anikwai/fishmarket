<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Supplier;

final readonly class DeleteSupplier
{
    public function handle(Supplier $supplier): void
    {
        $supplier->delete();
    }
}

