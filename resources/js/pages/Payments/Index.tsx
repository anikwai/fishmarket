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
    CreditCard,
    EyeIcon,
    InfoIcon,
    MoreHorizontal,
    PencilIcon,
    PlusIcon,
    Search,
    TrashIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payments',
        href: '/payments',
    },
];

interface Sale {
    id: number;
    total_amount: number | string;
    customer: {
        name: string;
    };
}

interface Payment {
    id: number;
    payment_date: string;
    amount: number | string;
    notes: string | null;
    sale: Sale;
}

interface CreditSale {
    id: number;
    customer_name: string;
    total_amount: number | string;
    outstanding_balance: number | string;
}

interface PaymentsProps {
    payments: {
        data: Payment[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    creditSales: CreditSale[];
    filters?: {
        search?: string;
        sale_id?: string;
    };
}

export default function PaymentsIndex({
    payments,
    creditSales,
    filters = {},
}: PaymentsProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [showOpen, setShowOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(
        null,
    );
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {},
    );
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [saleFilter, setSaleFilter] = useState(filters.sale_id || 'all');
    const isInitialMount = useRef(true);

    // Debounced search function
    const performSearch = useCallback((search: string, saleId: string) => {
        router.get(
            '/payments',
            {
                search: search || undefined,
                sale_id: saleId === 'all' ? undefined : saleId,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['payments', 'filters'],
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
            performSearch(searchValue, saleFilter);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchValue, saleFilter, performSearch]);

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
            '/payments',
            {
                search: searchValue || undefined,
                sale_id: saleFilter === 'all' ? undefined : saleFilter,
                ...sortParam,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['payments', 'filters'],
            },
        );
    }, [sorting, searchValue, saleFilter]);

    const createForm = useForm({
        sale_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        notes: '',
    });

    const editForm = useForm({
        sale_id: '',
        payment_date: '',
        amount: '',
        notes: '',
    });

    const handleSaleFilter = (value: string) => {
        setSaleFilter(value);
        router.get(
            '/payments',
            {
                search: searchValue || undefined,
                sale_id: value === 'all' ? undefined : value,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['payments', 'filters'],
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

    // Fetch credit sales when create modal opens
    const handleCreateOpen = () => {
        setCreateOpen(true);
    };

    const handleCreate = () => {
        createForm.post('/payments', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEdit = useCallback(
        (payment: Payment) => {
            setSelectedPayment(payment);
            editForm.setData({
                sale_id: payment.sale.id.toString(),
                payment_date: payment.payment_date,
                amount: payment.amount.toString(),
                notes: payment.notes || '',
            });
            setEditOpen(true);
        },
        [editForm],
    );

    const handleUpdate = () => {
        if (!selectedPayment) return;
        editForm.put(`/payments/${selectedPayment.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditOpen(false);
                setSelectedPayment(null);
            },
        });
    };

    const handleDelete = () => {
        if (!selectedPayment) return;
        router.delete(`/payments/${selectedPayment.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setSelectedPayment(null);
            },
        });
    };

    const columns = useMemo<ColumnDef<Payment>[]>(
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
                accessorKey: 'payment_date',
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
                            row.getValue('payment_date'),
                        ).toLocaleDateString()}
                    </div>
                ),
            },
            {
                id: 'customer',
                header: 'Customer',
                cell: ({ row }) => (
                    <div className="font-medium">
                        {row.original.sale.customer.name}
                    </div>
                ),
            },
            {
                id: 'sale_id',
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
                            Sale ID
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                accessorFn: (row) => row.sale.id,
                cell: ({ row }) => <div>#{row.original.sale.id}</div>,
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
                    const payment = row.original;
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
                                            setSelectedPayment(payment);
                                            setShowOpen(true);
                                        }}
                                    >
                                        <EyeIcon className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleEdit(payment)}
                                    >
                                        <PencilIcon className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setSelectedPayment(payment);
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
        data: payments.data,
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
            <Head title="Payments" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Payments</h1>
                    <Button onClick={handleCreateOpen}>
                        <PlusIcon />
                        Add Payment
                    </Button>
                </div>

