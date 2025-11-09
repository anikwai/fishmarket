<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreateExpense;
use App\Actions\DeleteExpense;
use App\Actions\UpdateExpense;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Expense;
use App\Models\Purchase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final readonly class ExpenseController
{
    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 20, 25, 50]) ? (int) $perPage : 10;

        $query = Expense::query()
            ->with('purchase.supplier')
            ->when($request->search, fn ($query, $search) => $query->where('description', 'like', "%{$search}%"))
            ->when($request->type, fn ($query, $type) => $query->where('type', $type))
            ->when($request->date_from, fn ($query, $date) => $query->where('expense_date', '>=', $date))
            ->when($request->date_to, fn ($query, $date) => $query->where('expense_date', '<=', $date))
            ->when($request->purchase_id, fn ($query, $purchaseId) => $query->where('purchase_id', $purchaseId));

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if ($sortBy && in_array($sortDir, ['asc', 'desc'])) {
            $allowedSortColumns = [
                'expense_date' => 'expense_date',
                'type' => 'type',
                'amount' => 'amount',
            ];

            if (isset($allowedSortColumns[$sortBy])) {
                $query->orderBy($allowedSortColumns[$sortBy], $sortDir);
            }
        } else {
            $query->latest();
        }

        $expenses = $query->paginate($perPage);

        $purchases = Purchase::query()
            ->with('supplier')
            ->orderBy('purchase_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('Expenses/Index', [
            'expenses' => $expenses,
            'purchases' => $purchases,
            'filters' => $request->only(['type', 'date_from', 'date_to', 'purchase_id', 'search']),
        ]);
    }

    public function store(StoreExpenseRequest $request, CreateExpense $action): RedirectResponse
    {
        $expense = $action->handle($request->validated());

        $count = isset($request->validated()['expenses'])
            ? count($request->validated()['expenses'])
            : 1;

        $message = $count === 1
            ? 'Expense created successfully.'
            : "{$count} expenses created successfully.";

        return redirect()->back()->with('success', $message);
    }

    public function update(UpdateExpenseRequest $request, Expense $expense, UpdateExpense $action): RedirectResponse
    {
        $action->handle($expense, $request->validated());

        return redirect()->back()->with('success', 'Expense updated successfully.');
    }

    public function destroy(Expense $expense, DeleteExpense $action): RedirectResponse
    {
        $action->handle($expense);

        return redirect()->back()->with('success', 'Expense deleted successfully.');
    }
}
