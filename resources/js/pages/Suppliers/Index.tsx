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
    EyeIcon,
    FileText,
    InfoIcon,
    Mail,
    MapPin,
    MoreHorizontal,
    Package,
    PencilIcon,
    Phone,
    PlusIcon,
    Search,
    TrashIcon,
    UserCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Suppliers',
        href: '/suppliers',
    },
];

interface Supplier {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    purchases_sum_quantity_kg: number | string | null;
    remaining_stock?: number | string;
    created_at: string;
}

interface SuppliersProps {
    suppliers: {
        data: Supplier[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    filters?: {
        search?: string;
    };
}

export default function SuppliersIndex({
    suppliers,
    filters = {},
}: SuppliersProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [showOpen, setShowOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
        null,
    );
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {},
    );
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const isInitialMount = useRef(true);

    // Debounced search function
    const performSearch = useCallback((search: string) => {
        router.get(
            '/suppliers',
            {
                search: search || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['suppliers', 'filters'],
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
            performSearch(searchValue);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchValue, performSearch]);

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
            '/suppliers',
            {
                search: searchValue || undefined,
                ...sortParam,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['suppliers', 'filters'],
            },
        );
    }, [sorting, searchValue]);

    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });

    const editForm = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });

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

    const handleCreate = () => {
        createForm.post('/suppliers', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEdit = useCallback(
        (supplier: Supplier) => {
            setSelectedSupplier(supplier);
            editForm.setData({
                name: supplier.name,
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
                notes: supplier.notes || '',
            });
            setEditOpen(true);
        },
        [editForm],
    );

    const handleUpdate = () => {
        if (!selectedSupplier) return;
        editForm.put(`/suppliers/${selectedSupplier.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditOpen(false);
                setSelectedSupplier(null);
            },
        });
    };

    const handleDelete = () => {
        if (!selectedSupplier) return;
        router.delete(`/suppliers/${selectedSupplier.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setSelectedSupplier(null);
            },
        });
    };

    const columns = useMemo<ColumnDef<Supplier>[]>(
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
                accessorKey: 'name',
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
                            Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div className="font-medium">{row.getValue('name')}</div>
                ),
            },
            {
                accessorKey: 'email',
                header: 'Email',
                cell: ({ row }) => (
                    <div className="text-muted-foreground">
                        {row.getValue('email') || '-'}
                    </div>
                ),
            },
            {
                accessorKey: 'phone',
                header: 'Phone',
                cell: ({ row }) => (
                    <div className="text-muted-foreground">
                        {row.getValue('phone') || '-'}
                    </div>
                ),
            },
            {
                id: 'total_purchases',
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
                            Total Purchases (kg)
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                accessorFn: (row) => Number(row.purchases_sum_quantity_kg || 0),
                cell: ({ row }) => {
                    const supplier = row.original;
                    return (
                        <div>
                            {supplier.purchases_sum_quantity_kg
                                ? Number(
                                      supplier.purchases_sum_quantity_kg,
                                  ).toFixed(2)
                                : '0.00'}
                        </div>
                    );
                },
            },
            {
                id: 'remaining_stock',
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
                            Remaining Stock (kg)
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                accessorFn: (row) => Number(row.remaining_stock || 0),
                cell: ({ row }) => {
                    const supplier = row.original;
                    return (
                        <span className="font-medium">
                            {supplier.remaining_stock !== undefined
                                ? Number(supplier.remaining_stock).toFixed(2)
                                : '0.00'}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'created_at',
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
                            Created At
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div>
                        {new Date(
                            row.getValue('created_at'),
                        ).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })}
                    </div>
                ),
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }) => {
                    const supplier = row.original;
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
                                            setSelectedSupplier(supplier);
                                            setShowOpen(true);
                                        }}
                                    >
                                        <EyeIcon className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleEdit(supplier)}
                                    >
                                        <PencilIcon className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setSelectedSupplier(supplier);
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
        data: suppliers.data,
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
            <Head title="Suppliers" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Suppliers</h1>
                    <Button onClick={() => setCreateOpen(true)}>
                        <PlusIcon />
                        Add Supplier
                    </Button>
                </div>

                <Alert>
                    <InfoIcon />
                    <AlertTitle>About Suppliers</AlertTitle>
                    <AlertDescription>
                        Suppliers are the local fishermen you purchase fish
                        from. Create a supplier once, then select them when
                        recording purchases. You can track total purchases (in
                        kg) and remaining stock from each supplier. Remaining
                        stock shows how much fish from each supplier is still
                        available in your inventory. Use the "Add New Supplier"
                        button in the purchase form to quickly create suppliers
                        while recording purchases.
                    </AlertDescription>
                </Alert>

                {/* Filters and Table Controls */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by supplier name..."
                                value={searchValue}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
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
                                                {column.id === 'name' && 'Name'}
                                                {column.id === 'email' &&
                                                    'Email'}
                                                {column.id === 'phone' &&
                                                    'Phone'}
                                                {column.id ===
                                                    'total_purchases' &&
                                                    'Total Purchases'}
                                                {column.id ===
                                                    'remaining_stock' &&
                                                    'Remaining Stock'}
                                                {column.id === 'created_at' &&
                                                    'Created At'}
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
                                                <UserCircle className="size-8" />
                                            </EmptyMedia>
                                            <EmptyHeader>
                                                <EmptyTitle>
                                                    No suppliers found
                                                </EmptyTitle>
                                                <EmptyDescription>
                                                    Get started by adding your
                                                    first supplier. Suppliers
                                                    are the fishermen or
                                                    businesses you purchase fish
                                                    from.
                                                </EmptyDescription>
                                            </EmptyHeader>
                                            <EmptyContent>
                                                <Button
                                                    onClick={() =>
                                                        setCreateOpen(true)
                                                    }
                                                >
                                                    <PlusIcon className="mr-2 h-4 w-4" />
                                                    Add Supplier
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
                                {suppliers.data.length} row(s) selected
                            </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                            Showing {suppliers.from} to {suppliers.to} of{' '}
                            {suppliers.total} suppliers
                        </div>
                    </div>
                    {suppliers.last_page > 1 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Label
                                    htmlFor="rows-per-page"
                                    className="text-sm font-medium"
                                >
                                    Rows per page
                                </Label>
                                <Select
                                    value={suppliers.per_page.toString()}
                                    onValueChange={(value) => {
                                        router.get(
                                            '/suppliers',
                                            {
                                                search:
                                                    searchValue || undefined,
                                                per_page: value,
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                                only: ['suppliers', 'filters'],
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
                                            placeholder={suppliers.per_page.toString()}
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
                                Page {suppliers.current_page} of{' '}
                                {suppliers.last_page}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const firstPageUrl =
                                            suppliers.links.find((link) =>
                                                link.label.includes('Previous'),
                                            )?.url || suppliers.links[0]?.url;
                                        if (
                                            firstPageUrl &&
                                            suppliers.current_page > 1
                                        ) {
                                            handlePageChange(firstPageUrl);
                                        }
                                    }}
                                    disabled={suppliers.current_page === 1}
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
                                            suppliers.links.find((link) =>
                                                link.label.includes('Previous'),
                                            )?.url || suppliers.links[0]?.url;
                                        if (
                                            prevPageUrl &&
                                            suppliers.current_page > 1
                                        ) {
                                            handlePageChange(prevPageUrl);
                                        }
                                    }}
                                    disabled={suppliers.current_page === 1}
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
                                            suppliers.links.find((link) =>
                                                link.label.includes('Next'),
                                            )?.url ||
                                            suppliers.links[
                                                suppliers.links.length - 1
                                            ]?.url;
                                        if (
                                            nextPageUrl &&
                                            suppliers.current_page <
                                                suppliers.last_page
                                        ) {
                                            handlePageChange(nextPageUrl);
                                        }
                                    }}
                                    disabled={
                                        suppliers.current_page ===
                                        suppliers.last_page
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
                                            suppliers.links.find((link) =>
                                                link.label.includes('Next'),
                                            )?.url ||
                                            suppliers.links[
                                                suppliers.links.length - 1
                                            ]?.url;
                                        if (
                                            lastPageUrl &&
                                            suppliers.current_page <
                                                suppliers.last_page
                                        ) {
                                            handlePageChange(lastPageUrl);
                                        }
                                    }}
                                    disabled={
                                        suppliers.current_page ===
                                        suppliers.last_page
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
                    <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 sm:max-w-2xl">
                        <DialogHeader className="flex-shrink-0 pb-4">
                            <DialogTitle>Create Supplier</DialogTitle>
                            <DialogDescription>
                                Add a new supplier (fisherman) to the system.
                                All fields marked with * are required.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-1">
                            <FieldGroup className="gap-6">
                                <Field data-invalid={!!createForm.errors.name}>
                                    <FieldLabel htmlFor="name">
                                        Supplier Name *
                                    </FieldLabel>
                                    <div className="relative">
                                        <UserCircle className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            value={createForm.data.name}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                            placeholder="John Fisherman"
                                            autoFocus
                                        />
                                    </div>
                                    <FieldError>
                                        {createForm.errors.name}
                                    </FieldError>
                                </Field>
                                <Field data-invalid={!!createForm.errors.email}>
                                    <FieldLabel htmlFor="email">
                                        Email Address
                                    </FieldLabel>
                                    <div className="relative">
                                        <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={createForm.data.email}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <FieldError>
                                        {createForm.errors.email}
                                    </FieldError>
                                </Field>
                                <Field data-invalid={!!createForm.errors.phone}>
                                    <FieldLabel htmlFor="phone">
                                        Phone Number
                                    </FieldLabel>
                                    <div className="relative">
                                        <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            value={createForm.data.phone}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'phone',
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                    <FieldError>
                                        {createForm.errors.phone}
                                    </FieldError>
                                </Field>
                                <Field
                                    data-invalid={!!createForm.errors.address}
                                >
                                    <FieldLabel htmlFor="address">
                                        Address
                                    </FieldLabel>
                                    <div className="relative">
                                        <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="address"
                                            value={createForm.data.address}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'address',
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                            placeholder="123 Harbor St, City, State ZIP"
                                        />
                                    </div>
                                    <FieldError>
                                        {createForm.errors.address}
                                    </FieldError>
                                </Field>
                                <Field data-invalid={!!createForm.errors.notes}>
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
                                            placeholder="Additional notes about this supplier..."
                                        />
                                    </div>
                                    <FieldDescription>
                                        Optional notes for internal reference.
                                    </FieldDescription>
                                    <FieldError>
                                        {createForm.errors.notes}
                                    </FieldError>
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
                                        <PlusIcon className="mr-2 h-4 w-4" />
                                        Create Supplier
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 sm:max-w-2xl">
                        <DialogHeader className="flex-shrink-0 pb-4">
                            <DialogTitle>Edit Supplier</DialogTitle>
                            <DialogDescription>
                                Update supplier information. All fields marked
                                with * are required.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-1">
                            <FieldGroup className="gap-6">
                                <Field data-invalid={!!editForm.errors.name}>
                                    <FieldLabel htmlFor="edit-name">
                                        Supplier Name *
                                    </FieldLabel>
                                    <div className="relative">
                                        <UserCircle className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="edit-name"
                                            value={editForm.data.name}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                            placeholder="John Fisherman"
                                        />
                                    </div>
                                    <FieldError>
                                        {editForm.errors.name}
                                    </FieldError>
                                </Field>
                                <Field data-invalid={!!editForm.errors.email}>
                                    <FieldLabel htmlFor="edit-email">
                                        Email Address
                                    </FieldLabel>
                                    <div className="relative">
                                        <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="edit-email"
                                            type="email"
                                            value={editForm.data.email}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <FieldError>
                                        {editForm.errors.email}
                                    </FieldError>
                                </Field>
                                <Field data-invalid={!!editForm.errors.phone}>
                                    <FieldLabel htmlFor="edit-phone">
                                        Phone Number
                                    </FieldLabel>
                                    <div className="relative">
                                        <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="edit-phone"
                                            value={editForm.data.phone}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'phone',
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                    <FieldError>
                                        {editForm.errors.phone}
                                    </FieldError>
                                </Field>
                                <Field data-invalid={!!editForm.errors.address}>
                                    <FieldLabel htmlFor="edit-address">
                                        Address
                                    </FieldLabel>
                                    <div className="relative">
                                        <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="edit-address"
                                            value={editForm.data.address}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'address',
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                            placeholder="123 Harbor St, City, State ZIP"
                                        />
                                    </div>
                                    <FieldError>
                                        {editForm.errors.address}
                                    </FieldError>
                                </Field>
                                <Field data-invalid={!!editForm.errors.notes}>
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
                                            placeholder="Additional notes about this supplier..."
                                        />
                                    </div>
                                    <FieldDescription>
                                        Optional notes for internal reference.
                                    </FieldDescription>
                                    <FieldError>
                                        {editForm.errors.notes}
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
                                        Update Supplier
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
                            <DialogTitle>Supplier Details</DialogTitle>
                            <DialogDescription>
                                View complete supplier information and
                                statistics.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedSupplier && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Item
                                    size="sm"
                                    className="col-span-1 rounded-lg bg-muted/40"
                                >
                                    <ItemMedia
                                        variant="icon"
                                        className="bg-background text-muted-foreground"
                                    >
                                        <UserCircle className="h-4 w-4" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="text-xs text-muted-foreground">
                                            Supplier Name
                                        </ItemTitle>
                                        <ItemDescription className="text-base font-semibold text-foreground">
                                            {selectedSupplier.name}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                {selectedSupplier.email && (
                                    <Item
                                        size="sm"
                                        className="col-span-1 rounded-lg bg-muted/40"
                                    >
                                        <ItemMedia
                                            variant="icon"
                                            className="bg-background text-muted-foreground"
                                        >
                                            <Mail className="h-4 w-4" />
                                        </ItemMedia>
                                        <ItemContent>
                                            <ItemTitle className="text-xs text-muted-foreground">
                                                Email Address
                                            </ItemTitle>
                                            <ItemDescription className="text-base font-semibold text-foreground">
                                                {selectedSupplier.email}
                                            </ItemDescription>
                                        </ItemContent>
                                    </Item>
                                )}
                                {selectedSupplier.phone && (
                                    <Item
                                        size="sm"
                                        className="col-span-1 rounded-lg bg-muted/40"
                                    >
                                        <ItemMedia
                                            variant="icon"
                                            className="bg-background text-muted-foreground"
                                        >
                                            <Phone className="h-4 w-4" />
                                        </ItemMedia>
                                        <ItemContent>
                                            <ItemTitle className="text-xs text-muted-foreground">
                                                Phone Number
                                            </ItemTitle>
                                            <ItemDescription className="text-base font-semibold text-foreground">
                                                {selectedSupplier.phone}
                                            </ItemDescription>
                                        </ItemContent>
                                    </Item>
                                )}
                                {selectedSupplier.address && (
                                    <Item
                                        size="sm"
                                        className="col-span-1 rounded-lg bg-muted/40"
                                    >
                                        <ItemMedia
                                            variant="icon"
                                            className="bg-background text-muted-foreground"
                                        >
                                            <MapPin className="h-4 w-4" />
                                        </ItemMedia>
                                        <ItemContent>
                                            <ItemTitle className="text-xs text-muted-foreground">
                                                Address
                                            </ItemTitle>
                                            <ItemDescription className="text-base font-semibold text-foreground">
                                                {selectedSupplier.address}
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
                                        <Package className="h-4 w-4" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="text-xs text-muted-foreground">
                                            Total Purchases
                                        </ItemTitle>
                                        <ItemDescription className="text-base font-semibold text-foreground">
                                            {selectedSupplier.purchases_sum_quantity_kg
                                                ? Number(
                                                      selectedSupplier.purchases_sum_quantity_kg,
                                                  ).toFixed(2)
                                                : '0.00'}{' '}
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
                                        <Package className="h-4 w-4" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="text-xs text-muted-foreground">
                                            Remaining Stock
                                        </ItemTitle>
                                        <ItemDescription className="text-base font-semibold text-foreground">
                                            {selectedSupplier.remaining_stock !==
                                            undefined
                                                ? Number(
                                                      selectedSupplier.remaining_stock,
                                                  ).toFixed(2)
                                                : '0.00'}{' '}
                                            kg
                                            {selectedSupplier.purchases_sum_quantity_kg &&
                                                selectedSupplier.remaining_stock !==
                                                    undefined &&
                                                Number(
                                                    selectedSupplier.purchases_sum_quantity_kg,
                                                ) > 0 && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        (
                                                        {(
                                                            (Number(
                                                                selectedSupplier.remaining_stock,
                                                            ) /
                                                                Number(
                                                                    selectedSupplier.purchases_sum_quantity_kg,
                                                                )) *
                                                            100
                                                        ).toFixed(1)}
                                                        % remaining)
                                                    </span>
                                                )}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                {selectedSupplier.notes && (
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
                                                {selectedSupplier.notes}
                                            </ItemDescription>
                                        </ItemContent>
                                    </Item>
                                )}
                                <Item
                                    size="sm"
                                    className="col-span-2 rounded-lg bg-muted/40"
                                >
                                    <ItemMedia
                                        variant="icon"
                                        className="bg-background text-muted-foreground"
                                    >
                                        <Calendar className="h-4 w-4" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="text-xs text-muted-foreground">
                                            Created At
                                        </ItemTitle>
                                        <ItemDescription className="text-base font-semibold text-foreground">
                                            {new Date(
                                                selectedSupplier.created_at,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
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
                            <DialogTitle>Delete Supplier</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete{' '}
                                {selectedSupplier?.name}? This action cannot be
                                undone.
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
