import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/date-picker';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { 
    PencilIcon, 
    PlusIcon, 
    TrashIcon, 
    EyeIcon, 
    InfoIcon, 
    ShoppingCart, 
    ArrowUpDown,
    ChevronDown,
    Columns,
    ChevronsLeft,
    ChevronsRight,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Search,
} from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    RowSelectionState,
    VisibilityState,
    useReactTable,
} from '@tanstack/react-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Purchases',
        href: '/purchases',
    },
];

interface Supplier {
    id: number;
    name: string;
}

interface Purchase {
    id: number;
    purchase_date: string;
    quantity_kg: number | string;
    price_per_kg: number | string;
    total_cost: number | string;
    notes: string | null;
    supplier: Supplier;
    profit?: number | string;
    total_revenue?: number | string;
    remaining_quantity?: number | string;
    sold_quantity?: number | string;
    total_expenses?: number | string;
}

interface PurchasesProps {
    purchases: {
        data: Purchase[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    suppliers: Supplier[];
    filters: {
        supplier_id?: string;
        search?: string;
    };
}

export default function PurchasesIndex({
    purchases,
    suppliers,
    filters,
}: PurchasesProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [showOpen, setShowOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [supplierFilter, setSupplierFilter] = useState(filters.supplier_id || 'all');
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const isInitialMount = useRef(true);

    // Debounced search function
    const performSearch = useCallback(
        (search: string, supplierId: string) => {
            router.get(
                '/purchases',
                {
                    search: search || undefined,
                    supplier_id: supplierId === 'all' ? undefined : supplierId,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['purchases', 'filters'],
                }
            );
        },
        []
    );

    // Debounce search input
    useEffect(() => {
        // Skip the initial mount to avoid unnecessary request
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            performSearch(searchValue, supplierFilter);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchValue, supplierFilter, performSearch]);

    // Handle sorting changes
    useEffect(() => {
        if (isInitialMount.current) {
            return;
        }

        const sortParam = sorting.length > 0 ? {
            sort_by: sorting[0].id,
            sort_dir: sorting[0].desc ? 'desc' : 'asc',
        } : {};

        router.get(
            '/purchases',
            {
                search: searchValue || undefined,
                supplier_id: supplierFilter === 'all' ? undefined : supplierFilter,
                ...sortParam,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['purchases', 'filters'],
            }
        );
    }, [sorting, searchValue, supplierFilter]);

    const createForm = useForm({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        quantity_kg: '',
        price_per_kg: '',
        notes: '',
    });

    const supplierForm = useForm({
        name: '',
        phone: '',
        address: '',
        notes: '',
    });

    const editForm = useForm({
        supplier_id: '',
        purchase_date: '',
        quantity_kg: '',
        price_per_kg: '',
        notes: '',
    });

    const handleCreate = () => {
        createForm.post('/purchases', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
                createForm.setData('purchase_date', new Date().toISOString().split('T')[0]);
            },
        });
    };

    const handleCreateSupplier = () => {
        supplierForm.post('/suppliers', {
            preserveScroll: true,
            onSuccess: () => {
                setShowAddSupplier(false);
                supplierForm.reset();
                // Refresh the page to get updated suppliers list
                router.reload({ only: ['suppliers'] });
            },
        });
    };

    const handleEdit = (purchase: Purchase) => {
        setSelectedPurchase(purchase);
        editForm.setData({
            supplier_id: purchase.supplier.id.toString(),
            purchase_date: purchase.purchase_date,
            quantity_kg: purchase.quantity_kg.toString(),
            price_per_kg: purchase.price_per_kg.toString(),
            notes: purchase.notes || '',
        });
        setEditOpen(true);
    };

    const handleUpdate = () => {
        if (!selectedPurchase) return;
        editForm.put(`/purchases/${selectedPurchase.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditOpen(false);
                setSelectedPurchase(null);
            },
        });
    };

    const handleDelete = () => {
        if (!selectedPurchase) return;
        router.delete(`/purchases/${selectedPurchase.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setSelectedPurchase(null);
            },
        });
    };

