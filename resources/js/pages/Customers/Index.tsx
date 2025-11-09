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
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import {
    ArrowUpDown,
    EyeIcon,
    InfoIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
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
                accessorKey: 'type',
                header: 'Type',
                cell: ({ row }) => (
                    <div className="capitalize">{row.getValue('type')}</div>
                ),
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }) => {
                    const customer = row.original;
                    return (
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setSelectedCustomer(customer);
                                    setShowOpen(true);
                                }}
                            >
                                <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(customer)}
                            >
                                <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setSelectedCustomer(customer);
                                    setDeleteOpen(true);
                                }}
                            >
                                <TrashIcon className="h-4 w-4" />
                            </Button>
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
                    <div className="flex-1">
                        <Input
                            placeholder="Search customers by name..."
                            value={searchValue}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="max-w-sm"
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
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Customer</DialogTitle>
                            <DialogDescription>
                                Add a new customer to the system.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={createForm.data.name}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1"
                                />
                                {createForm.errors.name && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {createForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
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
                                    className="mt-1"
                                />
                                {createForm.errors.email && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {createForm.errors.email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={createForm.data.phone}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'phone',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="type">Type *</Label>
                                <Select
                                    value={createForm.data.type}
                                    onValueChange={(
                                        value: 'individual' | 'business',
                                    ) => createForm.setData('type', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">
                                            Individual
                                        </SelectItem>
                                        <SelectItem value="business">
                                            Business
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {createForm.errors.type && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {createForm.errors.type}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="address">Address</Label>
                                <textarea
                                    id="address"
                                    value={createForm.data.address}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'address',
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
                            <DialogTitle>Edit Customer</DialogTitle>
                            <DialogDescription>
                                Update customer information.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-name">Name *</Label>
                                <Input
                                    id="edit-name"
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData('name', e.target.value)
                                    }
                                    className="mt-1"
                                />
                                {editForm.errors.name && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {editForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="edit-email">Email</Label>
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
                                    className="mt-1"
                                />
                                {editForm.errors.email && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {editForm.errors.email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="edit-phone">Phone</Label>
                                <Input
                                    id="edit-phone"
                                    value={editForm.data.phone}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'phone',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-type">Type *</Label>
                                <Select
                                    value={editForm.data.type}
                                    onValueChange={(
                                        value: 'individual' | 'business',
                                    ) => editForm.setData('type', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">
                                            Individual
                                        </SelectItem>
                                        <SelectItem value="business">
                                            Business
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
                                <Label htmlFor="edit-address">Address</Label>
                                <textarea
                                    id="edit-address"
                                    value={editForm.data.address}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'address',
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
                            <DialogTitle>Customer Details</DialogTitle>
                        </DialogHeader>
                        {selectedCustomer && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Name</Label>
                                    <p className="mt-1">
                                        {selectedCustomer.name}
                                    </p>
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <p className="mt-1">
                                        {selectedCustomer.email || '-'}
                                    </p>
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <p className="mt-1">
                                        {selectedCustomer.phone || '-'}
                                    </p>
                                </div>
                                <div>
                                    <Label>Type</Label>
                                    <p className="mt-1 capitalize">
                                        {selectedCustomer.type}
                                    </p>
                                </div>
                                {selectedCustomer.address && (
                                    <div>
                                        <Label>Address</Label>
                                        <p className="mt-1">
                                            {selectedCustomer.address}
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
