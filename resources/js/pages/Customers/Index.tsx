import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
    Column,
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import {
    ArrowUpDown,
    Building2,
    EyeIcon,
    InfoIcon,
    Mail,
    MapPin,
    MoreHorizontal,
    PencilIcon,
    Phone,
    PlusIcon,
    Search,
    TrashIcon,
    User,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customers',
        href: '/customers',
    },
];

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    type: 'individual' | 'business';
    address: string | null;
}

interface CustomersProps {
    customers: {
        data: Customer[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    filters: {
        search?: string;
        type?: string;
    };
}

export default function CustomersIndex({ customers, filters }: CustomersProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [showOpen, setShowOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
        null,
    );
    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const isInitialMount = useRef(true);
    const renderSortableHeader = (
        label: string,
        column: Column<Customer, unknown>,
    ) => (
        <Button
            variant="ghost"
            className="group h-8 px-2 lg:px-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            {label}
            <ArrowUpDown
                className={`ml-2 h-4 w-4 transition-opacity duration-150 ${column.getIsSorted() ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100'}`}
            />
        </Button>
    );

    // Debounced search function
    const performSearch = useCallback((search: string, type: string) => {
        router.get(
            '/customers',
            {
                search: search || undefined,
                type: type === 'all' ? undefined : type,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['customers', 'filters'],
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
            performSearch(searchValue, typeFilter);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchValue, typeFilter, performSearch]);

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
            '/customers',
            {
                search: searchValue || undefined,
                type: typeFilter === 'all' ? undefined : typeFilter,
                ...sortParam,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['customers', 'filters'],
            },
        );
    }, [sorting, searchValue, typeFilter]);

    const editForm = useForm({
        name: '',
        email: '',
        phone: '',
        type: 'individual' as 'individual' | 'business',
        address: '',
    });

    const handleEdit = useCallback(
        (customer: Customer) => {
            setSelectedCustomer(customer);
            editForm.setData({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone || '',
                type: customer.type,
                address: customer.address || '',
            });
            setEditOpen(true);
        },
        [editForm],
    );

    const columns = useMemo<ColumnDef<Customer>[]>(
        () => [
            {
                accessorKey: 'name',
                header: ({ column }) => {
                    return renderSortableHeader('Name', column);
                },
                cell: ({ row }) => (
                    <div className="font-medium">{row.getValue('name')}</div>
                ),
            },
            {
                accessorKey: 'email',
                header: ({ column }) => renderSortableHeader('Email', column),
                cell: ({ row }) => (
                    <div className="text-muted-foreground">
                        {row.getValue('email') || '-'}
                    </div>
                ),
            },
            {
                accessorKey: 'phone',
                header: ({ column }) => renderSortableHeader('Phone', column),
                cell: ({ row }) => (
                    <div className="text-muted-foreground">
                        {row.getValue('phone') || '-'}
                    </div>
                ),
            },
            {
                accessorKey: 'address',
                header: () => (
                    <div className="hidden max-w-[220px] truncate text-left md:block">
                        Address
                    </div>
                ),
                cell: ({ row }) => {
                    const address = row.original.address;
                    return (
                        <div
                            className="hidden max-w-[220px] truncate text-muted-foreground md:block"
                            title={address || undefined}
                        >
                            {address || '-'}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'type',
                header: ({ column }) => renderSortableHeader('Type', column),
                cell: ({ row }) => (
                    <div className="capitalize">{row.getValue('type')}</div>
                ),
            },
            {
                id: 'actions',
                header: 'Actions',
                enableHiding: false,
                cell: ({ row }) => {
                    const customer = row.original;
                    return (
                        <div className="flex justify-start pl-1">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                    >
                                        <span className="sr-only">
                                            Open menu
                                        </span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                        Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setSelectedCustomer(customer);
                                            setShowOpen(true);
                                        }}
                                    >
                                        <EyeIcon className="mr-2 h-4 w-4" />
                                        View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleEdit(customer)}
                                    >
                                        <PencilIcon className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => {
                                            setSelectedCustomer(customer);
                                            setDeleteOpen(true);
                                        }}
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
        data: customers.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        manualSorting: true,
        manualPagination: true,
        state: {
            sorting,
        },
    });

    const handleSearch = (value: string) => {
        setSearchValue(value);
    };

    const handleTypeFilter = (value: string) => {
        setTypeFilter(value);
    };

    const handleClearFilters = () => {
        setSearchValue('');
        setTypeFilter('all');
        performSearch('', 'all');
    };

    const handlePageChange = (url: string | null) => {
        if (!url) return;
        router.visit(url, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        type: 'individual' as 'individual' | 'business',
        address: '',
    });

    const handleCreate = () => {
        createForm.post('/customers', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleUpdate = () => {
        if (!selectedCustomer) return;
        editForm.put(`/customers/${selectedCustomer.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditOpen(false);
                setSelectedCustomer(null);
            },
        });
    };

    const handleDelete = () => {
        if (!selectedCustomer) return;
        router.delete(`/customers/${selectedCustomer.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setSelectedCustomer(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customers" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Customers</h1>
                    <Button onClick={() => setCreateOpen(true)}>
                        <PlusIcon />
                        Add Customer
                    </Button>
                </div>

                <Alert>
                    <InfoIcon />
                    <AlertTitle>About Customers</AlertTitle>
                    <AlertDescription>
                        Customers are individuals or businesses you sell fish
                        to. Create customers once, then select them when
                        recording sales. You can filter by customer type
                        (individual or business) and search by name. Customers
                        with email addresses can receive receipts via email.
                    </AlertDescription>
                </Alert>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search customers by name..."
                            value={searchValue}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={handleTypeFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="individual">
                                Individual
                            </SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                    </Select>
                    {(searchValue || typeFilter !== 'all') && (
                        <Button
                            variant="ghost"
                            onClick={handleClearFilters}
                            className="text-sm"
                        >
                            Clear filters
                        </Button>
                    )}
                </div>

                {/* Data Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
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
                                                <Users className="size-8" />
                                            </EmptyMedia>
                                            <EmptyHeader>
                                                <EmptyTitle>
                                                    No customers found
                                                </EmptyTitle>
                                                <EmptyDescription>
                                                    Get started by adding your
                                                    first customer. Customers
                                                    are individuals or
                                                    businesses you sell fish to.
                                                </EmptyDescription>
                                            </EmptyHeader>
                                            <EmptyContent>
                                                <Button
                                                    onClick={() =>
                                                        setCreateOpen(true)
                                                    }
                                                >
                                                    <PlusIcon className="mr-2 h-4 w-4" />
                                                    Add Customer
                                                </Button>
                                            </EmptyContent>
                                        </Empty>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {customers.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {customers.from} to {customers.to} of{' '}
                            {customers.total} customers
                        </div>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={
                                            customers.links[0]?.url || undefined
                                        }
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handlePageChange(
                                                customers.links[0]?.url || null,
                                            );
                                        }}
                                        className={
                                            !customers.links[0]?.url
                                                ? 'pointer-events-none opacity-50'
                                                : 'cursor-pointer'
                                        }
                                    />
                                </PaginationItem>
                                {customers.links
                                    .slice(1, -1)
                                    .map((link, index) => {
                                        if (link.label === '...') {
                                            return (
                                                <PaginationItem
                                                    key={`ellipsis-${index}`}
                                                >
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            );
                                        }
                                        return (
                                            <PaginationItem key={link.label}>
                                                <PaginationLink
                                                    href={link.url || undefined}
                                                    isActive={link.active}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handlePageChange(
                                                            link.url || null,
                                                        );
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    {link.label}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}
                                <PaginationItem>
                                    <PaginationNext
                                        href={
                                            customers.links[
                                                customers.links.length - 1
                                            ]?.url || undefined
                                        }
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handlePageChange(
                                                customers.links[
                                                    customers.links.length - 1
                                                ]?.url || null,
                                            );
                                        }}
                                        className={
                                            !customers.links[
                                                customers.links.length - 1
                                            ]?.url
                                                ? 'pointer-events-none opacity-50'
                                                : 'cursor-pointer'
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}

                {/* Create Modal */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 sm:max-w-[500px]">
                        <DialogHeader className="shrink-0 pb-4">
                            <DialogTitle>Create Customer</DialogTitle>
                            <DialogDescription>
                                Add a new customer to the system. All fields
                                marked with * are required.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-1">
                            <FieldGroup className="gap-6">
                                <Field data-invalid={!!createForm.errors.name}>
                                    <FieldLabel htmlFor="name">
                                        Full Name *
                                    </FieldLabel>
                                    <div className="relative">
                                        <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                                            placeholder="John Doe"
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
                                            placeholder="john.doe@example.com"
                                        />
                                    </div>
                                    <FieldDescription>
                                        Used for sending receipts via email.
                                    </FieldDescription>
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
                                <Field data-invalid={!!createForm.errors.type}>
                                    <FieldLabel htmlFor="type">
                                        Customer Type *
                                    </FieldLabel>
                                    <Select
                                        value={createForm.data.type}
                                        onValueChange={(
                                            value: 'individual' | 'business',
                                        ) => createForm.setData('type', value)}
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="individual">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    Individual
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="business">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4" />
                                                    Business
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FieldError>
                                        {createForm.errors.type}
                                    </FieldError>
                                </Field>
                                <Field
                                    data-invalid={!!createForm.errors.address}
                                >
                                    <FieldLabel htmlFor="address">
                                        Address
                                    </FieldLabel>
                                    <div className="relative">
                                        <MapPin className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <textarea
                                            id="address"
                                            value={createForm.data.address}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'address',
                                                    e.target.value,
                                                )
                                            }
                                            className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm"
                                            placeholder="123 Main St, City, State ZIP"
                                        />
                                    </div>
                                    <FieldError>
                                        {createForm.errors.address}
                                    </FieldError>
                                </Field>
                            </FieldGroup>
                        </div>
                        <DialogFooter className="shrink-0 border-t pt-4">
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
                                        Create Customer
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 sm:max-w-[500px]">
                        <DialogHeader className="shrink-0 pb-4">
                            <DialogTitle>Edit Customer</DialogTitle>
                            <DialogDescription>
                                Update customer information. All fields marked
                                with * are required.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-1">
                            <FieldGroup className="gap-6">
                                <Field data-invalid={!!editForm.errors.name}>
                                    <FieldLabel htmlFor="edit-name">
                                        Full Name *
                                    </FieldLabel>
                                    <div className="relative">
                                        <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                                            placeholder="John Doe"
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
                                            placeholder="john.doe@example.com"
                                        />
                                    </div>
                                    <FieldDescription>
                                        Used for sending receipts via email.
                                    </FieldDescription>
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
                                <Field data-invalid={!!editForm.errors.type}>
                                    <FieldLabel htmlFor="edit-type">
                                        Customer Type *
                                    </FieldLabel>
                                    <Select
                                        value={editForm.data.type}
                                        onValueChange={(
                                            value: 'individual' | 'business',
                                        ) => editForm.setData('type', value)}
                                    >
                                        <SelectTrigger id="edit-type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="individual">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    Individual
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="business">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4" />
                                                    Business
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FieldError>
                                        {editForm.errors.type}
                                    </FieldError>
                                </Field>
                                <Field data-invalid={!!editForm.errors.address}>
                                    <FieldLabel htmlFor="edit-address">
                                        Address
                                    </FieldLabel>
                                    <div className="relative">
                                        <MapPin className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <textarea
                                            id="edit-address"
                                            value={editForm.data.address}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'address',
                                                    e.target.value,
                                                )
                                            }
                                            className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm"
                                            placeholder="123 Main St, City, State ZIP"
                                        />
                                    </div>
                                    <FieldError>
                                        {editForm.errors.address}
                                    </FieldError>
                                </Field>
                            </FieldGroup>
                        </div>
                        <DialogFooter className="shrink-0 border-t pt-4">
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
                                        Update Customer
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Show Modal */}
                <Dialog open={showOpen} onOpenChange={setShowOpen}>
                    <DialogContent className="w-full sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Customer Details</DialogTitle>
                            <DialogDescription>
                                View complete customer information.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedCustomer && (
                            <ItemGroup>
                                <Item>
                                    <ItemMedia variant="icon">
                                        <User className="h-5 w-5" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle>Full Name</ItemTitle>
                                        <ItemDescription>
                                            {selectedCustomer.name}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                <Item>
                                    <ItemMedia variant="icon">
                                        <Mail className="h-5 w-5" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle>Email Address</ItemTitle>
                                        <ItemDescription>
                                            {selectedCustomer.email || (
                                                <span className="text-muted-foreground">
                                                    Not provided
                                                </span>
                                            )}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                <Item>
                                    <ItemMedia variant="icon">
                                        <Phone className="h-5 w-5" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle>Phone Number</ItemTitle>
                                        <ItemDescription>
                                            {selectedCustomer.phone || (
                                                <span className="text-muted-foreground">
                                                    Not provided
                                                </span>
                                            )}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                <Item>
                                    <ItemMedia variant="icon">
                                        {selectedCustomer.type ===
                                        'business' ? (
                                            <Building2 className="h-5 w-5" />
                                        ) : (
                                            <User className="h-5 w-5" />
                                        )}
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle>Customer Type</ItemTitle>
                                        <ItemDescription className="capitalize">
                                            {selectedCustomer.type}
                                        </ItemDescription>
                                    </ItemContent>
                                </Item>
                                {selectedCustomer.address && (
                                    <Item>
                                        <ItemMedia variant="icon">
                                            <MapPin className="h-5 w-5" />
                                        </ItemMedia>
                                        <ItemContent>
                                            <ItemTitle>Address</ItemTitle>
                                            <ItemDescription>
                                                {selectedCustomer.address}
                                            </ItemDescription>
                                        </ItemContent>
                                    </Item>
                                )}
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
                            <DialogTitle>Delete Customer</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete{' '}
                                {selectedCustomer?.name}? This action cannot be
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
