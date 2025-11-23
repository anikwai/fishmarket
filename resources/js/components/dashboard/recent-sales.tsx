import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { router } from '@inertiajs/react';
import {
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconDotsVertical,
    IconLayoutColumns,
} from '@tabler/icons-react';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, CheckCircle, Loader2, Search } from 'lucide-react';
import * as React from 'react';
import { z } from 'zod';

// Schema definition matching the backend data
export const recentSaleSchema = z.object({
    id: z.number(),
    sale_date: z.string(),
    quantity_kg: z.number(),
    price_per_kg: z.number(),
    discount_percentage: z.number(),
    subtotal: z.number(),
    delivery_fee: z.number(),
    total_amount: z.number(),
    is_credit: z.boolean(),
    is_delivery: z.boolean(),
    notes: z.string().nullable(),
    customer: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
    }),
    payments: z.array(
        z.object({
            id: z.number(),
            amount: z.number(),
            payment_date: z.string(),
        }),
    ),
    outstanding_balance: z.number(),
});

export type RecentSale = z.infer<typeof recentSaleSchema>;

function SaleDetailsDrawer({ sale }: { sale: RecentSale }) {
    const isMobile = useIsMobile();
    const totalPaid = sale.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
    );
    const paymentProgress =
        sale.total_amount > 0 ? (totalPaid / sale.total_amount) * 100 : 0;

    return (
        <Drawer direction={isMobile ? 'bottom' : 'right'}>
            <DrawerTrigger asChild>
                <Button
                    variant="link"
                    className="w-fit px-0 text-left font-medium text-foreground"
                >
                    {sale.customer.name}
                </Button>
            </DrawerTrigger>
            <DrawerContent
                className={
                    isMobile
                        ? ''
                        : 'ml-auto h-full w-[450px] rounded-none border-l'
                }
            >
                <DrawerHeader className="gap-1 border-b pb-4">
                    <DrawerTitle className="text-xl">Sale Details</DrawerTitle>
                    <DrawerDescription className="text-sm">
                        Transaction #{sale.id}
                    </DrawerDescription>
                </DrawerHeader>

                <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
                    {/* Customer Information */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Customer
                        </h3>
                        <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="text-sm font-semibold">
                                    {sale.customer.name
                                        .substring(0, 2)
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="truncate text-base font-semibold">
                                    {sale.customer.name}
                                </span>
                                {sale.customer.email && (
                                    <span className="truncate text-xs text-muted-foreground">
                                        {sale.customer.email}
                                    </span>
                                )}
                                {sale.customer.phone && (
                                    <span className="text-xs text-muted-foreground">
                                        {sale.customer.phone}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Sale Information */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Sale Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <Label className="text-xs text-muted-foreground">
                                    Date
                                </Label>
                                <span className="text-sm font-medium">
                                    {new Date(
                                        sale.sale_date,
                                    ).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-xs text-muted-foreground">
                                    Payment Status
                                </Label>
                                <Badge
                                    variant="outline"
                                    className="w-fit px-2 py-0.5"
                                >
                                    {!sale.is_credit ? (
                                        <>
                                            <CheckCircle className="mr-1.5 size-3 text-green-500" />
                                            <span className="text-xs">
                                                Paid
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Loader2 className="mr-1.5 size-3" />
                                            <span className="text-xs">
                                                Credit
                                            </span>
                                        </>
                                    )}
                                </Badge>
                            </div>
                            {sale.is_delivery && (
                                <div className="col-span-2 flex flex-col gap-1">
                                    <Label className="text-xs text-muted-foreground">
                                        Delivery
                                    </Label>
                                    <Badge
                                        variant="secondary"
                                        className="w-fit px-2 py-0.5"
                                    >
                                        <span className="text-xs">
                                            Delivery Order
                                        </span>
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Order Details */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Order Details
                        </h3>
                        <div className="rounded-lg border bg-muted/30">
                            <div className="space-y-3 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Quantity
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                        {sale.quantity_kg.toFixed(2)} kg
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Price per kg
                                    </span>
                                    <span className="font-medium tabular-nums">
                                        SBD {sale.price_per_kg.toFixed(2)}
                                    </span>
                                </div>
                                {sale.discount_percentage > 0 && (
                                    <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                                        <span className="text-sm">
                                            Discount
                                        </span>
                                        <span className="font-medium tabular-nums">
                                            -
                                            {sale.discount_percentage.toFixed(
                                                1,
                                            )}
                                            %
                                        </span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Subtotal
                                    </span>
                                    <span className="font-medium tabular-nums">
                                        SBD {sale.subtotal.toFixed(2)}
                                    </span>
                                </div>
                                {sale.delivery_fee > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Delivery Fee
                                        </span>
                                        <span className="font-medium tabular-nums">
                                            SBD {sale.delivery_fee.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">
                                        Total Amount
                                    </span>
                                    <span className="text-xl font-bold tabular-nums">
                                        SBD {sale.total_amount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Information */}
                    {sale.is_credit && (
                        <>
                            <Separator />
                            <div className="flex flex-col gap-3">
                                <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                    Payment Status
                                </h3>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Amount Paid
                                        </span>
                                        <span className="font-semibold tabular-nums">
                                            SBD {totalPaid.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Outstanding
                                        </span>
                                        <span className="font-semibold text-destructive tabular-nums">
                                            SBD{' '}
                                            {sale.outstanding_balance.toFixed(
                                                2,
                                            )}
                                        </span>
                                    </div>
                                    <div className="mt-1">
                                        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                                            <span>Payment Progress</span>
                                            <span>
                                                {Math.round(paymentProgress)}%
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full bg-primary transition-all duration-300"
                                                style={{
                                                    width: `${paymentProgress}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {sale.payments.length > 0 && (
                                    <div className="mt-2">
                                        <Label className="mb-2 block text-xs text-muted-foreground">
                                            Payment History
                                        </Label>
                                        <div className="space-y-2">
                                            {sale.payments.map((payment) => (
                                                <div
                                                    key={payment.id}
                                                    className="flex items-center justify-between rounded-md bg-muted/50 p-2 text-xs"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {new Date(
                                                            payment.payment_date,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                            },
                                                        )}
                                                    </span>
                                                    <span className="font-medium tabular-nums">
                                                        SBD{' '}
                                                        {payment.amount.toFixed(
                                                            2,
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Notes */}
                    {sale.notes && (
                        <>
                            <Separator />
                            <div className="flex flex-col gap-2">
                                <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                    Notes
                                </h3>
                                <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                                    {sale.notes}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <DrawerFooter className="border-t pt-4">
                    <Button
                        onClick={() => router.visit(`/sales`)}
                        className="w-full"
                    >
                        View Full Sales Record
                    </Button>
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full">
                            Close
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

export const columns: ColumnDef<RecentSale>[] = [
    {
        id: 'customer',
        accessorFn: (row) => row.customer.name,
        header: 'Customer',
        cell: ({ row }) => <SaleDetailsDrawer sale={row.original} />,
    },
    {
        accessorKey: 'sale_date',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const sale = row.original;
            return (
                <div className="text-sm text-muted-foreground">
                    {new Date(sale.sale_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </div>
            );
        },
    },
    {
        accessorKey: 'is_credit',
        header: 'Status',
        cell: ({ row }) => {
            const isCredit = row.original.is_credit;
            return (
                <Badge
                    variant="outline"
                    className="px-1.5 text-muted-foreground"
                >
                    {!isCredit ? (
                        <CheckCircle className="mr-1 size-3.5 fill-green-500 text-white dark:fill-green-400 dark:text-black" />
                    ) : (
                        <Loader2 className="mr-1 size-3.5" />
                    )}
                    {isCredit ? 'Credit' : 'Paid'}
                </Badge>
            );
        },
        filterFn: (row, id, value) => {
            // Filter logic: value is an array of booleans we want to MATCH.
            // If value is undefined or empty, show all.
            // row.getValue(id) is boolean (is_credit)
            if (!value || value.length === 0) return true;
            return value.includes(Boolean(row.getValue(id)));
        },
    },
    {
        accessorKey: 'total_amount',
        header: ({ column }) => {
            return (
                <div className="text-right">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-mr-3 h-8 data-[state=open]:bg-accent"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        Amount
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            );
        },
        cell: ({ row }) => {
            const sale = row.original;
            return (
                <div className="text-right font-medium tabular-nums">
                    SBD {Number(sale.total_amount).toFixed(2)}
                </div>
            );
        },
    },
    {
        id: 'actions',
        header: () => <div className="text-right">Action</div>,
        enableHiding: false,
        cell: ({ row }) => {
            const customerId = row.original.customer.id;
            return (
                <div className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <IconDotsVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => router.visit('/sales')}
                            >
                                View full list
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() =>
                                    router.visit(
                                        `/customers/${customerId}/history`,
                                    )
                                }
                            >
                                View customer history
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];

export function RecentSales({ data }: { data: RecentSale[] }) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 5,
    });

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination,
        },
    });

    // Helper to render table content to avoid code duplication
    const TableContent = () => (
        <>
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
                                                      header.column.columnDef
                                                          .header,
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
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">
                        Rows per page
                    </p>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue
                                placeholder={
                                    table.getState().pagination.pageSize
                                }
                            />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                <SelectItem
                                    key={pageSize}
                                    value={`${pageSize}`}
                                >
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} of{' '}
                        {table.getPageCount()}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to first page</span>
                            <IconChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to next page</span>
                            <IconChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                                table.setPageIndex(table.getPageCount() - 1)
                            }
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            <IconChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <Tabs
            defaultValue="all"
            className="w-full flex-col justify-start gap-4"
            onValueChange={(value) => {
                if (value === 'all') {
                    table.getColumn('is_credit')?.setFilterValue(undefined);
                } else if (value === 'paid') {
                    table.getColumn('is_credit')?.setFilterValue([false]);
                } else if (value === 'credit') {
                    table.getColumn('is_credit')?.setFilterValue([true]);
                }
            }}
        >
            <div className="flex items-center justify-between px-1">
                <TabsList className="hidden sm:flex">
                    <TabsTrigger value="all">All Sales</TabsTrigger>
                    <TabsTrigger value="paid">Paid</TabsTrigger>
                    <TabsTrigger value="credit">Unpaid (Credit)</TabsTrigger>
                </TabsList>

                <div className="ml-auto flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter customers..."
                            value={
                                (table
                                    .getColumn('customer')
                                    ?.getFilterValue() as string) ?? ''
                            }
                            onChange={(event) =>
                                table
                                    .getColumn('customer')
                                    ?.setFilterValue(event.target.value)
                            }
                            className="h-9 w-[150px] pl-8 lg:w-[250px]"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                                <IconLayoutColumns className="mr-2 h-4 w-4" />
                                Columns{' '}
                                <IconChevronDown className="ml-2 h-4 w-4" />
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
            </div>

            <TabsContent value="all" className="mt-0">
                <TableContent />
            </TabsContent>
            <TabsContent value="paid" className="mt-0">
                <TableContent />
            </TabsContent>
            <TabsContent value="credit" className="mt-0">
                <TableContent />
            </TabsContent>
        </Tabs>
    );
}
