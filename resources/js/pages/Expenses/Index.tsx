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
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
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
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Columns,
    DollarSign,
    EyeIcon,
    FileText,
    InfoIcon,
    MoreHorizontal,
    Package,
    PencilIcon,
    PlusIcon,
    Receipt,
    Search,
    ShoppingCart,
    TrashIcon,
    Truck,
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
                    <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0">
                        <DialogHeader className="flex-shrink-0 pb-4">
                            <DialogTitle>Create Expenses</DialogTitle>
                            <DialogDescription>
                                Add one or more expenses. Click "Add Another" to
                                add multiple expenses at once. All fields marked
                                with * are required.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-1">
                            <FieldGroup className="gap-6">
                                {(createForm.data.expenses || []).map(
                                    (expense, index) => (
                                        <div
                                            key={index}
                                            className="space-y-5 rounded-lg border bg-muted/30 p-5"
                                        >
                                            <Item className="pb-2">
                                                <ItemMedia variant="icon">
                                                    <Receipt className="h-5 w-5" />
                                                </ItemMedia>
                                                <ItemContent>
                                                    <ItemTitle>
                                                        {expense.type
                                                            ? expense.type
                                                                  .charAt(0)
                                                                  .toUpperCase() +
                                                              expense.type.slice(
                                                                  1,
                                                              )
                                                            : `Expense ${index + 1}`}
                                                    </ItemTitle>
                                                    {(
                                                        createForm.data
                                                            .expenses || []
                                                    ).length > 1 && (
                                                        <ItemDescription className="mt-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    removeExpenseRow(
                                                                        index,
                                                                    )
                                                                }
                                                                className="h-auto p-0 text-destructive hover:text-destructive"
                                                            >
                                                                <XIcon className="mr-1 h-3 w-3" />
                                                                Remove
                                                            </Button>
                                                        </ItemDescription>
                                                    )}
                                                </ItemContent>
                                            </Item>
                                            <FieldGroup className="gap-6">
                                                {/* Essential Information */}
                                                <FieldSet>
                                                    <FieldLegend variant="label">
                                                        Essential Information
                                                    </FieldLegend>
                                                    <FieldGroup className="gap-5">
                                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                            <Field
                                                                data-invalid={
                                                                    !!createForm
                                                                        .errors[
                                                                        `expenses.${index}.expense_date`
                                                                    ]
                                                                }
                                                                className="space-y-2"
                                                            >
                                                                <FieldLabel>
                                                                    Expense Date
                                                                    *
                                                                </FieldLabel>
                                                                <div className="relative">
                                                                    <Calendar className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                                    <DatePicker
                                                                        value={
                                                                            expense.expense_date
                                                                        }
                                                                        onChange={(
                                                                            value,
                                                                        ) =>
                                                                            updateExpenseRow(
                                                                                index,
                                                                                'expense_date',
                                                                                value,
                                                                            )
                                                                        }
                                                                        placeholder="Select expense date"
                                                                        className="pl-9"
                                                                    />
                                                                </div>
                                                                <FieldError>
                                                                    {
                                                                        createForm
                                                                            .errors[
                                                                            `expenses.${index}.expense_date`
                                                                        ]
                                                                    }
                                                                </FieldError>
                                                            </Field>
                                                            <Field
                                                                data-invalid={
                                                                    !!createForm
                                                                        .errors[
                                                                        `expenses.${index}.type`
                                                                    ]
                                                                }
                                                                className="space-y-2"
                                                            >
                                                                <FieldLabel>
                                                                    Type *
                                                                </FieldLabel>
                                                                <div className="relative">
                                                                    <Select
                                                                        value={
                                                                            expense.type
                                                                        }
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
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="shipping">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Truck className="h-4 w-4" />
                                                                                    Shipping
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="ice">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Package className="h-4 w-4" />
                                                                                    Ice
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="other">
                                                                                <div className="flex items-center gap-2">
                                                                                    <FileText className="h-4 w-4" />
                                                                                    Other
                                                                                </div>
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <FieldError>
                                                                    {
                                                                        createForm
                                                                            .errors[
                                                                            `expenses.${index}.type`
                                                                        ]
                                                                    }
                                                                </FieldError>
                                                            </Field>
                                                        </div>
                                                    </FieldGroup>
                                                </FieldSet>

                                                {/* Financial Details */}
                                                <FieldSet>
                                                    <FieldLegend variant="label">
                                                        Financial Details
                                                    </FieldLegend>
                                                    <FieldGroup className="gap-5">
                                                        <Field
                                                            data-invalid={
                                                                !!createForm
                                                                    .errors[
                                                                    `expenses.${index}.amount`
                                                                ]
                                                            }
                                                            className="max-w-md space-y-2"
                                                        >
                                                            <FieldLabel>
                                                                Amount (SBD) *
                                                            </FieldLabel>
                                                            <div className="relative">
                                                                <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={
                                                                        expense.amount
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateExpenseRow(
                                                                            index,
                                                                            'amount',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="pl-9"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                            <FieldError>
                                                                {
                                                                    createForm
                                                                        .errors[
                                                                        `expenses.${index}.amount`
                                                                    ]
                                                                }
                                                            </FieldError>
                                                        </Field>
                                                    </FieldGroup>
                                                </FieldSet>

                                                {/* Additional Information */}
                                                <FieldSet>
                                                    <FieldLegend variant="label">
                                                        Additional Information
                                                    </FieldLegend>
                                                    <FieldGroup className="gap-5">
                                                        <Field className="space-y-2">
                                                            <FieldLabel>
                                                                Purchase
                                                                (Optional)
                                                            </FieldLabel>
                                                            <Select
                                                                value={
                                                                    expense.purchase_id ||
                                                                    ''
                                                                }
                                                                onValueChange={(
                                                                    value,
                                                                ) =>
                                                                    updateExpenseRow(
                                                                        index,
                                                                        'purchase_id',
                                                                        value ||
                                                                            '',
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select a purchase (optional)" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {purchases.length >
                                                                    0 ? (
                                                                        purchases.map(
                                                                            (
                                                                                purchase,
                                                                            ) => (
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
                                                                            No
                                                                            purchases
                                                                            available
                                                                        </div>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </Field>
                                                        <Field
                                                            data-invalid={
                                                                !!createForm
                                                                    .errors[
                                                                    `expenses.${index}.description`
                                                                ]
                                                            }
                                                            className="space-y-2"
                                                        >
                                                            <FieldLabel>
                                                                Description *
                                                            </FieldLabel>
                                                            <div className="relative">
                                                                <FileText className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                                                <textarea
                                                                    value={
                                                                        expense.description
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateExpenseRow(
                                                                            index,
                                                                            'description',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm"
                                                                    placeholder="Enter expense description"
                                                                />
                                                            </div>
                                                            <FieldError>
                                                                {
                                                                    createForm
                                                                        .errors[
                                                                        `expenses.${index}.description`
                                                                    ]
                                                                }
                                                            </FieldError>
                                                        </Field>
                                                    </FieldGroup>
                                                </FieldSet>
                                            </FieldGroup>
                                        </div>
                                    ),
                                )}
                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={addExpenseRow}
                                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                                    >
                                        <PlusIcon className="mr-1.5 h-4 w-4" />
                                        Add Another Expense
                                    </Button>
                                </div>
                                {createForm.errors.expenses &&
                                    typeof createForm.errors.expenses ===
                                        'string' && (
                                        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
                                            <p className="text-sm text-destructive">
                                                {createForm.errors.expenses}
                                            </p>
                                        </div>
                                    )}
                            </FieldGroup>
                        </div>
                        <DialogFooter className="flex-shrink-0 border-t pt-4">
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
                                {createForm.processing ? (
                                    <>
                                        <PlusIcon className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Receipt className="mr-2 h-4 w-4" />
                                        Create{' '}
                                        {createForm.data.expenses?.length ||
                                            1}{' '}
                                        Expense
                                        {(createForm.data.expenses?.length ||
                                            1) !== 1
                                            ? 's'
                                            : ''}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="flex max-h-[90vh] flex-col gap-0 sm:max-w-[500px]">
                        <DialogHeader className="flex-shrink-0 pb-4">
                            <DialogTitle>Edit Expense</DialogTitle>
                            <DialogDescription>
                                Update expense information. All fields marked
                                with * are required.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-1">
                            <FieldGroup className="gap-6">
                                <Field>
                                    <FieldLabel htmlFor="edit-purchase_id">
                                        Purchase (Optional)
                                    </FieldLabel>
                                    <div className="relative">
                                        <ShoppingCart className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Select
                                            value={
                                                editForm.data.purchase_id || ''
                                            }
                                            onValueChange={(value) =>
                                                editForm.setData(
                                                    'purchase_id',
                                                    value || '',
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="edit-purchase_id"
                                                className="pl-9"
                                            >
                                                <SelectValue placeholder="Select a purchase (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {purchases.length > 0 ? (
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
                                                        No purchases available
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <FieldDescription>
                                        Link this expense to a specific purchase
                                        (e.g., freight, ice, fuel for this
                                        purchase). Leave empty for general
                                        expenses not tied to a specific
                                        purchase.
                                    </FieldDescription>
                                    <FieldError>
                                        {editForm.errors.purchase_id}
                                    </FieldError>
                                </Field>
                                <Field
                                    data-invalid={
                                        !!editForm.errors.expense_date
                                    }
                                >
                                    <FieldLabel htmlFor="edit-expense_date">
                                        Expense Date *
                                    </FieldLabel>
                                    <div className="relative">
                                        <Calendar className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <DatePicker
                                            id="edit-expense_date"
                                            value={editForm.data.expense_date}
                                            onChange={(value) =>
                                                editForm.setData(
                                                    'expense_date',
                                                    value,
                                                )
                                            }
                                            placeholder="Select expense date"
                                            className="pl-9"
                                        />
                                    </div>
                                    <FieldError>
                                        {editForm.errors.expense_date}
                                    </FieldError>
                                </Field>
                                <Field data-invalid={!!editForm.errors.type}>
                                    <FieldLabel htmlFor="edit-type">
                                        Type *
                                    </FieldLabel>
                                    <Select
                                        value={editForm.data.type}
                                        onValueChange={(
                                            value: 'shipping' | 'ice' | 'other',
                                        ) => editForm.setData('type', value)}
                                    >
                                        <SelectTrigger id="edit-type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="shipping">
                                                <div className="flex items-center gap-2">
                                                    <Truck className="h-4 w-4" />
                                                    Shipping
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="ice">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4" />
                                                    Ice
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="other">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    Other
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FieldError>
                                        {editForm.errors.type}
                                    </FieldError>
                                </Field>
                                <Field
                                    data-invalid={!!editForm.errors.description}
                                >
                                    <FieldLabel htmlFor="edit-description">
                                        Description *
                                    </FieldLabel>
                                    <div className="relative">
                                        <FileText className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <textarea
                                            id="edit-description"
                                            value={editForm.data.description}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm"
                                            placeholder="Enter expense description"
                                        />
                                    </div>
                                    <FieldError>
                                        {editForm.errors.description}
                                    </FieldError>
                                </Field>
                                <Field data-invalid={!!editForm.errors.amount}>
                                    <FieldLabel htmlFor="edit-amount">
                                        Amount (SBD) *
                                    </FieldLabel>
                                    <div className="relative">
                                        <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                                            className="pl-9"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <FieldError>
                                        {editForm.errors.amount}
                                    </FieldError>
                                </Field>
                            </FieldGroup>
                        </div>
                        <DialogFooter className="flex-shrink-0 border-t pt-4">
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
                                {editForm.processing ? (
                                    <>
                                        <PencilIcon className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <PencilIcon className="mr-2 h-4 w-4" />
                                        Update Expense
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Show Modal */}
                <Dialog open={showOpen} onOpenChange={setShowOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Expense Details</DialogTitle>
                            <DialogDescription>
                                View complete expense information.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedExpense && (
                            <ItemGroup>
                                {selectedExpense.purchase && (
                                    <Item>
                                        <ItemMedia variant="icon">
                                            <ShoppingCart className="h-5 w-5" />
                                        </ItemMedia>
                                        <ItemContent>
                                            <ItemTitle>Purchase</ItemTitle>
                                            <ItemDescription>
                                                {new Date(
                                                    selectedExpense.purchase.purchase_date,
                                                ).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}{' '}
                                                -{' '}
                                                {
                                                    selectedExpense.purchase
                                                        .supplier.name
                                                }
                                            </ItemDescription>
                                        </ItemContent>
                                    </Item>
                                )}
                                <Item>
                                    <ItemMedia variant="icon">
                                        <Calendar className="h-5 w-5" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle>Expense Date</ItemTitle>
                                        <ItemDescription>
                                            {new Date(
                                                selectedExpense.expense_date,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                <Item>
                                    <ItemMedia variant="icon">
                                        {selectedExpense.type === 'shipping' ? (
                                            <Truck className="h-5 w-5" />
                                        ) : selectedExpense.type === 'ice' ? (
                                            <Package className="h-5 w-5" />
                                        ) : (
                                            <Receipt className="h-5 w-5" />
                                        )}
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle>Type</ItemTitle>
                                        <ItemDescription className="capitalize">
                                            {selectedExpense.type}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                <Item>
                                    <ItemMedia variant="icon">
                                        <FileText className="h-5 w-5" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle>Description</ItemTitle>
                                        <ItemDescription>
                                            {selectedExpense.description}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                <Item>
                                    <ItemMedia variant="icon">
                                        <DollarSign className="h-5 w-5" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle>Amount</ItemTitle>
                                        <ItemDescription>
                                            <span className="font-semibold">
                                                SBD{' '}
                                                {Number(
                                                    selectedExpense.amount,
                                                ).toFixed(2)}
                                            </span>
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                            </ItemGroup>
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