                <Alert>
                    <InfoIcon />
                    <AlertTitle>About Payments</AlertTitle>
                    <AlertDescription>
                        Record payments for credit sales here. Only credit sales
                        (sales marked as "Credit") will appear in the dropdown.
                        You can make multiple payments for the same sale until
                        the full amount is paid. The system automatically tracks
                        outstanding balances and updates them as payments are
                        recorded. Check the Sales page to see which sales have
                        outstanding balances.
                    </AlertDescription>
                </Alert>

                {/* Filters and Table Controls */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by customer name..."
                                value={searchValue}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        {creditSales.length > 0 && (
                            <Select
                                value={saleFilter}
                                onValueChange={handleSaleFilter}
                            >
                                <SelectTrigger className="w-[250px]">
                                    <SelectValue placeholder="All Sales" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Sales
                                    </SelectItem>
                                    {creditSales.map((sale) => (
                                        <SelectItem
                                            key={sale.id}
                                            value={sale.id.toString()}
                                        >
                                            Sale #{sale.id} -{' '}
                                            {sale.customer_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
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
                                                {column.id === 'payment_date' &&
                                                    'Date'}
                                                {column.id === 'customer' &&
                                                    'Customer'}
                                                {column.id === 'sale_id' &&
                                                    'Sale ID'}
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
                                                <CreditCard className="size-8" />
                                            </EmptyMedia>
                                            <EmptyHeader>
                                                <EmptyTitle>
                                                    No payments found
                                                </EmptyTitle>
                                                <EmptyDescription>
                                                    Get started by recording
                                                    your first payment. Payments
                                                    are used to track payments
                                                    for credit sales.
                                                </EmptyDescription>
                                            </EmptyHeader>
                                            <EmptyContent>
                                                <Button
                                                    onClick={() =>
                                                        setCreateOpen(true)
                                                    }
                                                >
                                                    <PlusIcon className="mr-2 h-4 w-4" />
                                                    Add Payment
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
                                {payments.data.length} row(s) selected
                            </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                            Showing {payments.from} to {payments.to} of{' '}
                            {payments.total} payments
                        </div>
                    </div>
                    {payments.last_page > 1 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Label
                                    htmlFor="rows-per-page"
                                    className="text-sm font-medium"
                                >
                                    Rows per page
                                </Label>
                                <Select
                                    value={payments.per_page.toString()}
                                    onValueChange={(value) => {
                                        router.get(
                                            '/payments',
                                            {
                                                sale_id: filters.sale_id,
                                                search:
                                                    searchValue || undefined,
                                                per_page: value,
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                                only: ['payments', 'filters'],
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
                                            placeholder={payments.per_page.toString()}
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
                                Page {payments.current_page} of{' '}
                                {payments.last_page}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const firstPageUrl =
                                            payments.links.find((link) =>
                                                link.label.includes('Previous'),
                                            )?.url || payments.links[0]?.url;
                                        if (
                                            firstPageUrl &&
                                            payments.current_page > 1
                                        ) {
                                            handlePageChange(firstPageUrl);
                                        }
                                    }}
                                    disabled={payments.current_page === 1}
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
                                            payments.links.find((link) =>
                                                link.label.includes('Previous'),
                                            )?.url || payments.links[0]?.url;
                                        if (
                                            prevPageUrl &&
                                            payments.current_page > 1
                                        ) {
                                            handlePageChange(prevPageUrl);
                                        }
                                    }}
                                    disabled={payments.current_page === 1}
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
                                            payments.links.find((link) =>
                                                link.label.includes('Next'),
                                            )?.url ||
                                            payments.links[
                                                payments.links.length - 1
                                            ]?.url;
                                        if (
                                            nextPageUrl &&
                                            payments.current_page <
                                                payments.last_page
                                        ) {
                                            handlePageChange(nextPageUrl);
                                        }
                                    }}
                                    disabled={
                                        payments.current_page ===
                                        payments.last_page
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
                                            payments.links.find((link) =>
                                                link.label.includes('Next'),
                                            )?.url ||
                                            payments.links[
                                                payments.links.length - 1
                                            ]?.url;
                                        if (
                                            lastPageUrl &&
                                            payments.current_page <
                                                payments.last_page
                                        ) {
                                            handlePageChange(lastPageUrl);
                                        }
                                    }}
                                    disabled={
                                        payments.current_page ===
                                        payments.last_page
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
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Payment</DialogTitle>
                            <DialogDescription>
                                Record a payment for a credit sale.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="sale_id">Sale *</Label>
                                <Select
                                    value={createForm.data.sale_id}
                                    onValueChange={(value) =>
                                        createForm.setData('sale_id', value)
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select sale" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {creditSales.length > 0
                                            ? creditSales.map((sale) => (
                                                  <SelectItem
                                                      key={sale.id}
                                                      value={sale.id.toString()}
                                                  >
                                                      Sale #{sale.id} -{' '}
                                                      {sale.customer_name}{' '}
                                                      (Outstanding: SBD{' '}
                                                      {Number(
                                                          sale.outstanding_balance,
                                                      ).toFixed(2)}
                                                      )
                                                  </SelectItem>
                                              ))
                                            : null}
                                    </SelectContent>
                                </Select>
                                {createForm.errors.sale_id && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {createForm.errors.sale_id}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="payment_date">
                                    Payment Date *
                                </Label>
                                <DatePicker
                                    id="payment_date"
                                    value={createForm.data.payment_date}
                                    onChange={(value) =>
                                        createForm.setData(
                                            'payment_date',
                                            value,
                                        )
                                    }
                                    placeholder="Select payment date"
                                    className="mt-1"
                                />
                                {createForm.errors.payment_date && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {createForm.errors.payment_date}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="amount">Amount (SBD) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={createForm.data.amount}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'amount',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1"
                                />
                                {createForm.errors.amount && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {createForm.errors.amount}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="notes">Notes</Label>
                                <textarea
                                    id="notes"
                                    value={createForm.data.notes}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'notes',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setCreateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={createForm.processing}
                            >
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Payment</DialogTitle>
                            <DialogDescription>
                                Update payment information.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-payment_date">
                                    Payment Date *
                                </Label>
                                <DatePicker
                                    id="edit-payment_date"
                                    value={editForm.data.payment_date}
                                    onChange={(value) =>
                                        editForm.setData('payment_date', value)
                                    }
                                    placeholder="Select payment date"
                                    className="mt-1"
                                />
                                {editForm.errors.payment_date && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {editForm.errors.payment_date}
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
                                    min="0.01"
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
                            <div>
                                <Label htmlFor="edit-notes">Notes</Label>
                                <textarea
                                    id="edit-notes"
                                    value={editForm.data.notes}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'notes',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                />
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
                            <DialogTitle>Payment Details</DialogTitle>
                        </DialogHeader>
                        {selectedPayment && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Date</Label>
                                    <p className="mt-1">
                                        {new Date(
                                            selectedPayment.payment_date,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <Label>Customer</Label>
                                    <p className="mt-1">
                                        {selectedPayment.sale.customer.name}
                                    </p>
                                </div>
                                <div>
                                    <Label>Sale ID</Label>
                                    <p className="mt-1">
                                        #{selectedPayment.sale.id}
                                    </p>
                                </div>
                                <div>
                                    <Label>Amount</Label>
                                    <p className="mt-1 font-semibold">
                                        SBD{' '}
                                        {Number(selectedPayment.amount).toFixed(
                                            2,
                                        )}
                                    </p>
                                </div>
                                {selectedPayment.notes && (
                                    <div>
                                        <Label>Notes</Label>
                                        <p className="mt-1">
                                            {selectedPayment.notes}
                                        </p>
                                    </div>
                                )}
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
                            <DialogTitle>Delete Payment</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this payment?
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