    const handleSupplierFilter = (value: string) => {
        setSupplierFilter(value);
        router.get(
            '/purchases',
            {
                search: searchValue || undefined,
                supplier_id: value === 'all' ? undefined : value,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['purchases', 'filters'],
            }
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

    const columns = useMemo<ColumnDef<Purchase>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={
                                table.getIsAllPageRowsSelected() ||
                                (table.getIsSomePageRowsSelected() && 'indeterminate')
                            }
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all"
                        />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'purchase_date',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                            className="h-8 px-2 lg:px-3"
                        >
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div>
                        {new Date(row.getValue('purchase_date')).toLocaleDateString()}
                    </div>
                ),
            },
            {
                accessorKey: 'supplier.name',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                            className="h-8 px-2 lg:px-3"
                        >
                            Supplier
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div className="font-medium">{row.original.supplier.name}</div>
                ),
            },
            {
                accessorKey: 'quantity_kg',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
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
                accessorKey: 'price_per_kg',
                header: 'Price/kg',
                cell: ({ row }) => (
                    <div>SBD {Number(row.getValue('price_per_kg')).toFixed(2)}</div>
                ),
            },
            {
                accessorKey: 'total_cost',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                            className="h-8 px-2 lg:px-3"
                        >
                            Total Cost
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div>SBD {Number(row.getValue('total_cost')).toFixed(2)}</div>
                ),
            },
            {
                id: 'sold',
                header: 'Sold',
                cell: ({ row }) => {
                    const purchase = row.original;
                    return (
                        <div>
                            {purchase.sold_quantity ? Number(purchase.sold_quantity).toFixed(2) : '0.00'} / {Number(purchase.quantity_kg).toFixed(2)} kg
                        </div>
                    );
                },
            },
            {
                accessorKey: 'total_revenue',
                header: 'Revenue',
                cell: ({ row }) => {
                    const revenue = row.getValue('total_revenue') as number | string | undefined;
                    return (
                        <div>
                            {revenue !== undefined ? `SBD ${Number(revenue).toFixed(2)}` : '-'}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'profit',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                            className="h-8 px-2 lg:px-3"
                        >
                            Profit/Loss
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => {
                    const profit = row.getValue('profit') as number | string | undefined;
                    if (profit === undefined) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    const profitValue = Number(profit);
                    return (
                        <span className={profitValue >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {profitValue >= 0 ? '+' : ''}SBD {profitValue.toFixed(2)}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }) => {
                    const purchase = row.original;
                    return (
                        <div className="flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                        size="icon"
                                    >
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setSelectedPurchase(purchase);
                                            setShowOpen(true);
                                        }}
                                    >
                                        <EyeIcon className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleEdit(purchase)}
                                    >
                                        <PencilIcon className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setSelectedPurchase(purchase);
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
        []
    );

    const table = useReactTable({
        data: purchases.data,
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
            <Head title="Purchases" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Purchases</h1>
                    <Button onClick={() => setCreateOpen(true)}>
                        <PlusIcon />
                        Add Purchase
                    </Button>
                </div>

                <Alert>
                    <InfoIcon />
                    <AlertTitle>About Purchases</AlertTitle>
                    <AlertDescription>
                        Record all fish purchases from suppliers here. Select an existing supplier from the dropdown, or click "Add New Supplier" to create one on the spot.
                        Each purchase tracks quantity, price per kg, and total cost. Link expenses (freight, ice, fuel) to purchases to accurately calculate profit/loss.
                        The system automatically calculates profit/loss by comparing purchase prices with sale prices, minus any expenses tied to the purchase.
                        Stock increases automatically when you record a purchase.
                    </AlertDescription>
                </Alert>

                {/* Filters and Table Controls */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by supplier name..."
                                value={searchValue}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={supplierFilter} onValueChange={handleSupplierFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Suppliers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Suppliers</SelectItem>
                                {suppliers && suppliers.length > 0 ? (
                                    suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))
                                ) : null}
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
                                            typeof column.accessorFn !== 'undefined' &&
                                            column.getCanHide()
                                    )
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.id === 'purchase_date' && 'Date'}
                                                {column.id === 'supplier.name' && 'Supplier'}
                                                {column.id === 'quantity_kg' && 'Quantity'}
                                                {column.id === 'price_per_kg' && 'Price/kg'}
                                                {column.id === 'total_cost' && 'Total Cost'}
                                                {column.id === 'sold' && 'Sold'}
                                                {column.id === 'total_revenue' && 'Revenue'}
                                                {column.id === 'profit' && 'Profit/Loss'}
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
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id} className="px-4 py-3">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext()
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
                                        data-state={row.getIsSelected() && 'selected'}
                                        className={row.getIsSelected() ? 'bg-muted/50' : ''}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="px-4 py-3">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
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
                                                <ShoppingCart className="size-8" />
                                            </EmptyMedia>
                                            <EmptyHeader>
                                                <EmptyTitle>No purchases found</EmptyTitle>
                                                <EmptyDescription>
                                                    Get started by recording your first purchase from a supplier. Purchases increase your stock and help track costs.
                                                </EmptyDescription>
                                            </EmptyHeader>
                                            <EmptyContent>
                                                <Button onClick={() => setCreateOpen(true)}>
                                                    <PlusIcon className="mr-2 h-4 w-4" />
                                                    Add Purchase
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
                                {Object.keys(rowSelection).length} of {purchases.data.length} row(s) selected
                            </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                            Showing {purchases.from} to {purchases.to} of {purchases.total} purchases
                        </div>
                    </div>
                    {purchases.last_page > 1 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                    Rows per page
                                </Label>
                                <Select
                                    value={purchases.per_page.toString()}
                                    onValueChange={(value) => {
                                        router.get(
                                            '/purchases',
                                            {
                                                supplier_id: filters.supplier_id,
                                                search: searchValue || undefined,
                                                per_page: value,
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                                only: ['purchases', 'filters'],
                                            }
                                        );
                                    }}
                                >
                                    <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                        <SelectValue placeholder={purchases.per_page.toString()} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 15, 20, 25, 50].map((pageSize) => (
                                            <SelectItem key={pageSize} value={pageSize.toString()}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-center text-sm font-medium">
                                Page {purchases.current_page} of {purchases.last_page}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const firstPageUrl = purchases.links.find((link) => link.label.includes('Previous'))?.url || purchases.links[0]?.url;
                                        if (firstPageUrl && purchases.current_page > 1) {
                                            handlePageChange(firstPageUrl);
                                        }
                                    }}
                                    disabled={purchases.current_page === 1}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                    <span className="sr-only">Go to first page</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const prevPageUrl = purchases.links.find((link) => link.label.includes('Previous'))?.url || purchases.links[0]?.url;
                                        if (prevPageUrl && purchases.current_page > 1) {
                                            handlePageChange(prevPageUrl);
                                        }
                                    }}
                                    disabled={purchases.current_page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="sr-only">Go to previous page</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const nextPageUrl = purchases.links.find((link) => link.label.includes('Next'))?.url || purchases.links[purchases.links.length - 1]?.url;
                                        if (nextPageUrl && purchases.current_page < purchases.last_page) {
                                            handlePageChange(nextPageUrl);
                                        }
                                    }}
                                    disabled={purchases.current_page === purchases.last_page}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                    <span className="sr-only">Go to next page</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const lastPageUrl = purchases.links.find((link) => link.label.includes('Next'))?.url || purchases.links[purchases.links.length - 1]?.url;
                                        if (lastPageUrl && purchases.current_page < purchases.last_page) {
                                            handlePageChange(lastPageUrl);
                                        }
                                    }}
                                    disabled={purchases.current_page === purchases.last_page}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                    <span className="sr-only">Go to last page</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create Purchase</DialogTitle>
                            <DialogDescription>
                                Record a new purchase from a supplier.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <Label htmlFor="supplier_id">Supplier *</Label>
                                    <Button
                                        type="button"
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-xs"
                                        onClick={() => setShowAddSupplier(true)}
                                    >
                                        <PlusIcon className="size-3 mr-1" />
                                        Add New Supplier
                                    </Button>
                                </div>
                                <Select
                                    value={createForm.data.supplier_id}
                                    onValueChange={(value) =>
                                        createForm.setData('supplier_id', value)
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers && suppliers.length > 0 ? (
                                            suppliers.map((supplier) => (
                                                <SelectItem
                                                    key={supplier.id}
                                                    value={supplier.id.toString()}
                                                >
                                                    {supplier.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                No suppliers found. Click "Add New Supplier" to create one.
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {createForm.errors.supplier_id && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {createForm.errors.supplier_id}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="purchase_date">Purchase Date *</Label>
                                <DatePicker
                                    id="purchase_date"
                                    value={createForm.data.purchase_date}
                                    onChange={(value) =>
                                        createForm.setData('purchase_date', value)
                                    }
                                    placeholder="Select purchase date"
                                    className="mt-1"
                                />
                                {createForm.errors.purchase_date && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {createForm.errors.purchase_date}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="quantity_kg">Quantity (kg) *</Label>
                                    <Input
                                        id="quantity_kg"
                                        type="number"
                                        step="0.01"
                                        value={createForm.data.quantity_kg}
                                        onChange={(e) =>
                                            createForm.setData('quantity_kg', e.target.value)
                                        }
                                        className="mt-1"
                                    />
                                    {createForm.errors.quantity_kg && (
                                        <p className="mt-1 text-sm text-destructive">
                                            {createForm.errors.quantity_kg}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="price_per_kg">Price per kg (SBD) *</Label>
                                    <Input
                                        id="price_per_kg"
                                        type="number"
                                        step="0.01"
                                        value={createForm.data.price_per_kg}
                                        onChange={(e) =>
                                            createForm.setData('price_per_kg', e.target.value)
                                        }
                                        className="mt-1"
                                    />
                                    {createForm.errors.price_per_kg && (
                                        <p className="mt-1 text-sm text-destructive">
                                            {createForm.errors.price_per_kg}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="notes">Notes</Label>
                                <textarea
                                    id="notes"
                                    value={createForm.data.notes}
                                    onChange={(e) =>
                                        createForm.setData('notes', e.target.value)
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
                            <Button onClick={handleCreate} disabled={createForm.processing}>
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit Purchase</DialogTitle>
                            <DialogDescription>
                                Update purchase information.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-supplier_id">Supplier *</Label>
                                <Select
                                    value={editForm.data.supplier_id}
                                    onValueChange={(value) =>
                                        editForm.setData('supplier_id', value)
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers && suppliers.length > 0 ? (
                                            suppliers.map((supplier) => (
                                                <SelectItem
                                                    key={supplier.id}
                                                    value={supplier.id.toString()}
                                                >
                                                    {supplier.name}
                                                </SelectItem>
                                            ))
                                        ) : null}
                                    </SelectContent>
                                </Select>
                                {editForm.errors.supplier_id && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {editForm.errors.supplier_id}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="edit-purchase_date">Purchase Date *</Label>
                                <DatePicker
                                    id="edit-purchase_date"
                                    value={editForm.data.purchase_date}
                                    onChange={(value) =>
                                        editForm.setData('purchase_date', value)
                                    }
                                    placeholder="Select purchase date"
                                    className="mt-1"
                                />
                                {editForm.errors.purchase_date && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {editForm.errors.purchase_date}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="edit-quantity_kg">Quantity (kg) *</Label>
                                    <Input
                                        id="edit-quantity_kg"
                                        type="number"
                                        step="0.01"
                                        value={editForm.data.quantity_kg}
                                        onChange={(e) =>
                                            editForm.setData('quantity_kg', e.target.value)
                                        }
                                        className="mt-1"
                                    />
                                    {editForm.errors.quantity_kg && (
                                        <p className="mt-1 text-sm text-destructive">
                                            {editForm.errors.quantity_kg}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="edit-price_per_kg">Price per kg (SBD) *</Label>
                                    <Input
                                        id="edit-price_per_kg"
                                        type="number"
                                        step="0.01"
                                        value={editForm.data.price_per_kg}
                                        onChange={(e) =>
                                            editForm.setData('price_per_kg', e.target.value)
                                        }
                                        className="mt-1"
                                    />
                                    {editForm.errors.price_per_kg && (
                                        <p className="mt-1 text-sm text-destructive">
                                            {editForm.errors.price_per_kg}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="edit-notes">Notes</Label>
                                <textarea
                                    id="edit-notes"
                                    value={editForm.data.notes}
                                    onChange={(e) =>
                                        editForm.setData('notes', e.target.value)
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
                            <Button onClick={handleUpdate} disabled={editForm.processing}>
                                Update
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Show Modal */}
                <Dialog open={showOpen} onOpenChange={setShowOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Purchase Details</DialogTitle>
                        </DialogHeader>
                        {selectedPurchase && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Date</Label>
                                    <p className="mt-1">
                                        {new Date(selectedPurchase.purchase_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <Label>Supplier</Label>
                                    <p className="mt-1">{selectedPurchase.supplier.name}</p>
                                </div>
                                <div>
                                    <Label>Quantity</Label>
                                    <p className="mt-1">
                                        {Number(selectedPurchase.quantity_kg).toFixed(2)} kg
                                    </p>
                                </div>
                                <div>
                                    <Label>Price per kg</Label>
                                    <p className="mt-1">
                                        SBD {Number(selectedPurchase.price_per_kg).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <Label>Total Cost</Label>
                                    <p className="mt-1 font-semibold">
                                        SBD {Number(selectedPurchase.total_cost).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <Label>Sold Quantity</Label>
                                    <p className="mt-1">
                                        {selectedPurchase.sold_quantity ? Number(selectedPurchase.sold_quantity).toFixed(2) : '0.00'} / {Number(selectedPurchase.quantity_kg).toFixed(2)} kg
                                    </p>
                                </div>
                                {selectedPurchase.total_revenue !== undefined && (
                                    <div>
                                        <Label>Total Revenue</Label>
                                        <p className="mt-1 font-semibold">
                                            SBD {Number(selectedPurchase.total_revenue).toFixed(2)}
                                        </p>
                                    </div>
                                )}
                                {selectedPurchase.profit !== undefined && (
                                    <div>
                                        <Label>Profit/Loss</Label>
                                        <p className={`mt-1 font-semibold text-lg ${Number(selectedPurchase.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {Number(selectedPurchase.profit) >= 0 ? '+' : ''}SBD {Number(selectedPurchase.profit).toFixed(2)}
                                        </p>
                                        {selectedPurchase.total_expenses !== undefined && Number(selectedPurchase.total_expenses) > 0 && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                (Includes SBD {Number(selectedPurchase.total_expenses).toFixed(2)} in expenses)
                                            </p>
                                        )}
                                    </div>
                                )}
                                {selectedPurchase.total_expenses !== undefined && Number(selectedPurchase.total_expenses) > 0 && (
                                    <div>
                                        <Label>Total Expenses</Label>
                                        <p className="mt-1 font-semibold text-destructive">
                                            SBD {Number(selectedPurchase.total_expenses).toFixed(2)}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Expenses tied to this purchase (freight, ice, fuel, etc.)
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowOpen(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Modal */}
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Purchase</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this purchase? This action cannot
                                be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Supplier Modal */}
                <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Supplier</DialogTitle>
                            <DialogDescription>
                                Create a new supplier to use in purchases.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="supplier-name">Name *</Label>
                                <Input
                                    id="supplier-name"
                                    value={supplierForm.data.name}
                                    onChange={(e) =>
                                        supplierForm.setData('name', e.target.value)
                                    }
                                    className="mt-1"
                                />
                                {supplierForm.errors.name && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {supplierForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="supplier-phone">Phone</Label>
                                <Input
                                    id="supplier-phone"
                                    value={supplierForm.data.phone}
                                    onChange={(e) =>
                                        supplierForm.setData('phone', e.target.value)
                                    }
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="supplier-address">Address</Label>
                                <Input
                                    id="supplier-address"
                                    value={supplierForm.data.address}
                                    onChange={(e) =>
                                        supplierForm.setData('address', e.target.value)
                                    }
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="supplier-notes">Notes</Label>
                                <textarea
                                    id="supplier-notes"
                                    value={supplierForm.data.notes}
                                    onChange={(e) =>
                                        supplierForm.setData('notes', e.target.value)
                                    }
                                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddSupplier(false);
                                    supplierForm.reset();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleCreateSupplier} disabled={supplierForm.processing}>
                                Create Supplier
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

