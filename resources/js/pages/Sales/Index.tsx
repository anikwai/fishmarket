import { DatePicker } from '@/components/date-picker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Item,
    ItemContent,
    ItemDescription,
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
    AlertCircle,
    ArrowUpDown,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CircleCheck,
    Columns,
    CreditCard,
    DollarSign,
    DownloadIcon,
    EyeIcon,
    FileText,
    InfoIcon,
    MailIcon,
    MoreHorizontal,
    Package,
    PencilIcon,
    Percent,
    PlusIcon,
    Search,
    TrashIcon,
    TrendingUp,
    Truck,
    User,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: '/sales',
    },
];

interface Customer {
    id: number;
    name: string;
    email?: string | null;
}

interface Payment {
    id: number;
    payment_date: string;
    amount: number | string;
    notes: string | null;
}

interface Sale {
    id: number;
    sale_date: string;
    quantity_kg: number | string;
    price_per_kg: number | string;
    discount_percentage: number | string;
    subtotal: number | string;
    delivery_fee: number | string;
    total_amount: number | string;
    is_credit: boolean;
    is_delivery: boolean;
    notes: string | null;
    customer: Customer;
    payments?: Payment[];
}

interface SalesProps {
    sales: {
        data: Sale[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    customers: Customer[];
    filters: {
        customer_id?: string;
        is_credit?: boolean;
        search?: string;
    };
    currentStock?: number;
}

export default function SalesIndex({
    sales,
    customers,
    filters,
    currentStock = 0,
}: SalesProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [showOpen, setShowOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {},
    );
    const [customerFilter, setCustomerFilter] = useState(
        filters.customer_id || 'all',
    );
    const [creditFilter, setCreditFilter] = useState(
        filters.is_credit !== undefined ? filters.is_credit.toString() : 'all',
    );
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const isInitialMount = useRef(true);

    // Debounced search function
    const performSearch = useCallback(
        (search: string, customerId: string, isCredit: string) => {
            router.get(
                '/sales',
                {
                    search: search || undefined,
                    customer_id: customerId === 'all' ? undefined : customerId,
                    is_credit:
                        isCredit === 'all' ? undefined : isCredit === 'true',
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['sales', 'filters'],
                },
            );
        },
        [],
    );

    // Debounce search input
    useEffect(() => {
        // Skip the initial mount to avoid unnecessary request
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            performSearch(searchValue, customerFilter, creditFilter);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchValue, customerFilter, creditFilter, performSearch]);

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
            '/sales',
            {
                search: searchValue || undefined,
                customer_id:
                    customerFilter === 'all' ? undefined : customerFilter,
                is_credit:
                    creditFilter === 'all'
                        ? undefined
                        : creditFilter === 'true',
                ...sortParam,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['sales', 'filters'],
            },
        );
    }, [sorting, searchValue, customerFilter, creditFilter]);

    const createForm = useForm({
        customer_id: '',
        sale_date: new Date().toISOString().split('T')[0],
        quantity_kg: '',
        price_per_kg: '',
        discount_percentage: '0',
        delivery_fee: '0',
        is_credit: false,
        is_delivery: false,
        notes: '',
    });

    const editForm = useForm({
        customer_id: '',
        sale_date: '',
        quantity_kg: '',
        price_per_kg: '',
        discount_percentage: '0',
        delivery_fee: '0',
        is_credit: false,
        is_delivery: false,
        notes: '',
    });

    const calculateSubtotal = (
        quantity: string,
        price: string,
        discount: string,
    ): number => {
        const qty = parseFloat(quantity) || 0;
        const prc = parseFloat(price) || 0;
        const disc = parseFloat(discount) || 0;
        return qty * prc * (1 - disc / 100);
    };

    const calculateTotal = (
        quantity: string,
        price: string,
        discount: string,
        delivery: string,
    ): number => {
        return (
            calculateSubtotal(quantity, price, discount) +
            (parseFloat(delivery) || 0)
        );
    };

    const handleCreate = () => {
        createForm.post('/sales', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEdit = useCallback(
        (sale: Sale) => {
            setSelectedSale(sale);
            editForm.setData({
                customer_id: sale.customer.id.toString(),
                sale_date: sale.sale_date,
                quantity_kg: sale.quantity_kg.toString(),
                price_per_kg: sale.price_per_kg.toString(),
                discount_percentage: sale.discount_percentage.toString(),
                delivery_fee: sale.delivery_fee.toString(),
                is_credit: sale.is_credit,
                is_delivery: sale.is_delivery,
                notes: sale.notes || '',
            });
            setEditOpen(true);
        },
        [editForm],
    );

    const handleUpdate = () => {
        if (!selectedSale) return;
        editForm.put(`/sales/${selectedSale.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditOpen(false);
                setSelectedSale(null);
            },
        });
    };

    const handleDelete = () => {
        if (!selectedSale) return;
        router.delete(`/sales/${selectedSale.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setSelectedSale(null);
            },
        });
    };

    const handleDownloadReceipt = (saleId: number) => {
        window.open(`/sales/${saleId}/receipt/download`, '_blank');
    };

    const handleSendReceiptEmail = (saleId: number) => {
        router.post(
            `/sales/${saleId}/receipt/email`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Show success message
                },
            },
        );
    };

    const outstandingBalance = (sale: Sale): number => {
        if (!sale.is_credit) return 0;
        const paid =
            sale.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        return Math.max(0, Number(sale.total_amount) - paid);
    };

    const handleCustomerFilter = (value: string) => {
        setCustomerFilter(value);
        router.get(
            '/sales',
            {
                search: searchValue || undefined,
                customer_id: value === 'all' ? undefined : value,
                is_credit:
                    creditFilter === 'all'
                        ? undefined
                        : creditFilter === 'true',
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['sales', 'filters'],
            },
        );
    };

    const handleCreditFilter = (value: string) => {
        setCreditFilter(value);
        router.get(
            '/sales',
            {
                search: searchValue || undefined,
                customer_id:
                    customerFilter === 'all' ? undefined : customerFilter,
                is_credit: value === 'all' ? undefined : value === 'true',
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['sales', 'filters'],
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

    const columns = useMemo<ColumnDef<Sale>[]>(
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
                accessorKey: 'sale_date',
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
                            row.getValue('sale_date'),
                        ).toLocaleDateString()}
                    </div>
                ),
            },
            {
                accessorKey: 'customer.name',
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
                            Customer
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div className="font-medium">
                        {row.original.customer.name}
                    </div>
                ),
            },
            {
                accessorKey: 'quantity_kg',
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
                            Quantity (kg)
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div>{Number(row.getValue('quantity_kg')).toFixed(2)}</div>
                ),
            },
            {
                accessorKey: 'total_amount',
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
                            Total
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div>
                        SBD {Number(row.getValue('total_amount')).toFixed(2)}
                    </div>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const sale = row.original;
                    const balance = outstandingBalance(sale);
                    if (sale.is_credit) {
                        return balance > 0 ? (
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                                <span className="font-medium text-destructive">
                                    Credit (SBD {balance.toFixed(2)})
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <CircleCheck className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-600">
                                    Paid
                                </span>
                            </div>
                        );
                    }
                    return (
                        <div className="flex items-center gap-2">
                            <CircleCheck className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-600">
                                Paid
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }) => {
                    const sale = row.original;
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
                                            setSelectedSale(sale);
                                            setShowOpen(true);
                                        }}
                                    >
                                        <EyeIcon className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            handleDownloadReceipt(sale.id)
                                        }
                                    >
                                        <DownloadIcon className="mr-2 h-4 w-4" />
                                        Download Receipt
                                    </DropdownMenuItem>
                                    {sale.customer.email && (
                                        <DropdownMenuItem
                                            onClick={() =>
                                                handleSendReceiptEmail(sale.id)
                                            }
                                        >
                                            <MailIcon className="mr-2 h-4 w-4" />
                                            Email Receipt
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => handleEdit(sale)}
                                    >
                                        <PencilIcon className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setSelectedSale(sale);
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
        data: sales.data,
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
            <Head title="Sales" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Sales</h1>
                    <Button onClick={() => setCreateOpen(true)}>
                        <PlusIcon />
                        Add Sale
                    </Button>
                </div>

                <Alert>
                    <InfoIcon />
                    <AlertTitle>About Sales</AlertTitle>
                    <AlertDescription>
                        Record all fish sales to customers here. Stock decreases
                        automatically when you record a sale. You can apply
                        discounts, charge delivery fees, and mark sales as
                        credit sales for customers who pay later. For credit
                        sales, use the Payments page to record payments.
                        Download or email receipts to customers who have email
                        addresses. The system tracks profit/loss by comparing
                        sale prices with purchase prices.
                    </AlertDescription>
                </Alert>

                {currentStock > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {currentStock.toFixed(2)} kg
                            </p>
                        </CardContent>
                    </Card>
                )}

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
                        <Select
                            value={customerFilter}
                            onValueChange={handleCustomerFilter}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Customers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Customers
                                </SelectItem>
                                {customers && customers.length > 0
                                    ? customers.map((customer) => (
                                          <SelectItem
                                              key={customer.id}
                                              value={customer.id.toString()}
                                          >
                                              {customer.name}
                                          </SelectItem>
                                      ))
                                    : null}
                            </SelectContent>
                        </Select>
                        <Select
                            value={creditFilter}
                            onValueChange={handleCreditFilter}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Sales" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sales</SelectItem>
                                <SelectItem value="true">
                                    Credit Sales
                                </SelectItem>
                                <SelectItem value="false">
                                    Paid Sales
                                </SelectItem>
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
                                                {column.id === 'sale_date' &&
                                                    'Date'}
                                                {column.id ===
                                                    'customer.name' &&
                                                    'Customer'}
                                                {column.id === 'quantity_kg' &&
                                                    'Quantity'}
                                                {column.id === 'total_amount' &&
                                                    'Total'}
                                                {column.id === 'status' &&
                                                    'Status'}
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
                                                <DollarSign className="size-8" />
                                            </EmptyMedia>
                                            <EmptyHeader>
                                                <EmptyTitle>
                                                    No sales found
                                                </EmptyTitle>
                                                <EmptyDescription>
                                                    Get started by recording
                                                    your first sale. Sales
                                                    decrease your stock and
                                                    generate revenue.
                                                </EmptyDescription>
                                            </EmptyHeader>
                                            <EmptyContent>
                                                <Button
                                                    onClick={() =>
                                                        setCreateOpen(true)
                                                    }
                                                >
                                                    <PlusIcon className="mr-2 h-4 w-4" />
                                                    Add Sale
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
                                {sales.data.length} row(s) selected
                            </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                            Showing {sales.from} to {sales.to} of {sales.total}{' '}
                            sales
                        </div>
                    </div>
                    {sales.last_page > 1 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Label
                                    htmlFor="rows-per-page"
                                    className="text-sm font-medium"
                                >
                                    Rows per page
                                </Label>
                                <Select
                                    value={sales.per_page.toString()}
                                    onValueChange={(value) => {
                                        router.get(
                                            '/sales',
                                            {
                                                customer_id:
                                                    filters.customer_id,
                                                is_credit: filters.is_credit,
                                                per_page: value,
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                                only: ['sales', 'filters'],
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
                                            placeholder={sales.per_page.toString()}
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
                                Page {sales.current_page} of {sales.last_page}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const firstPageUrl =
                                            sales.links.find((link) =>
                                                link.label.includes('Previous'),
                                            )?.url || sales.links[0]?.url;
                                        if (
                                            firstPageUrl &&
                                            sales.current_page > 1
                                        ) {
                                            handlePageChange(firstPageUrl);
                                        }
                                    }}
                                    disabled={sales.current_page === 1}
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
                                            sales.links.find((link) =>
                                                link.label.includes('Previous'),
                                            )?.url || sales.links[0]?.url;
                                        if (
                                            prevPageUrl &&
                                            sales.current_page > 1
                                        ) {
                                            handlePageChange(prevPageUrl);
                                        }
                                    }}
                                    disabled={sales.current_page === 1}
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
                                            sales.links.find((link) =>
                                                link.label.includes('Next'),
                                            )?.url ||
                                            sales.links[sales.links.length - 1]
                                                ?.url;
                                        if (
                                            nextPageUrl &&
                                            sales.current_page < sales.last_page
                                        ) {
                                            handlePageChange(nextPageUrl);
                                        }
                                    }}
                                    disabled={
                                        sales.current_page === sales.last_page
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
                                            sales.links.find((link) =>
                                                link.label.includes('Next'),
                                            )?.url ||
                                            sales.links[sales.links.length - 1]
                                                ?.url;
                                        if (
                                            lastPageUrl &&
                                            sales.current_page < sales.last_page
                                        ) {
                                            handlePageChange(lastPageUrl);
                                        }
                                    }}
                                    disabled={
                                        sales.current_page === sales.last_page
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
                    <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 sm:max-w-2xl">
                        <DialogHeader className="flex-shrink-0 pb-4">
                            <DialogTitle>Create Sale</DialogTitle>
                            <DialogDescription>
                                Record a new sale. Available stock:{' '}
                                <span className="font-semibold">
                                    {currentStock.toFixed(2)} kg
                                </span>
                                . All fields marked with * are required.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-1 pb-4">
                            <FieldGroup className="gap-6">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field
                                        data-invalid={
                                            !!createForm.errors.customer_id
                                        }
                                    >
                                        <FieldLabel htmlFor="customer_id">
                                            Customer *
                                        </FieldLabel>
                                        <div className="relative">
                                            <User className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Select
                                                value={
                                                    createForm.data.customer_id
                                                }
                                                onValueChange={(value) =>
                                                    createForm.setData(
                                                        'customer_id',
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    id="customer_id"
                                                    className="pl-9"
                                                >
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customers.map(
                                                        (customer) => (
                                                            <SelectItem
                                                                key={
                                                                    customer.id
                                                                }
                                                                value={customer.id.toString()}
                                                            >
                                                                {customer.name}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <FieldError>
                                            {createForm.errors.customer_id}
                                        </FieldError>
                                    </Field>
                                    <Field
                                        data-invalid={
                                            !!createForm.errors.sale_date
                                        }
                                    >
                                        <FieldLabel htmlFor="sale_date">
                                            Sale Date *
                                        </FieldLabel>
                                        <div className="relative">
                                            <Calendar className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <DatePicker
                                                id="sale_date"
                                                value={
                                                    createForm.data.sale_date
                                                }
                                                onChange={(value) =>
                                                    createForm.setData(
                                                        'sale_date',
                                                        value,
                                                    )
                                                }
                                                placeholder="Select sale date"
                                                className="pl-9"
                                            />
                                        </div>
                                        <FieldError>
                                            {createForm.errors.sale_date}
                                        </FieldError>
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field
                                        data-invalid={
                                            !!createForm.errors.quantity_kg
                                        }
                                    >
                                        <FieldLabel htmlFor="quantity_kg">
                                            Quantity (kg) *
                                        </FieldLabel>
                                        <div className="relative">
                                            <Package className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="quantity_kg"
                                                type="number"
                                                step="0.01"
                                                value={
                                                    createForm.data.quantity_kg
                                                }
                                                onChange={(e) =>
                                                    createForm.setData(
                                                        'quantity_kg',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9"
                                                placeholder="0.00"
                                                autoFocus
                                            />
                                        </div>
                                        <FieldError>
                                            {createForm.errors.quantity_kg}
                                        </FieldError>
                                    </Field>
                                    <Field
                                        data-invalid={
                                            !!createForm.errors.price_per_kg
                                        }
                                    >
                                        <FieldLabel htmlFor="price_per_kg">
                                            Price per kg (SBD) *
                                        </FieldLabel>
                                        <div className="relative">
                                            <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="price_per_kg"
                                                type="number"
                                                step="0.01"
                                                value={
                                                    createForm.data.price_per_kg
                                                }
                                                onChange={(e) =>
                                                    createForm.setData(
                                                        'price_per_kg',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <FieldError>
                                            {createForm.errors.price_per_kg}
                                        </FieldError>
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor="discount_percentage">
                                            Discount (%)
                                        </FieldLabel>
                                        <div className="relative">
                                            <Percent className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="discount_percentage"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={
                                                    createForm.data
                                                        .discount_percentage
                                                }
                                                onChange={(e) =>
                                                    createForm.setData(
                                                        'discount_percentage',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="delivery_fee">
                                            Delivery Fee (SBD)
                                        </FieldLabel>
                                        <div className="relative">
                                            <Truck className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="delivery_fee"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={
                                                    createForm.data.delivery_fee
                                                }
                                                onChange={(e) =>
                                                    createForm.setData(
                                                        'delivery_fee',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </Field>
                                </div>
                                <Field>
                                    <FieldLabel>
                                        Payment & Delivery Options
                                    </FieldLabel>
                                    <div className="space-y-3 rounded-md border p-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="is_credit"
                                                checked={
                                                    createForm.data.is_credit
                                                }
                                                onCheckedChange={(checked) =>
                                                    createForm.setData(
                                                        'is_credit',
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="is_credit"
                                                className="flex cursor-pointer items-center gap-2"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                Credit Sale
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="is_delivery"
                                                checked={
                                                    createForm.data.is_delivery
                                                }
                                                onCheckedChange={(checked) =>
                                                    createForm.setData(
                                                        'is_delivery',
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="is_delivery"
                                                className="flex cursor-pointer items-center gap-2"
                                            >
                                                <Truck className="h-4 w-4" />
                                                Requires Delivery
                                            </Label>
                                        </div>
                                    </div>
                                </Field>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">
                                            Order Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>
                                                    SBD{' '}
                                                    {calculateSubtotal(
                                                        createForm.data
                                                            .quantity_kg,
                                                        createForm.data
                                                            .price_per_kg,
                                                        createForm.data
                                                            .discount_percentage,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                            {parseFloat(
                                                createForm.data.delivery_fee,
                                            ) > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Delivery Fee:</span>
                                                    <span>
                                                        SBD{' '}
                                                        {parseFloat(
                                                            createForm.data
                                                                .delivery_fee,
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t pt-2 font-bold">
                                                <span>Total:</span>
                                                <span>
                                                    SBD{' '}
                                                    {calculateTotal(
                                                        createForm.data
                                                            .quantity_kg,
                                                        createForm.data
                                                            .price_per_kg,
                                                        createForm.data
                                                            .discount_percentage,
                                                        createForm.data
                                                            .delivery_fee,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Field>
                                    <FieldLabel htmlFor="notes">
                                        Notes
                                    </FieldLabel>
                                    <div className="relative">
                                        <FileText className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <textarea
                                            id="notes"
                                            value={createForm.data.notes}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'notes',
                                                    e.target.value,
                                                )
                                            }
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm"
                                            placeholder="Additional notes about this sale..."
                                        />
                                    </div>
                                    <FieldDescription>
                                        Optional notes for internal reference.
                                    </FieldDescription>
                                </Field>
                            </FieldGroup>
                        </div>
                        <DialogFooter className="flex-shrink-0 border-t pt-4">
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
                                {createForm.processing ? (
                                    <>
                                        <PlusIcon className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        Create Sale
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal - Similar structure but with editForm */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 sm:max-w-2xl">
                        <DialogHeader className="flex-shrink-0 pb-4">
                            <DialogTitle>Edit Sale</DialogTitle>
                            <DialogDescription>
                                Update sale information. All fields marked with
                                * are required.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-1 pb-4">
                            <FieldGroup className="gap-6">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field
                                        data-invalid={
                                            !!editForm.errors.customer_id
                                        }
                                    >
                                        <FieldLabel htmlFor="edit-customer_id">
                                            Customer *
                                        </FieldLabel>
                                        <div className="relative">
                                            <User className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Select
                                                value={
                                                    editForm.data.customer_id
                                                }
                                                onValueChange={(value) =>
                                                    editForm.setData(
                                                        'customer_id',
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    id="edit-customer_id"
                                                    className="pl-9"
                                                >
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customers.map(
                                                        (customer) => (
                                                            <SelectItem
                                                                key={
                                                                    customer.id
                                                                }
                                                                value={customer.id.toString()}
                                                            >
                                                                {customer.name}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <FieldError>
                                            {editForm.errors.customer_id}
                                        </FieldError>
                                    </Field>
                                    <Field
                                        data-invalid={
                                            !!editForm.errors.sale_date
                                        }
                                    >
                                        <FieldLabel htmlFor="edit-sale_date">
                                            Sale Date *
                                        </FieldLabel>
                                        <div className="relative">
                                            <Calendar className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <DatePicker
                                                id="edit-sale_date"
                                                value={editForm.data.sale_date}
                                                onChange={(value) =>
                                                    editForm.setData(
                                                        'sale_date',
                                                        value,
                                                    )
                                                }
                                                placeholder="Select sale date"
                                                className="pl-9"
                                            />
                                        </div>
                                        <FieldError>
                                            {editForm.errors.sale_date}
                                        </FieldError>
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field
                                        data-invalid={
                                            !!editForm.errors.quantity_kg
                                        }
                                    >
                                        <FieldLabel htmlFor="edit-quantity_kg">
                                            Quantity (kg) *
                                        </FieldLabel>
                                        <div className="relative">
                                            <Package className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="edit-quantity_kg"
                                                type="number"
                                                step="0.01"
                                                value={
                                                    editForm.data.quantity_kg
                                                }
                                                onChange={(e) =>
                                                    editForm.setData(
                                                        'quantity_kg',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <FieldError>
                                            {editForm.errors.quantity_kg}
                                        </FieldError>
                                    </Field>
                                    <Field
                                        data-invalid={
                                            !!editForm.errors.price_per_kg
                                        }
                                    >
                                        <FieldLabel htmlFor="edit-price_per_kg">
                                            Price per kg (SBD) *
                                        </FieldLabel>
                                        <div className="relative">
                                            <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="edit-price_per_kg"
                                                type="number"
                                                step="0.01"
                                                value={
                                                    editForm.data.price_per_kg
                                                }
                                                onChange={(e) =>
                                                    editForm.setData(
                                                        'price_per_kg',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <FieldError>
                                            {editForm.errors.price_per_kg}
                                        </FieldError>
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor="edit-discount_percentage">
                                            Discount (%)
                                        </FieldLabel>
                                        <div className="relative">
                                            <Percent className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="edit-discount_percentage"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={
                                                    editForm.data
                                                        .discount_percentage
                                                }
                                                onChange={(e) =>
                                                    editForm.setData(
                                                        'discount_percentage',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="edit-delivery_fee">
                                            Delivery Fee (SBD)
                                        </FieldLabel>
                                        <div className="relative">
                                            <Truck className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="edit-delivery_fee"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={
                                                    editForm.data.delivery_fee
                                                }
                                                onChange={(e) =>
                                                    editForm.setData(
                                                        'delivery_fee',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </Field>
                                </div>
                                <Field>
                                    <FieldLabel>
                                        Payment & Delivery Options
                                    </FieldLabel>
                                    <div className="space-y-3 rounded-md border p-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="edit-is_credit"
                                                checked={
                                                    editForm.data.is_credit
                                                }
                                                onCheckedChange={(checked) =>
                                                    editForm.setData(
                                                        'is_credit',
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="edit-is_credit"
                                                className="flex cursor-pointer items-center gap-2"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                Credit Sale
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="edit-is_delivery"
                                                checked={
                                                    editForm.data.is_delivery
                                                }
                                                onCheckedChange={(checked) =>
                                                    editForm.setData(
                                                        'is_delivery',
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="edit-is_delivery"
                                                className="flex cursor-pointer items-center gap-2"
                                            >
                                                <Truck className="h-4 w-4" />
                                                Requires Delivery
                                            </Label>
                                        </div>
                                    </div>
                                </Field>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">
                                            Order Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>
                                                    SBD{' '}
                                                    {calculateSubtotal(
                                                        editForm.data
                                                            .quantity_kg,
                                                        editForm.data
                                                            .price_per_kg,
                                                        editForm.data
                                                            .discount_percentage,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                            {parseFloat(
                                                editForm.data.delivery_fee,
                                            ) > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Delivery Fee:</span>
                                                    <span>
                                                        SBD{' '}
                                                        {parseFloat(
                                                            editForm.data
                                                                .delivery_fee,
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t pt-2 font-bold">
                                                <span>Total:</span>
                                                <span>
                                                    SBD{' '}
                                                    {calculateTotal(
                                                        editForm.data
                                                            .quantity_kg,
                                                        editForm.data
                                                            .price_per_kg,
                                                        editForm.data
                                                            .discount_percentage,
                                                        editForm.data
                                                            .delivery_fee,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Field>
                                    <FieldLabel htmlFor="edit-notes">
                                        Notes
                                    </FieldLabel>
                                    <div className="relative">
                                        <FileText className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <textarea
                                            id="edit-notes"
                                            value={editForm.data.notes}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'notes',
                                                    e.target.value,
                                                )
                                            }
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm"
                                            placeholder="Additional notes about this sale..."
                                        />
                                    </div>
                                    <FieldDescription>
                                        Optional notes for internal reference.
                                    </FieldDescription>
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
                                        Update Sale
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Show Modal */}
                <Dialog open={showOpen} onOpenChange={setShowOpen}>
                    <DialogContent className="w-full sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Sale Details</DialogTitle>
                            <DialogDescription>
                                View complete sale information, payment status,
                                and transaction history.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedSale && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Item
                                    size="sm"
                                    className="col-span-1 rounded-lg bg-muted/40"
                                >
                                    <ItemMedia
                                        variant="icon"
                                        className="bg-background text-muted-foreground"
                                    >
                                        <Calendar className="h-4 w-4" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="text-xs text-muted-foreground">
                                            Sale Date
                                        </ItemTitle>
                                        <ItemDescription className="text-base font-semibold text-foreground">
                                            {new Date(
                                                selectedSale.sale_date,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                <Item
                                    size="sm"
                                    className="col-span-1 rounded-lg bg-muted/40"
                                >
                                    <ItemMedia
                                        variant="icon"
                                        className="bg-background text-muted-foreground"
                                    >
                                        <User className="h-4 w-4" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="text-xs text-muted-foreground">
                                            Customer
                                        </ItemTitle>
                                        <ItemDescription className="text-base font-semibold text-foreground">
                                            {selectedSale.customer.name}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                <Item
                                    size="sm"
                                    className="col-span-1 rounded-lg bg-muted/40"
                                >
                                    <ItemMedia
                                        variant="icon"
                                        className="bg-background text-muted-foreground"
                                    >
                                        <Package className="h-4 w-4" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="text-xs text-muted-foreground">
                                            Quantity
                                        </ItemTitle>
                                        <ItemDescription className="text-base font-semibold text-foreground">
                                            {Number(
                                                selectedSale.quantity_kg,
                                            ).toFixed(2)}{' '}
                                            kg
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                <Item
                                    size="sm"
                                    className="col-span-1 rounded-lg bg-muted/40"
                                >
                                    <ItemMedia
                                        variant="icon"
                                        className="bg-background text-muted-foreground"
                                    >
                                        <DollarSign className="h-4 w-4" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="text-xs text-muted-foreground">
                                            Price per kg
                                        </ItemTitle>
                                        <ItemDescription className="text-base font-semibold text-foreground">
                                            SBD{' '}
                                            {Number(
                                                selectedSale.price_per_kg,
                                            ).toFixed(2)}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                {Number(selectedSale.discount_percentage) >
                                    0 && (
                                    <Item
                                        size="sm"
                                        className="col-span-1 rounded-lg bg-muted/40"
                                    >
                                        <ItemMedia
                                            variant="icon"
                                            className="bg-background text-muted-foreground"
                                        >
                                            <Percent className="h-4 w-4" />
                                        </ItemMedia>
                                        <ItemContent>
                                            <ItemTitle className="text-xs text-muted-foreground">
                                                Discount
                                            </ItemTitle>
                                            <ItemDescription className="text-base font-semibold text-foreground">
                                                {Number(
                                                    selectedSale.discount_percentage,
                                                ).toFixed(2)}
                                                %
                                            </ItemDescription>
                                        </ItemContent>
                                    </Item>
                                )}
                                {Number(selectedSale.delivery_fee) > 0 && (
                                    <Item
                                        size="sm"
                                        className="col-span-1 rounded-lg bg-muted/40"
                                    >
                                        <ItemMedia
                                            variant="icon"
                                            className="bg-background text-muted-foreground"
                                        >
                                            <Truck className="h-4 w-4" />
                                        </ItemMedia>
                                        <ItemContent>
                                            <ItemTitle className="text-xs text-muted-foreground">
                                                Delivery Fee
                                            </ItemTitle>
                                            <ItemDescription className="text-base font-semibold text-foreground">
                                                SBD{' '}
                                                {Number(
                                                    selectedSale.delivery_fee,
                                                ).toFixed(2)}
                                            </ItemDescription>
                                        </ItemContent>
                                    </Item>
                                )}
                                <Item
                                    size="sm"
                                    className="col-span-1 rounded-lg bg-muted/40"
                                >
                                    <ItemMedia
                                        variant="icon"
                                        className="bg-background text-muted-foreground"
                                    >
                                        <DollarSign className="h-4 w-4" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="text-xs text-muted-foreground">
                                            Total Amount
                                        </ItemTitle>
                                        <ItemDescription className="text-base font-semibold text-foreground">
                                            SBD{' '}
                                            {Number(
                                                selectedSale.total_amount,
                                            ).toFixed(2)}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                <Item
                                    size="sm"
                                    className="col-span-1 rounded-lg bg-muted/40"
                                >
                                    <ItemMedia
                                        variant="icon"
                                        className="bg-background text-muted-foreground"
                                    >
                                        {selectedSale.is_credit ? (
                                            outstandingBalance(selectedSale) >
                                            0 ? (
                                                <AlertCircle className="h-4 w-4 text-destructive" />
                                            ) : (
                                                <CircleCheck className="h-4 w-4 text-green-600" />
                                            )
                                        ) : (
                                            <CircleCheck className="h-4 w-4 text-green-600" />
                                        )}
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="text-xs text-muted-foreground">
                                            Payment Status
                                        </ItemTitle>
                                        <ItemDescription className="text-base font-semibold text-foreground">
                                            {selectedSale.is_credit ? (
                                                outstandingBalance(
                                                    selectedSale,
                                                ) > 0 ? (
                                                    <span className="text-destructive">
                                                        Credit Sale -
                                                        Outstanding: SBD{' '}
                                                        {outstandingBalance(
                                                            selectedSale,
                                                        ).toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600">
                                                        Paid (Credit Sale)
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-green-600">
                                                    Paid
                                                </span>
                                            )}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                {selectedSale.payments &&
                                    selectedSale.payments.length > 0 && (
                                        <Item
                                            size="sm"
                                            className="col-span-2 rounded-lg bg-muted/40"
                                        >
                                            <ItemMedia
                                                variant="icon"
                                                className="bg-background text-muted-foreground"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                            </ItemMedia>
                                            <ItemContent>
                                                <ItemTitle className="text-xs text-muted-foreground">
                                                    Payments
                                                </ItemTitle>
                                                <ItemDescription>
                                                    <div className="mt-2 space-y-2">
                                                        {selectedSale.payments.map(
                                                            (payment) => (
                                                                <div
                                                                    key={
                                                                        payment.id
                                                                    }
                                                                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                                                                >
                                                                    <span className="flex items-center gap-2">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {new Date(
                                                                            payment.payment_date,
                                                                        ).toLocaleDateString()}
                                                                    </span>
                                                                    <span className="font-medium">
                                                                        SBD{' '}
                                                                        {Number(
                                                                            payment.amount,
                                                                        ).toFixed(
                                                                            2,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </ItemDescription>
                                            </ItemContent>
                                        </Item>
                                    )}
                                {selectedSale.notes && (
                                    <Item
                                        size="sm"
                                        className="col-span-2 rounded-lg bg-muted/40"
                                    >
                                        <ItemMedia
                                            variant="icon"
                                            className="bg-background text-muted-foreground"
                                        >
                                            <FileText className="h-4 w-4" />
                                        </ItemMedia>
                                        <ItemContent>
                                            <ItemTitle className="text-xs text-muted-foreground">
                                                Notes
                                            </ItemTitle>
                                            <ItemDescription className="text-base font-semibold text-foreground">
                                                {selectedSale.notes}
                                            </ItemDescription>
                                        </ItemContent>
                                    </Item>
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
                            <DialogTitle>Delete Sale</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this sale? This
                                action cannot be undone.
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
