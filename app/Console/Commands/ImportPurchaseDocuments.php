<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Purchase;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class ImportPurchaseDocuments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * CSV columns: purchase_id (required), invoice_number, invoice_date, invoice_amount, invoice_file, receipt_number, receipt_date, receipt_amount, receipt_file.
     * File paths can be absolute, or relative to the project base path.
     */
    protected $signature = 'purchase:import-documents {csv : Path to CSV file with purchase document info} {--disk=public : Filesystem disk to store documents on}';

    /**
     * The console command description.
     */
    protected $description = 'Import supplier invoice/receipt numbers and files for purchases from a CSV.';

    public function handle(): int
    {
        $csvPath = $this->argument('csv');
        $disk = $this->option('disk');

        $fullCsvPath = $this->resolvePath($csvPath);
        if (! file_exists($fullCsvPath)) {
            $this->error("CSV not found: {$fullCsvPath}");

            return self::FAILURE;
        }

        $rows = $this->readCsv($fullCsvPath);
        if (count($rows) === 0) {
            $this->warn('No rows found in CSV.');

            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar(count($rows));
        $bar->start();

        foreach ($rows as $row) {
            $purchaseId = $row['purchase_id'] ?? null;
            if (! $purchaseId) {
                $bar->advance();

                continue;
            }

            $purchase = Purchase::query()->find($purchaseId);
            if (! $purchase) {
                $this->warn("Purchase {$purchaseId} not found; skipping.");
                $bar->advance();

                continue;
            }

            $data = [
                'supplier_invoice_number' => $row['invoice_number'] ?? null,
                'supplier_invoice_date' => $row['invoice_date'] ?? null,
                'supplier_invoice_amount' => $this->nullableNumber($row['invoice_amount'] ?? null),
                'supplier_receipt_number' => $row['receipt_number'] ?? null,
                'supplier_receipt_date' => $row['receipt_date'] ?? null,
                'supplier_receipt_amount' => $this->nullableNumber($row['receipt_amount'] ?? null),
            ];

            if (! empty($row['invoice_file'])) {
                [$path, $name] = $this->storeDocument(
                    $row['invoice_file'],
                    "purchases/{$purchase->supplier_id}/supplier-invoices",
                    is_string($disk) ? $disk : 'public'
                );
                if ($path) {
                    $data['supplier_invoice_path'] = $path;
                    $data['supplier_invoice_original_name'] = $name;
                } else {
                    $this->warn("Invoice file missing for purchase {$purchaseId}: {$row['invoice_file']}");
                }
            }

            if (! empty($row['receipt_file'])) {
                [$path, $name] = $this->storeDocument(
                    $row['receipt_file'],
                    "purchases/{$purchase->supplier_id}/supplier-receipts",
                    is_string($disk) ? $disk : 'public'
                );
                if ($path) {
                    $data['supplier_receipt_path'] = $path;
                    $data['supplier_receipt_original_name'] = $name;
                } else {
                    $this->warn("Receipt file missing for purchase {$purchaseId}: {$row['receipt_file']}");
                }
            }

            $purchase->update($data);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info('Import complete.');

        return self::SUCCESS;
    }

    /**
     * @return list<array<string, string|null>>
     */
    private function readCsv(string $path): array
    {
        $rows = [];
        if (($handle = fopen($path, 'r')) === false) {
            return $rows;
        }

        $headers = [];
        while (($data = fgetcsv($handle, 0, ',', escape: '\\')) !== false) {
            if ($headers === []) {
                $headers = array_map(static fn ($header) => Str::snake(mb_trim((string) $header)), $data);

                continue;
            }

            if (count($data) === 1 && $data[0] === null) {
                continue;
            }

            $row = [];
            foreach ($headers as $index => $header) {
                $row[$header] = $data[$index] ?? null;
            }
            $rows[] = $row;
        }

        fclose($handle);

        return $rows;
    }

    private function resolvePath(string $path): string
    {
        if (Str::startsWith($path, ['/', '~'])) {
            return $path;
        }

        return base_path($path);
    }

    /**
     * @return array{0:string|null,1:string|null}
     */
    private function storeDocument(string $source, string $targetDir, string $disk): array
    {
        $fullSource = $this->resolvePath($source);
        if (! file_exists($fullSource)) {
            return [null, null];
        }

        $originalName = basename($fullSource);
        $targetPath = mb_rtrim($targetDir, '/').'/'.$originalName;

        $stream = fopen($fullSource, 'r');
        if ($stream === false) {
            return [null, null];
        }

        Storage::disk($disk)->put($targetPath, $stream);
        fclose($stream);

        return [$targetPath, $originalName];
    }

    private function nullableNumber(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return is_numeric($value) ? (float) $value : null;
    }
}
