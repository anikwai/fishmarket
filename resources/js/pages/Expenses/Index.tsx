import { DatePicker } from '@/components/date-picker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    RowSelectionState,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';
import {
    ArrowUpDown,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Columns,
    EyeIcon,
    InfoIcon,
    MoreHorizontal,
    PencilIcon,
    PlusIcon,
    Receipt,
    Search,
    TrashIcon,
    XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Expenses',
        href: '/expenses',
    },
];

interface Purchase {
    id: number;
    purchase_date: string;
    supplier: {
        id: number;
        name: string;
    };
}

interface Expense {
    id: number;
    purchase_id: number | null;
    expense_date: string;
    type: 'shipping' | 'ice' | 'other';
    description: string;
    amount: number | string;
    purchase?: Purchase | null;
}

interface ExpensesProps {
    expenses: {
        data: Expense[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    purchases: Purchase[];
    filters: {
        type?: string;
        date_from?: string;
        date_to?: string;
        purchase_id?: string;
        search?: string;
    };
}

export default function ExpensesIndex({
    expenses,
    purchases,
    filters,
}: ExpensesProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [showOpen, setShowOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(
        null,
    );
    const [purchaseFilter, setPurchaseFilter] = useState(
        filters.purchase_id || 'all',
    );
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {},
    );
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const isInitialMount = useRef(true);

    // Debounced search function
    const performSearch = useCallback((search: string, purchaseId: string) => {
        router.get(
            '/expenses',
            {
                search: search || undefined,
                purchase_id: purchaseId === 'all' ? undefined : purchaseId,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['expenses', 'filters'],
            },
        );
    }, []);

    // Debounce search input
    useEffect(() => {
        // Skip the initial mount to avoid unnecessary request
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            performSearch(searchValue, purchaseFilter);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchValue, purchaseFilter, performSearch]);

    // Handle sorting changes
    useEffect(() => {
        if (isInitialMount.current) {
            return;
        }

        const sortParam =
            sorting.length > 0
                ? {
                      sort_by: sorting[0].id,
                      sort_dir: sorting[0].desc ? 'desc' : 'asc',
                  }
                : {};

        router.get(
            '/expenses',
            {
                search: searchValue || undefined,
                purchase_id:
                    purchaseFilter === 'all' ? undefined : purchaseFilter,
                ...sortParam,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['expenses', 'filters'],
            },
        );
    }, [sorting, searchValue, purchaseFilter]);

    const createForm = useForm({
        expenses: [
            {
                purchase_id: '',
                expense_date: new Date().toISOString().split('T')[0],
                type: 'other' as 'shipping' | 'ice' | 'other',
                description: '',
                amount: '',
            },
        ],
    });

    const editForm = useForm({
        purchase_id: '',
        expense_date: '',
        type: 'other' as 'shipping' | 'ice' | 'other',
        description: '',
        amount: '',
    });

    const handlePurchaseFilter = (value: string) => {
        setPurchaseFilter(value);
        router.get(
            '/expenses',
            {
                search: searchValue || undefined,
                purchase_id: value === 'all' ? undefined : value,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['expenses', 'filters'],
            },
        );
    };

    const handleSearch = (value: string) => {
        setSearchValue(value);
    };

    const handlePageChange = (url: string | null) => {
        if (!url) return;
        router.visit(url, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const addExpenseRow = () => {
        const currentExpenses = createForm.data.expenses || [];
        createForm.setData('expenses', [
            ...currentExpenses,
            {
                purchase_id: '',
                expense_date: new Date().toISOString().split('T')[0],
                type: 'other' as 'shipping' | 'ice' | 'other',
                description: '',
                amount: '',
            },
        ]);
    };

    const removeExpenseRow = (index: number) => {
        const currentExpenses = createForm.data.expenses || [];
        if (currentExpenses.length > 1) {
            createForm.setData(
                'expenses',
                currentExpenses.filter((_, i) => i !== index),
            );
        }
    };

    const updateExpenseRow = (
        index: number,
        field: string,
        value: string | number,
    ) => {
        const currentExpenses = createForm.data.expenses || [];
        const updatedExpenses = [...currentExpenses];
        updatedExpenses[index] = {
            ...updatedExpenses[index],
            [field]: value,
        };
        createForm.setData('expenses', updatedExpenses);
    };

    const handleCreate = () => {
        const expenses = createForm.data.expenses.map((expense) => ({
            purchase_id: expense.purchase_id || null,
            expense_date: expense.expense_date,
            type: expense.type,
            description: expense.description,
            amount: expense.amount,
        }));

        router.post(
            '/expenses',
            { expenses },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCreateOpen(false);
                    createForm.setData('expenses', [
                        {
                            purchase_id: '',
                            expense_date: new Date()
                                .toISOString()
                                .split('T')[0],
                            type: 'other' as 'shipping' | 'ice' | 'other',
                            description: '',
                            amount: '',
                        },
                    ]);
                },
            },
        );
    };

    const handleEdit = useCallback(
        (expense: Expense) => {
            setSelectedExpense(expense);
            editForm.setData({
                purchase_id: expense.purchase_id?.toString() || '',
                expense_date: expense.expense_date,
                type: expense.type,
                description: expense.description,
                amount: expense.amount.toString(),
            });
            setEditOpen(true);
        },
        [editForm],
    );

    const handleUpdate = () => {
        if (!selectedExpense) return;
        const data = {
            ...editForm.data,
            purchase_id: editForm.data.purchase_id || undefined,
        };
        editForm.setData(data);
        editForm.put(`/expenses/${selectedExpense.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditOpen(false);
                setSelectedExpense(null);
            },
        });
    };

    const handleDelete = () => {
        if (!selectedExpense) return;
        router.delete(`/expenses/${selectedExpense.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setSelectedExpense(null);
            },
        });
    };

    const columns = useMemo<ColumnDef<Expense>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={
                                table.getIsAllPageRowsSelected() ||
                                (table.getIsSomePageRowsSelected() &&
                                    'indeterminate')
                            }
                            onCheckedChange={(value) =>
                                table.toggleAllPageRowsSelected(!!value)
                            }
                            aria-label="Select all"
                        />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) =>
                                row.toggleSelected(!!value)
                            }
                            aria-label="Select row"
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'expense_date',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === 'asc',
                                )
                            }
                            className="h-8 px-2 lg:px-3"
                        >
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div>
                        {new Date(
                            row.getValue('expense_date'),
                        ).toLocaleDateString()}
                    </div>
                ),
            },
            {
                id: 'purchase',
                header: 'Purchase',
                cell: ({ row }) => {
                    const expense = row.original;
                    return expense.purchase ? (
                        <div>
                            <div className="font-medium">
                                {new Date(
                                    expense.purchase.purchase_date,
                                ).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {expense.purchase.supplier.name}
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
            {
                accessorKey: 'type',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === 'asc',
                                )
                            }
                            className="h-8 px-2 lg:px-3"
                        >
                            Type
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div className="capitalize">{row.getValue('type')}</div>
                ),
            },
            {
                accessorKey: 'description',
                header: 'Description',
                cell: ({ row }) => (
                    <div
                        className="max-w-[300px] truncate"
                        title={row.getValue('description')}
                    >
                        {row.getValue('description')}
                    </div>
                ),
            },
            {
                accessorKey: 'amount',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === 'asc',
                                )
                            }
                            className="h-8 px-2 lg:px-3"
                        >
                            Amount
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div className="font-medium">
                        SBD {Number(row.getValue('amount')).toFixed(2)}
                    </div>
                ),
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }) => {
                    const expense = row.original;
                    return (
                        <div className="flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                        size="icon"
                                    >
                                        <span className="sr-only">
                                            Open menu
                                        </span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setSelectedExpense(expense);
                                            setShowOpen(true);
                                        }}
                                    >
                                        <EyeIcon className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleEdit(expense)}
                                    >
                                        <PencilIcon className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setSelectedExpense(expense);
                                            setDeleteOpen(true);
                                        }}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <TrashIcon className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
            },
        ],
        [handleEdit],
    );

    const table = useReactTable({
        data: expenses.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        enableRowSelection: true,
        manualSorting: true,
        manualPagination: true,
        state: {
            sorting,
            rowSelection,
            columnVisibility,
        },
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expenses" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Expenses</h1>
                    <Button onClick={() => setCreateOpen(true)}>
                        <PlusIcon />
                        Add Expense
                    </Button>
                </div>

                <Alert>
                    <InfoIcon />
                    <AlertTitle>About Expenses</AlertTitle>
                    <AlertDescription>
                        Track expenses related to purchases from suppliers, such
                        as freight/shipping costs, ice blocks for preserving
                        fish, fuel for fishermen's outboard motors (OBM), and
                        other operational costs. Link expenses to specific
                        purchases to accurately calculate the true cost and
                        profit for each purchase. Expenses not linked to a
                        purchase are considered general expenses.
                    </AlertDescription>
                </Alert>

                {/* Filters and Table Controls */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by description..."
                                value={searchValue}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select
                            value={purchaseFilter}
                            onValueChange={handlePurchaseFilter}
                        >
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="All Purchases" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Purchases
                                </SelectItem>
                                {purchases.map((purchase) => (
                                    <SelectItem
                                        key={purchase.id}
                                        value={purchase.id.toString()}
                                    >
                                        {new Date(
                                            purchase.purchase_date,
                                        ).toLocaleDateString()}{' '}
                                        - {purchase.supplier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Columns className="mr-2 h-4 w-4" />
                                    Columns
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {table
                                    .getAllColumns()
                                    .filter(
                                        (column) =>
                                            typeof column.accessorFn !==
                                                'undefined' &&
                                            column.getCanHide(),
                                    )
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        !!value,
                                                    )
                                                }
                                            >
                                                {column.id === 'expense_date' &&
                                                    'Date'}
                                                {column.id === 'purchase' &&
                                                    'Purchase'}
                                                {column.id === 'type' && 'Type'}
                                                {column.id === 'description' &&
                                                    'Description'}
                                                {column.id === 'amount' &&
                                                    'Amount'}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Data Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-muted/50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead
                                                key={header.id}
                                                className="px-4 py-3"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && 'selected'
                                        }
                                        className={
                                            row.getIsSelected()
                                                ? 'bg-muted/50'
                                                : ''
                                        }
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className="px-4 py-3"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-96 p-0"
                                    >
                                        <Empty>
                                            <EmptyMedia variant="icon">
                                                <Receipt className="size-8" />
                                            </EmptyMedia>
                                            <EmptyHeader>
                                                <EmptyTitle>
                                                    No expenses found
                                                </EmptyTitle>
                                                <EmptyDescription>
                                                    Get started by recording
                                                    your first expense. Track
                                                    costs like freight, ice,
                                                    fuel, and other operational
                                                    expenses.
                                                </EmptyDescription>
                                            </EmptyHeader>
                                            <EmptyContent>
                                                <Button
                                                    onClick={() =>
                                                        setCreateOpen(true)
                                                    }
                                                >
                                                    <PlusIcon className="mr-2 h-4 w-4" />
                                                    Add Expense
                                                </Button>
                                            </EmptyContent>
                                        </Empty>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination and Selection Info */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {Object.keys(rowSelection).length > 0 && (
                            <div className="text-sm text-muted-foreground">
                                {Object.keys(rowSelection).length} of{' '}
                                {expenses.data.length} row(s) selected
                            </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                            Showing {expenses.from} to {expenses.to} of{' '}
                            {expenses.total} expenses
                        </div>
                    </div>
                    {expenses.last_page > 1 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Label
                                    htmlFor="rows-per-page"
                                    className="text-sm font-medium"
                                >
                                    Rows per page
                                </Label>
                                <Select
                                    value={expenses.per_page.toString()}
                                    onValueChange={(value) => {
                                        router.get(
                                            '/expenses',
                                            {
                                                purchase_id:
                                                    filters.purchase_id,
                                                search:
                                                    searchValue || undefined,
                                                per_page: value,
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                                only: ['expenses', 'filters'],
                                            },
                                        );
                                    }}
                                >
                                    <SelectTrigger
                                        size="sm"
                                        className="w-20"
                                        id="rows-per-page"
                                    >
                                        <SelectValue
                                            placeholder={expenses.per_page.toString()}
                                        />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 15, 20, 25, 50].map(
                                            (pageSize) => (
                                                <SelectItem
                                                    key={pageSize}
                                                    value={pageSize.toString()}
                                                >
                                                    {pageSize}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-center text-sm font-medium">
                                Page {expenses.current_page} of{' '}
                                {expenses.last_page}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const firstPageUrl =
                                            expenses.links.find((link) =>
                                                link.label.includes('Previous'),
                                            )?.url || expenses.links[0]?.url;
                                        if (
                                            firstPageUrl &&
                                            expenses.current_page > 1
                                        ) {
                                            handlePageChange(firstPageUrl);
                                        }
                                    }}
                                    disabled={expenses.current_page === 1}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                    <span className="sr-only">
                                        Go to first page
                                    </span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const prevPageUrl =
                                            expenses.links.find((link) =>
                                                link.label.includes('Previous'),
                                            )?.url || expenses.links[0]?.url;
                                        if (
                                            prevPageUrl &&
                                            expenses.current_page > 1
                                        ) {
                                            handlePageChange(prevPageUrl);
                                        }
                                    }}
                                    disabled={expenses.current_page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="sr-only">
                                        Go to previous page
                                    </span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const nextPageUrl =
                                            expenses.links.find((link) =>
                                                link.label.includes('Next'),
                                            )?.url ||
                                            expenses.links[
                                                expenses.links.length - 1
                                            ]?.url;
                                        if (
                                            nextPageUrl &&
                                            expenses.current_page <
                                                expenses.last_page
                                        ) {
                                            handlePageChange(nextPageUrl);
                                        }
                                    }}
                                    disabled={
                                        expenses.current_page ===
                                        expenses.last_page
                                    }
                                >
                                    <ChevronRight className="h-4 w-4" />
                                    <span className="sr-only">
                                        Go to next page
                                    </span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const lastPageUrl =
                                            expenses.links.find((link) =>
                                                link.label.includes('Next'),
                                            )?.url ||
                                            expenses.links[
                                                expenses.links.length - 1
                                            ]?.url;
                                        if (
                                            lastPageUrl &&
                                            expenses.current_page <
                                                expenses.last_page
                                        ) {
                                            handlePageChange(lastPageUrl);
                                        }
                                    }}
                                    disabled={
                                        expenses.current_page ===
                                        expenses.last_page
                                    }
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                    <span className="sr-only">
                                        Go to last page
                                    </span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Expenses</DialogTitle>
                            <DialogDescription>
                                Add one or more expenses. Click "Add Another" to
                                add multiple expenses at once.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                            {(createForm.data.expenses || []).map(
                                (expense, index) => (
                                    <div
                                        key={index}
                                        className="space-y-4 rounded-lg border p-4"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold">
                                                Expense {index + 1}
                                            </h3>
                                            {(createForm.data.expenses || [])
                                                .length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        removeExpenseRow(index)
                                                    }
                                                    className="h-8 w-8"
                                                >
                                                    <XIcon className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <Label>
                                                    Purchase (Optional)
                                                </Label>
                                                <Select
                                                    value={
                                                        expense.purchase_id ||
                                                        ''
                                                    }
                                                    onValueChange={(value) =>
                                                        updateExpenseRow(
                                                            index,
                                                            'purchase_id',
                                                            value || '',
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select a purchase (optional)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {purchases.length >
                                                        0 ? (
                                                            purchases.map(
                                                                (purchase) => (
                                                                    <SelectItem
                                                                        key={
                                                                            purchase.id
                                                                        }
                                                                        value={purchase.id.toString()}
                                                                    >
                                                                        {new Date(
                                                                            purchase.purchase_date,
                                                                        ).toLocaleDateString()}{' '}
                                                                        -{' '}
                                                                        {
                                                                            purchase
                                                                                .supplier
                                                                                .name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )
                                                        ) : (
                                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                                No purchases
                                                                available
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Expense Date *</Label>
                                                <DatePicker
                                                    value={expense.expense_date}
                                                    onChange={(value) =>
                                                        updateExpenseRow(
                                                            index,
                                                            'expense_date',
                                                            value,
                                                        )
                                                    }
                                                    placeholder="Select expense date"
                                                    className="mt-1"
                                                />
                                                {createForm.errors[
                                                    `expenses.${index}.expense_date`
                                                ] && (
                                                    <p className="mt-1 text-sm text-destructive">
                                                        {
                                                            createForm.errors[
                                                                `expenses.${index}.expense_date`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <Label>Type *</Label>
                                                <Select
                                                    value={expense.type}
                                                    onValueChange={(
                                                        value:
                                                            | 'shipping'
                                                            | 'ice'
                                                            | 'other',
                                                    ) =>
                                                        updateExpenseRow(
                                                            index,
                                                            'type',
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="shipping">
                                                            Shipping
                                                        </SelectItem>
                                                        <SelectItem value="ice">
                                                            Ice
                                                        </SelectItem>
                                                        <SelectItem value="other">
                                                            Other
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {createForm.errors[
                                                    `expenses.${index}.type`
                                                ] && (
                                                    <p className="mt-1 text-sm text-destructive">
                                                        {
                                                            createForm.errors[
                                                                `expenses.${index}.type`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <Label>Amount (SBD) *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={expense.amount}
                                                    onChange={(e) =>
                                                        updateExpenseRow(
                                                            index,
                                                            'amount',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1"
                                                />
                                                {createForm.errors[
                                                    `expenses.${index}.amount`
                                                ] && (
                                                    <p className="mt-1 text-sm text-destructive">
                                                        {
                                                            createForm.errors[
                                                                `expenses.${index}.amount`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Description *</Label>
                                            <textarea
                                                value={expense.description}
                                                onChange={(e) =>
                                                    updateExpenseRow(
                                                        index,
                                                        'description',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                                placeholder="Enter expense description"
                                            />
                                            {createForm.errors[
                                                `expenses.${index}.description`
                                            ] && (
                                                <p className="mt-1 text-sm text-destructive">
                                                    {
                                                        createForm.errors[
                                                            `expenses.${index}.description`
                                                        ]
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ),
                            )}
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addExpenseRow}
                                >
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Add Another Expense
                                </Button>
                            </div>
                            {createForm.errors.expenses &&
                                typeof createForm.errors.expenses ===
                                    'string' && (
                                    <p className="text-sm text-destructive">
                                        {createForm.errors.expenses}
                                    </p>
                                )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCreateOpen(false);
                                    createForm.setData('expenses', [
                                        {
                                            purchase_id: '',
                                            expense_date: new Date()
                                                .toISOString()
                                                .split('T')[0],
                                            type: 'other' as
                                                | 'shipping'
                                                | 'ice'
                                                | 'other',
                                            description: '',
                                            amount: '',
                                        },
                                    ]);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={createForm.processing}
                            >
                                Create {createForm.data.expenses?.length || 1}{' '}
                                Expense
                                {(createForm.data.expenses?.length || 1) !== 1
                                    ? 's'
                                    : ''}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Expense</DialogTitle>
                            <DialogDescription>
                                Update expense information.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-purchase_id">
                                    Purchase (Optional)
                                </Label>
                                <Select
                                    value={editForm.data.purchase_id || ''}
                                    onValueChange={(value) =>
                                        editForm.setData(
                                            'purchase_id',
                                            value || '',
                                        )
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select a purchase (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {purchases.length > 0 ? (
                                            purchases.map((purchase) => (
                                                <SelectItem
                                                    key={purchase.id}
                                                    value={purchase.id.toString()}
                                                >
                                                    {new Date(
                                                        purchase.purchase_date,
                                                    ).toLocaleDateString()}{' '}
                                                    - {purchase.supplier.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                No purchases available
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Link this expense to a specific purchase
                                    (e.g., freight, ice, fuel for this
                                    purchase). Leave empty for general expenses
                                    not tied to a specific purchase.
                                </p>
                                {editForm.errors.purchase_id && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {editForm.errors.purchase_id}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="edit-expense_date">
                                    Expense Date *
                                </Label>
                                <DatePicker
                                    id="edit-expense_date"
                                    value={editForm.data.expense_date}
                                    onChange={(value) =>
                                        editForm.setData('expense_date', value)
                                    }
                                    placeholder="Select expense date"
                                    className="mt-1"
                                />
                                {editForm.errors.expense_date && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {editForm.errors.expense_date}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="edit-type">Type *</Label>
                                <Select
                                    value={editForm.data.type}
                                    onValueChange={(
                                        value: 'shipping' | 'ice' | 'other',
                                    ) => editForm.setData('type', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="shipping">
                                            Shipping
                                        </SelectItem>
                                        <SelectItem value="ice">Ice</SelectItem>
                                        <SelectItem value="other">
                                            Other
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {editForm.errors.type && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {editForm.errors.type}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="edit-description">
                                    Description *
                                </Label>
                                <textarea
                                    id="edit-description"
                                    value={editForm.data.description}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                />
                                {editForm.errors.description && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {editForm.errors.description}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="edit-amount">
                                    Amount (SBD) *
                                </Label>
                                <Input
                                    id="edit-amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editForm.data.amount}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'amount',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1"
                                />
                                {editForm.errors.amount && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {editForm.errors.amount}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setEditOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdate}
                                disabled={editForm.processing}
                            >
                                Update
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Show Modal */}
                <Dialog open={showOpen} onOpenChange={setShowOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Expense Details</DialogTitle>
                        </DialogHeader>
                        {selectedExpense && (
                            <div className="space-y-4">
                                {selectedExpense.purchase && (
                                    <div>
                                        <Label>Purchase</Label>
                                        <p className="mt-1">
                                            {new Date(
                                                selectedExpense.purchase.purchase_date,
                                            ).toLocaleDateString()}{' '}
                                            -{' '}
                                            {
                                                selectedExpense.purchase
                                                    .supplier.name
                                            }
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <Label>Date</Label>
                                    <p className="mt-1">
                                        {new Date(
                                            selectedExpense.expense_date,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <Label>Type</Label>
                                    <p className="mt-1 capitalize">
                                        {selectedExpense.type}
                                    </p>
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <p className="mt-1">
                                        {selectedExpense.description}
                                    </p>
                                </div>
                                <div>
                                    <Label>Amount</Label>
                                    <p className="mt-1 font-semibold">
                                        SBD{' '}
                                        {Number(selectedExpense.amount).toFixed(
                                            2,
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowOpen(false)}
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Modal */}
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Expense</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this expense?
                                This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
