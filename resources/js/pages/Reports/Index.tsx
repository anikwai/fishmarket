'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/date-picker';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { 
    Bar, 
    BarChart, 
    CartesianGrid, 
    Cell,
    Line, 
    LineChart, 
    XAxis, 
    YAxis 
} from 'recharts';
import { 
    BarChart3,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Users,
    ShoppingCart,
    Package,
    CreditCard,
    FileText,
    Calendar,
    Filter,
    Download,
} from 'lucide-react';
import { useState, useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: '/reports',
    },
];

const reportTypes = [
    { value: 'sales-summary', label: 'Sales Summary', icon: DollarSign },
    { value: 'sales-by-customer', label: 'Sales by Customer', icon: Users },
    { value: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp },
    { value: 'outstanding-credits', label: 'Outstanding Credits', icon: CreditCard },
    { value: 'expense-report', label: 'Expense Report', icon: FileText },
    { value: 'purchase-report', label: 'Purchase Report', icon: ShoppingCart },
    { value: 'stock-report', label: 'Stock Report', icon: Package },
    { value: 'customer-report', label: 'Customer Report', icon: Users },
    { value: 'supplier-report', label: 'Supplier Report', icon: Users },
];

interface ReportsProps {
    reportType: string;
    startDate: string;
    endDate: string;
    customerId?: string | null;
    supplierId?: string | null;
    customers: Array<{ id: number; name: string }>;
    suppliers: Array<{ id: number; name: string }>;
    reportData: any;
}

const salesConfig = {
    revenue: {
        label: 'Revenue',
        color: '#22c55e',
    },
} satisfies ChartConfig;

const expenseConfig = {
    Shipping: {
        label: 'Shipping',
        color: '#3b82f6',
    },
    Ice: {
        label: 'Ice',
        color: '#06b6d4',
    },
    Other: {
        label: 'Other',
        color: '#8b5cf6',
    },
} satisfies ChartConfig;

