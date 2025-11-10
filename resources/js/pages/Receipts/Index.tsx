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
import { Textarea } from '@/components/ui/textarea';
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
    DownloadIcon,
    FileText,
    MailIcon,
    MoreHorizontal,
    RefreshCw,
    Search,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Receipts',
        href: '/receipts',
    },
];

interface Customer {
    id: number;
    name: string;
}

interface Sale {
    id: number;
    sale_date: string;
    total_amount: number | string;
    customer: Customer;
}

interface Receipt {
    id: number;
    receipt_number: string;
    status: 'active' | 'void' | 'reissued';
    issued_at: string;
    voided_at: string | null;
    void_reason: string | null;
    sale: Sale;
}

interface ReceiptsProps {
    receipts: {
        data: Receipt[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    filters?: {
        search?: string;
        status?: string;
    };
}

export default function ReceiptsIndex({
    receipts,
    filters = {},
}: ReceiptsProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {},
    );
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [voidOpen, setVoidOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(
        null,
    );
    const isInitialMount = useRef(true);

    const voidForm = useForm({
        reason: '',
    });

    // Debounced search function
    const performSearch = useCallback((search: string, status: string) => {
        router.get(
            '/receipts',
            {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['receipts', 'filters'],
            },
        );
    }, []);

    // Debounce search input
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            performSearch(searchValue, statusFilter);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchValue, statusFilter, performSearch]);

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
            '/receipts',
            {
                search: searchValue || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter,
                ...sortParam,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['receipts', 'filters'],
            },
        );
    }, [sorting, searchValue, statusFilter]);

    const handleSearch = (value: string) => {
        setSearchValue(value);
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
    };

    const handleDownload = (receiptId: number) => {
        window.open(`/receipts/${receiptId}/download`, '_blank');
    };

    const handleSendEmail = (receiptId: number) => {
        router.post(
            `/receipts/${receiptId}/email`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Receipt email sent successfully.');
                },
                onError: () => {
                    toast.error('Failed to send receipt email.');
                },
            },
        );
    };

    const handleVoid = () => {
        if (!selectedReceipt) return;

        voidForm.post(`/receipts/${selectedReceipt.id}/void`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Receipt voided successfully.');
                setVoidOpen(false);
                setSelectedReceipt(null);
                voidForm.reset();
            },
            onError: () => {
                toast.error('Failed to void receipt.');
            },
        });
    };

    const handleReissue = (receiptId: number) => {
        router.post(
            `/receipts/${receiptId}/reissue`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    const message =
                        (page.props.flash as { success?: string })?.success ||
                        'Receipt reissued successfully.';
                    toast.success(message);
                },
                onError: () => {
                    toast.error('Failed to reissue receipt.');
                },
            },
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Active
                    </span>
                );
            case 'void':
                return (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        Void
                    </span>
                );
            case 'reissued':
                return (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        Reissued
                    </span>
                );
            default:
                return null;
        }
    };

    const columns = useMemo<ColumnDef<Receipt>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
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
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'receipt_number',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === 'asc',
                                )
                            }
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                        >
                            Receipt Number
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div className="font-medium">
                        {row.original.receipt_number}
                    </div>
                ),
            },
            {
                accessorKey: 'sale.customer.name',
                header: 'Customer',
                cell: ({ row }) => <div>{row.original.sale.customer.name}</div>,
            },
            {
                accessorKey: 'issued_at',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === 'asc',
                                )
                            }
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                        >
                            Issued Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <div>
                        {new Date(row.original.issued_at).toLocaleDateString()}
                    </div>
                ),
            },
            {
                accessorKey: 'sale.total_amount',
                header: 'Sale Amount',
                cell: ({ row }) => (
                    <div className="font-medium">
                        SBD {Number(row.original.sale.total_amount).toFixed(2)}
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === 'asc',
                                )
                            }
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                        >
                            Status
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => getStatusBadge(row.original.status),
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }) => {
                    const receipt = row.original;
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
                                        onClick={() =>
                                            handleDownload(receipt.id)
                                        }
                                    >
                                        <DownloadIcon className="mr-2 h-4 w-4" />
                                        Download
                                    </DropdownMenuItem>
                                    {receipt.sale.customer && (
                                        <DropdownMenuItem
                                            onClick={() =>
                                                handleSendEmail(receipt.id)
                                            }
                                        >
                                            <MailIcon className="mr-2 h-4 w-4" />
                                            Email Receipt
                                        </DropdownMenuItem>
                                    )}
                                    {receipt.status === 'active' && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleReissue(receipt.id)
                                                }
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Reissue
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedReceipt(receipt);
                                                    setVoidOpen(true);
                                                }}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Void
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
            },
        ],
        [],
    );

    const table = useReactTable({
        data: receipts.data,
        columns,
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualSorting: true,
        state: {
            sorting,
            rowSelection,
            columnVisibility,
        },
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Receipts" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Receipts
                        </h1>
                        <p className="text-muted-foreground">
                            Manage and track all receipts issued for sales.
                        </p>
                    </div>
                </div>

                {/* Filters and Table Controls */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by receipt number or customer..."
                                value={searchValue}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={handleStatusFilter}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="void">Void</SelectItem>
                                <SelectItem value="reissued">
                                    Reissued
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                <Columns className="mr-2 h-4 w-4" />
                                View
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
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
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Data Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
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
                                            <TableCell key={cell.id}>
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
                                                <FileText className="size-8" />
                                            </EmptyMedia>
                                            <EmptyHeader>
                                                <EmptyTitle>
                                                    No receipts found
                                                </EmptyTitle>
                                                <EmptyDescription>
                                                    {searchValue ||
                                                    statusFilter !== 'all'
                                                        ? 'Try adjusting your search or filter criteria.'
                                                        : 'Receipts will appear here once sales are created. Each sale automatically generates a receipt.'}
                                                </EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination and Selection Info */}
                <div className="flex items-center justify-between">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {Object.keys(rowSelection).length > 0 && (
                            <div>
                                {Object.keys(rowSelection).length} of{' '}
                                {receipts.data.length} row(s) selected.
                            </div>
                        )}
                    </div>
                    {receipts.last_page > 1 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Label
                                    htmlFor="rows-per-page"
                                    className="text-sm font-medium"
                                >
                                    Rows per page
                                </Label>
                                <Select
                                    value={receipts.per_page.toString()}
                                    onValueChange={(value) => {
                                        router.get(
                                            '/receipts',
                                            {
                                                status: filters.status,
                                                search:
                                                    searchValue || undefined,
                                                per_page: value,
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                                only: ['receipts', 'filters'],
                                            },
                                        );
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue
                                            placeholder={receipts.per_page}
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
                            <div className="flex items-center gap-2">
                                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                                    Page {receipts.current_page} of{' '}
                                    {receipts.last_page}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                            router.get(
                                                '/receipts',
                                                {
                                                    status: filters.status,
                                                    search:
                                                        searchValue ||
                                                        undefined,
                                                    page: 1,
                                                },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                    replace: true,
                                                    only: [
                                                        'receipts',
                                                        'filters',
                                                    ],
                                                },
                                            );
                                        }}
                                        disabled={receipts.current_page === 1}
                                    >
                                        <span className="sr-only">
                                            Go to first page
                                        </span>
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                            router.get(
                                                '/receipts',
                                                {
                                                    status: filters.status,
                                                    search:
                                                        searchValue ||
                                                        undefined,
                                                    page:
                                                        receipts.current_page -
                                                        1,
                                                },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                    replace: true,
                                                    only: [
                                                        'receipts',
                                                        'filters',
                                                    ],
                                                },
                                            );
                                        }}
                                        disabled={receipts.current_page === 1}
                                    >
                                        <span className="sr-only">
                                            Go to previous page
                                        </span>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                            router.get(
                                                '/receipts',
                                                {
                                                    status: filters.status,
                                                    search:
                                                        searchValue ||
                                                        undefined,
                                                    page:
                                                        receipts.current_page +
                                                        1,
                                                },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                    replace: true,
                                                    only: [
                                                        'receipts',
                                                        'filters',
                                                    ],
                                                },
                                            );
                                        }}
                                        disabled={
                                            receipts.current_page ===
                                            receipts.last_page
                                        }
                                    >
                                        <span className="sr-only">
                                            Go to next page
                                        </span>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                            router.get(
                                                '/receipts',
                                                {
                                                    status: filters.status,
                                                    search:
                                                        searchValue ||
                                                        undefined,
                                                    page: receipts.last_page,
                                                },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                    replace: true,
                                                    only: [
                                                        'receipts',
                                                        'filters',
                                                    ],
                                                },
                                            );
                                        }}
                                        disabled={
                                            receipts.current_page ===
                                            receipts.last_page
                                        }
                                    >
                                        <span className="sr-only">
                                            Go to last page
                                        </span>
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Void Receipt Dialog */}
                <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Void Receipt</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to void receipt{' '}
                                <strong>
                                    {selectedReceipt?.receipt_number}
                                </strong>
                                ? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="reason">
                                    Reason for voiding
                                </Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Enter reason for voiding this receipt..."
                                    value={voidForm.data.reason}
                                    onChange={(e) =>
                                        voidForm.setData(
                                            'reason',
                                            e.target.value,
                                        )
                                    }
                                    rows={4}
                                />
                                {voidForm.errors.reason && (
                                    <p className="text-sm text-destructive">
                                        {voidForm.errors.reason}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setVoidOpen(false);
                                    setSelectedReceipt(null);
                                    voidForm.reset();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleVoid}
                                disabled={
                                    voidForm.processing ||
                                    !voidForm.data.reason.trim()
                                }
                            >
                                {voidForm.processing
                                    ? 'Voiding...'
                                    : 'Void Receipt'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
