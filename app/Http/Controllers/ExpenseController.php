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
        $perPage = in_array($perPage, [10, 15, 20, 25, 50], true) ? (int) $perPage : 10;

        $query = Expense::query()
            ->with(['purchase.supplier'])
            ->when($request->search, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $search) => $query->where('description', 'like', '%'.(is_string($search) ? $search : '').'%'))
            ->when($request->type, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $type) => $query->where('type', is_string($type) ? $type : ''))
            ->when($request->date_from, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $date) => $query->where('expense_date', '>=', is_string($date) ? $date : ''))
            ->when($request->date_to, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $date) => $query->where('expense_date', '<=', is_string($date) ? $date : ''))
            ->when($request->purchase_id, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $purchaseId) => $query->where('purchase_id', is_numeric($purchaseId) ? (int) $purchaseId : $purchaseId));

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if (is_string($sortBy) && is_string($sortDir) && in_array($sortDir, ['asc', 'desc'], true)) {
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
            ->latest('purchase_date')
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
        $action->handle($request->validated());

        $count = isset($request->validated()['expenses']) && is_array($request->validated()['expenses'])
            ? count($request->validated()['expenses'])
            : 1;

        $message = $count === 1
            ? 'Expense created successfully.'
            : "{$count} expenses created successfully.";

        return back()->with('success', $message);
    }

    public function update(UpdateExpenseRequest $request, Expense $expense, UpdateExpense $action): RedirectResponse
    {
        $action->handle($expense, $request->validated());

        return back()->with('success', 'Expense updated successfully.');
    }

    public function destroy(Expense $expense, DeleteExpense $action): RedirectResponse
    {
        $action->handle($expense);

        return back()->with('success', 'Expense deleted successfully.');
    }
}