export default function ReportsIndex({
    reportType: initialReportType,
    startDate: initialStartDate,
    endDate: initialEndDate,
    customerId: initialCustomerId,
    supplierId: initialSupplierId,
    customers,
    suppliers,
    reportData,
}: ReportsProps) {
    const [reportType, setReportType] = useState(initialReportType);
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [customerId, setCustomerId] = useState<string | null>(initialCustomerId || null);
    const [supplierId, setSupplierId] = useState<string | null>(initialSupplierId || null);

    const currentReport = reportTypes.find(r => r.value === reportType);

    const handleFilterChange = () => {
        const params: Record<string, string> = {
            type: reportType,
            start_date: startDate,
            end_date: endDate,
        };
        
        if (customerId && customerId !== 'all') {
            params.customer_id = customerId;
        }
        if (supplierId && supplierId !== 'all') {
            params.supplier_id = supplierId;
        }

        router.get('/reports', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExportCSV = () => {
        const params: Record<string, string> = {
            type: reportType,
            start_date: startDate,
            end_date: endDate,
        };
        
        if (customerId && customerId !== 'all') {
            params.customer_id = customerId;
        }
        if (supplierId && supplierId !== 'all') {
            params.supplier_id = supplierId;
        }

        const queryString = new URLSearchParams(params).toString();
        window.open(`/reports/export?${queryString}`, '_blank');
    };

    const renderReportContent = () => {
        switch (reportType) {
            case 'sales-summary':
                return <SalesSummaryReport data={reportData} />;
            case 'sales-by-customer':
                return <SalesByCustomerReport data={reportData} />;
            case 'profit-loss':
                return <ProfitLossReport data={reportData} />;
            case 'outstanding-credits':
                return <OutstandingCreditsReport data={reportData} />;
            case 'expense-report':
                return <ExpenseReport data={reportData} />;
            case 'purchase-report':
                return <PurchaseReport data={reportData} />;
            case 'stock-report':
                return <StockReport data={reportData} />;
            case 'customer-report':
                return <CustomerReport data={reportData} />;
            case 'supplier-report':
                return <SupplierReport data={reportData} />;
            default:
                return <SalesSummaryReport data={reportData} />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground mt-1">
                        Generate and view business reports
                    </p>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Report Filters
                        </CardTitle>
                        <CardDescription>
                            Select report type and date range to generate reports
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Report Type</Label>
                                    <Select value={reportType} onValueChange={setReportType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {reportTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex items-center gap-2">
                                                        <type.icon className="h-4 w-4" />
                                                        {type.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <DatePicker
                                        value={startDate}
                                        onChange={(value) => setStartDate(value || '')}
                                        placeholder="Select start date"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <DatePicker
                                        value={endDate}
                                        onChange={(value) => setEndDate(value || '')}
                                        placeholder="Select end date"
                                    />
                                </div>
                            </div>

                            {(reportType === 'sales-summary' || reportType === 'customer-report' || reportType === 'purchase-report' || reportType === 'supplier-report') && (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {(reportType === 'sales-summary' || reportType === 'customer-report') && (
                                        <div className="space-y-2">
                                            <Label>Customer</Label>
                                            <Select 
                                                value={customerId || 'all'} 
                                                onValueChange={(value) => setCustomerId(value === 'all' ? null : value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All customers" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All customers</SelectItem>
                                                    {customers.map((customer) => (
                                                        <SelectItem key={customer.id} value={String(customer.id)}>
                                                            {customer.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {(reportType === 'purchase-report' || reportType === 'supplier-report') && (
                                        <div className="space-y-2">
                                            <Label>Supplier</Label>
                                            <Select 
                                                value={supplierId || 'all'} 
                                                onValueChange={(value) => setSupplierId(value === 'all' ? null : value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All suppliers" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All suppliers</SelectItem>
                                                    {suppliers.map((supplier) => (
                                                        <SelectItem key={supplier.id} value={String(supplier.id)}>
                                                            {supplier.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                                <Button onClick={handleFilterChange} size="lg">
                                    Generate Report
                                </Button>
                                <Button 
                                    onClick={handleExportCSV} 
                                    variant="outline"
                                    size="lg"
                                    className="flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Report Content */}
                {renderReportContent()}
            </div>
        </AppLayout>
    );
}

// Sales Summary Report Component
function SalesSummaryReport({ data }: { data: any }) {
    if (!data) return null;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Sales Summary</CardTitle>
                    <CardDescription>Overview of sales performance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <div className="text-sm text-muted-foreground">Total Revenue</div>
                            <div className="text-2xl font-bold">
                                SBD {Number(data.summary?.total_revenue || 0).toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total Quantity</div>
                            <div className="text-2xl font-bold">
                                {Number(data.summary?.total_quantity || 0).toFixed(2)} kg
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total Sales</div>
                            <div className="text-2xl font-bold">{data.summary?.total_sales || 0}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Average Sale</div>
                            <div className="text-2xl font-bold">
                                SBD {Number(data.summary?.average_sale || 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {data.daily_data && data.daily_data.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Sales Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={salesConfig} className="h-[300px] w-full">
                            <LineChart accessibilityLayer data={data.daily_data}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    width={60}
                                    tickFormatter={(value) => {
                                        if (value >= 1000) return `SBD ${(value / 1000).toFixed(1)}k`;
                                        return `SBD ${Math.round(value)}`;
                                    }}
                                />
                                <ChartTooltip 
                                    content={<ChartTooltipContent 
                                        formatter={(value) => `SBD ${Number(value).toFixed(2)}`}
                                    />}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="var(--color-revenue)"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}

            {data.recent_sales && data.recent_sales.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.recent_sales.map((sale: any) => (
                                    <TableRow key={sale.id}>
                                        <TableCell>{sale.date}</TableCell>
                                        <TableCell className="font-medium">{sale.customer}</TableCell>
                                        <TableCell>{Number(sale.quantity).toFixed(2)} kg</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            SBD {Number(sale.amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={sale.is_credit ? 'destructive' : 'default'}>
                                                {sale.is_credit ? 'Credit' : 'Cash'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Sales by Customer Report Component
function SalesByCustomerReport({ data }: { data: any }) {
    if (!data || !data.customers) return null;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Sales by Customer</CardTitle>
                    <CardDescription>
                        Total customers: {data.summary?.total_customers || 0} | 
                        Total Revenue: SBD {Number(data.summary?.total_revenue || 0).toFixed(2)}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                                <TableHead className="text-right">Total Quantity</TableHead>
                                <TableHead className="text-right">Sales Count</TableHead>
                                <TableHead className="text-right">Average Sale</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.customers.map((customer: any) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.name}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        SBD {Number(customer.total_revenue).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {Number(customer.total_quantity).toFixed(2)} kg
                                    </TableCell>
                                    <TableCell className="text-right">{customer.sale_count}</TableCell>
                                    <TableCell className="text-right">
                                        SBD {Number(customer.average_sale).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// Profit & Loss Report Component
function ProfitLossReport({ data }: { data: any }) {
    if (!data) return null;

    const profit = Number(data.profit || 0);
    const isProfit = profit >= 0;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Profit & Loss Statement</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Total Revenue</div>
                                <div className="text-2xl font-bold">
                                    SBD {Number(data.revenue || 0).toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Total Costs</div>
                                <div className="text-2xl font-bold text-red-600">
                                    SBD {Number(data.costs || 0).toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Total Expenses</div>
                                <div className="text-2xl font-bold text-red-600">
                                    SBD {Number(data.expenses || 0).toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Net Profit</div>
                                <div className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                    {isProfit ? '+' : ''}SBD {Math.abs(profit).toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Margin: {Number(data.profit_margin || 0).toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        {data.expense_breakdown && data.expense_breakdown.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Expense Breakdown</h3>
                                <ChartContainer config={expenseConfig} className="h-[250px] w-full">
                                    <BarChart accessibilityLayer data={data.expense_breakdown}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="type"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            width={60}
                                            tickFormatter={(value) => {
                                                if (value >= 1000) return `SBD ${(value / 1000).toFixed(1)}k`;
                                                return `SBD ${Math.round(value)}`;
                                            }}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent 
                                            formatter={(value) => `SBD ${Number(value).toFixed(2)}`}
                                        />} />
                                        <Bar dataKey="total" radius={4}>
                                            {data.expense_breakdown.map((entry: any, index: number) => {
                                                const type = entry.type as keyof typeof expenseConfig;
                                                const color = expenseConfig[type]?.color || '#8b5cf6';
                                                return <Cell key={`cell-${index}`} fill={color} />;
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Outstanding Credits Report Component
function OutstandingCreditsReport({ data }: { data: any }) {
    if (!data || !data.credits) return null;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Outstanding Credits</CardTitle>
                    <CardDescription>
                        Total Outstanding: SBD {Number(data.summary?.total_outstanding || 0).toFixed(2)} | 
                        Count: {data.summary?.count || 0} | 
                        Avg Days: {data.summary?.average_days || 0}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sale ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Outstanding</TableHead>
                                <TableHead className="text-right">Days</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.credits.map((credit: any) => (
                                <TableRow key={credit.sale_id}>
                                    <TableCell className="font-medium">#{credit.sale_id}</TableCell>
                                    <TableCell>{credit.date}</TableCell>
                                    <TableCell>{credit.customer}</TableCell>
                                    <TableCell className="text-right">
                                        SBD {Number(credit.total).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        SBD {Number(credit.paid).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-destructive">
                                        SBD {Number(credit.outstanding).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={credit.days_outstanding > 30 ? 'destructive' : 'default'}>
                                            {credit.days_outstanding} days
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// Expense Report Component
function ExpenseReport({ data }: { data: any }) {
    if (!data) return null;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Expense Report</CardTitle>
                    <CardDescription>
                        Total: SBD {Number(data.summary?.total || 0).toFixed(2)} | 
                        Count: {data.summary?.count || 0}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.daily_data && data.daily_data.length > 0 && (
                        <div className="mb-6">
                            <ChartContainer config={expenseConfig} className="h-[250px] w-full">
                                <LineChart accessibilityLayer data={data.daily_data}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        width={60}
                                        tickFormatter={(value) => {
                                            if (value >= 1000) return `SBD ${(value / 1000).toFixed(1)}k`;
                                            return `SBD ${Math.round(value)}`;
                                        }}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent 
                                        formatter={(value) => `SBD ${Number(value).toFixed(2)}`}
                                    />} />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    )}

                    {data.expenses && data.expenses.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.expenses.map((expense: any) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{expense.date}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{expense.type}</Badge>
                                        </TableCell>
                                        <TableCell>{expense.description}</TableCell>
                                        <TableCell>{expense.supplier || '-'}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            SBD {Number(expense.amount).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Purchase Report Component
function PurchaseReport({ data }: { data: any }) {
    if (!data) return null;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Purchase Report</CardTitle>
                    <CardDescription>
                        Total Cost: SBD {Number(data.summary?.total_cost || 0).toFixed(2)} | 
                        Total Quantity: {Number(data.summary?.total_quantity || 0).toFixed(2)} kg | 
                        Count: {data.summary?.count || 0}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.by_supplier && data.by_supplier.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold mb-4">Purchases by Supplier</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead className="text-right">Total Cost</TableHead>
                                        <TableHead className="text-right">Total Quantity</TableHead>
                                        <TableHead className="text-right">Purchase Count</TableHead>
                                        <TableHead className="text-right">Avg Price/kg</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.by_supplier.map((supplier: any) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell className="font-medium">{supplier.name}</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                SBD {Number(supplier.total_cost).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {Number(supplier.total_quantity).toFixed(2)} kg
                                            </TableCell>
                                            <TableCell className="text-right">{supplier.purchase_count}</TableCell>
                                            <TableCell className="text-right">
                                                SBD {Number(supplier.average_price).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {data.purchases && data.purchases.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold mb-4">Recent Purchases</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead className="text-right">Price/kg</TableHead>
                                        <TableHead className="text-right">Total Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.purchases.map((purchase: any) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell>{purchase.date}</TableCell>
                                            <TableCell className="font-medium">{purchase.supplier}</TableCell>
                                            <TableCell className="text-right">
                                                {Number(purchase.quantity).toFixed(2)} kg
                                            </TableCell>
                                            <TableCell className="text-right">
                                                SBD {Number(purchase.price_per_kg).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                SBD {Number(purchase.total_cost).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Stock Report Component
function StockReport({ data }: { data: any }) {
    if (!data) return null;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Stock Report</CardTitle>
                    <CardDescription>
                        Current Stock: {Number(data.current_stock || 0).toFixed(2)} kg
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Supplier</TableHead>
                                <TableHead className="text-right">Remaining Stock</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.by_supplier && data.by_supplier.length > 0 ? (
                                data.by_supplier.map((supplier: any) => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {Number(supplier.remaining_stock).toFixed(2)} kg
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                                        No stock data available
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// Customer Report Component
function CustomerReport({ data }: { data: any }) {
    if (!data) return null;

    if (data.customer) {
        // Single customer detail view
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <div className="text-sm text-muted-foreground">Name</div>
                                <div className="text-lg font-semibold">{data.customer.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Email</div>
                                <div className="text-lg">{data.customer.email || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Phone</div>
                                <div className="text-lg">{data.customer.phone || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Type</div>
                                <div className="text-lg">
                                    <Badge>{data.customer.type}</Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Total Sales</div>
                                <div className="text-2xl font-bold">{data.summary?.total_sales || 0}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Total Revenue</div>
                                <div className="text-2xl font-bold">
                                    SBD {Number(data.summary?.total_revenue || 0).toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Outstanding Credits</div>
                                <div className="text-2xl font-bold text-destructive">
                                    SBD {Number(data.summary?.outstanding_credits || 0).toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Credit Sales</div>
                                <div className="text-2xl font-bold">{data.summary?.credit_count || 0}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {data.recent_sales && data.recent_sales.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Outstanding</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.recent_sales.map((sale: any) => (
                                        <TableRow key={sale.id}>
                                            <TableCell>{sale.date}</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                SBD {Number(sale.amount).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {Number(sale.quantity).toFixed(2)} kg
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={sale.is_credit ? 'destructive' : 'default'}>
                                                    {sale.is_credit ? 'Credit' : 'Cash'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {sale.outstanding > 0 ? (
                                                    <span className="text-destructive font-semibold">
                                                        SBD {Number(sale.outstanding).toFixed(2)}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    // Customer list view
    return (
        <Card>
            <CardHeader>
                <CardTitle>All Customers</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Total Sales</TableHead>
                            <TableHead className="text-right">Total Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.customers && data.customers.length > 0 ? (
                            data.customers.map((customer: any) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.name}</TableCell>
                                    <TableCell>{customer.email || '-'}</TableCell>
                                    <TableCell>{customer.phone || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{customer.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{customer.total_sales}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        SBD {Number(customer.total_revenue).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No customers found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// Supplier Report Component
function SupplierReport({ data }: { data: any }) {
    if (!data) return null;

    if (data.supplier) {
        // Single supplier detail view
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <div className="text-sm text-muted-foreground">Name</div>
                                <div className="text-lg font-semibold">{data.supplier.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Email</div>
                                <div className="text-lg">{data.supplier.email || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Phone</div>
                                <div className="text-lg">{data.supplier.phone || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Address</div>
                                <div className="text-lg">{data.supplier.address || '-'}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Total Purchases</div>
                                <div className="text-2xl font-bold">{data.summary?.total_purchases || 0}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Total Cost</div>
                                <div className="text-2xl font-bold">
                                    SBD {Number(data.summary?.total_cost || 0).toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Total Quantity</div>
                                <div className="text-2xl font-bold">
                                    {Number(data.summary?.total_quantity || 0).toFixed(2)} kg
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Remaining Stock</div>
                                <div className="text-2xl font-bold">
                                    {Number(data.summary?.remaining_stock || 0).toFixed(2)} kg
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {data.recent_purchases && data.recent_purchases.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Purchases</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead className="text-right">Price/kg</TableHead>
                                        <TableHead className="text-right">Total Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.recent_purchases.map((purchase: any) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell>{purchase.date}</TableCell>
                                            <TableCell className="text-right">
                                                {Number(purchase.quantity).toFixed(2)} kg
                                            </TableCell>
                                            <TableCell className="text-right">
                                                SBD {Number(purchase.price_per_kg).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                SBD {Number(purchase.total_cost).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    // Supplier list view
    return (
        <Card>
            <CardHeader>
                <CardTitle>All Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-right">Total Purchases</TableHead>
                            <TableHead className="text-right">Total Cost</TableHead>
                            <TableHead className="text-right">Remaining Stock</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.suppliers && data.suppliers.length > 0 ? (
                            data.suppliers.map((supplier: any) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">{supplier.name}</TableCell>
                                    <TableCell>{supplier.email || '-'}</TableCell>
                                    <TableCell>{supplier.phone || '-'}</TableCell>
                                    <TableCell className="text-right">{supplier.total_purchases}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        SBD {Number(supplier.total_cost).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {Number(supplier.remaining_stock).toFixed(2)} kg
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No suppliers found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

