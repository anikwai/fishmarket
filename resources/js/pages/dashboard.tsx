'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    BarChart3,
    CreditCard,
    DollarSign,
    Info,
    Package,
    PieChart,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Label,
    Line,
    LineChart,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
    XAxis,
    YAxis,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    currentStock: number | string;
    recentSales: Array<{
        id: number;
        sale_date: string;
        total_amount: number | string;
        customer: {
            name: string;
        };
    }>;
    outstandingCredits: Array<{
        sale_id: number;
        customer: string;
        total: number | string;
        paid: number | string;
        outstanding: number | string;
    }>;
    monthlyComparison: Array<{
        month: string;
        revenue: number;
        cost: number;
    }>;
    expenseBreakdown: Array<{
        type: string;
        total: number;
    }>;
    dailySalesData: Array<{
        date: string;
        revenue: number;
        quantity: number;
    }>;
    supplierStockData?: Array<{
        name: string;
        value: number;
    }>;
    summary: {
        totalRevenue: number | string;
        totalCosts: number | string;
        totalExpenses: number | string;
        netProfit: number | string;
        thisMonthRevenue: number | string;
        thisMonthCosts: number | string;
        thisMonthExpenses: number | string;
        thisMonthProfit: number | string;
        totalSales: number;
        totalPurchases: number;
        totalCustomers: number;
        totalSuppliers: number;
    };
}

const revenueCostConfig = {
    revenue: {
        label: 'Revenue',
        color: '#22c55e',
    },
    cost: {
        label: 'Cost',
        color: '#ef4444',
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

const salesConfig = {
    revenue: {
        label: 'Revenue',
        color: '#22c55e',
    },
} satisfies ChartConfig;

// Generate colors for supplier stock chart
const generateSupplierColors = (count: number): string[] => {
    const colors = [
        '#3b82f6', // blue
        '#22c55e', // green
        '#ef4444', // red
        '#f59e0b', // amber
        '#8b5cf6', // purple
        '#06b6d4', // cyan
        '#ec4899', // pink
        '#84cc16', // lime
        '#f97316', // orange
        '#6366f1', // indigo
    ];
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

export default function Dashboard({
    currentStock,
    recentSales,
    outstandingCredits,
    monthlyComparison = [],
    expenseBreakdown = [],
    dailySalesData = [],
    supplierStockData = [],
    summary = {
        totalRevenue: 0,
        totalCosts: 0,
        totalExpenses: 0,
        netProfit: 0,
        thisMonthRevenue: 0,
        thisMonthCosts: 0,
        thisMonthExpenses: 0,
        thisMonthProfit: 0,
        totalSales: 0,
        totalPurchases: 0,
        totalCustomers: 0,
        totalSuppliers: 0,
    },
}: DashboardProps) {
    const totalOutstandingCredits = outstandingCredits.reduce(
        (sum, credit) => sum + Number(credit.outstanding),
        0,
    );

    const netProfitValue = Number(summary.netProfit);
    const thisMonthProfitValue = Number(summary.thisMonthProfit);
    const totalRevenueValue = Number(summary.totalRevenue);
    const thisMonthRevenueValue = Number(summary.thisMonthRevenue);

    // Transform supplier stock data for radial chart
    const radialChartData =
        supplierStockData.length > 0
            ? [
                  supplierStockData.reduce(
                      (acc, item, index) => {
                          acc[`supplier_${index}`] = item.value;
                          return acc;
                      },
                      {} as Record<string, number>,
                  ),
              ]
            : [];

    // Calculate profit margin percentage
    const profitMargin =
        totalRevenueValue > 0
            ? ((netProfitValue / totalRevenueValue) * 100).toFixed(1)
            : '0.0';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Overview of your fish shop business performance
                        </p>
                    </div>
                    {totalOutstandingCredits > 0 && (
                        <Alert variant="destructive" className="w-fit">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Outstanding Credits</AlertTitle>
                            <AlertDescription>
                                SBD {totalOutstandingCredits.toFixed(2)}{' '}
                                requires attention
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Key Financial Metrics */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            Financial Overview
                        </h2>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Financial metrics calculated from all-time
                                    sales, costs, and expenses
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Revenue
                                </CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DollarSign className="h-4 w-4 cursor-help text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>All-time cumulative sales revenue</p>
                                    </TooltipContent>
                                </Tooltip>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    SBD {totalRevenueValue.toFixed(2)}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground">
                                        All-time sales revenue
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {profitMargin}% margin
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Net Profit
                                </CardTitle>
                                {netProfitValue >= 0 ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <TrendingUp className="h-4 w-4 cursor-help text-green-600" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Total profit after costs and
                                                expenses
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <TrendingDown className="h-4 w-4 cursor-help text-red-600" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Total loss after costs and
                                                expenses
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`text-2xl font-bold ${netProfitValue >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                    {netProfitValue >= 0 ? '+' : ''}SBD{' '}
                                    {Math.abs(netProfitValue).toFixed(2)}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground">
                                        Revenue - Costs - Expenses
                                    </p>
                                    <Badge
                                        variant={
                                            netProfitValue >= 0
                                                ? 'default'
                                                : 'destructive'
                                        }
                                        className="text-xs"
                                    >
                                        {netProfitValue >= 0
                                            ? 'Profit'
                                            : 'Loss'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    This Month Revenue
                                </CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DollarSign className="h-4 w-4 cursor-help text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Sales revenue for the current month
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    SBD {thisMonthRevenueValue.toFixed(2)}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Current month sales
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    This Month Profit
                                </CardTitle>
                                {thisMonthProfitValue >= 0 ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <TrendingUp className="h-4 w-4 cursor-help text-green-600" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Profit for the current month</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <TrendingDown className="h-4 w-4 cursor-help text-red-600" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Loss for the current month</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`text-2xl font-bold ${thisMonthProfitValue >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                    {thisMonthProfitValue >= 0 ? '+' : ''}SBD{' '}
                                    {Math.abs(thisMonthProfitValue).toFixed(2)}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground">
                                        Current month performance
                                    </p>
                                    <Badge
                                        variant={
                                            thisMonthProfitValue >= 0
                                                ? 'default'
                                                : 'destructive'
                                        }
                                        className="text-xs"
                                    >
                                        {thisMonthProfitValue >= 0
                                            ? 'Profit'
                                            : 'Loss'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Operational Metrics */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold">
                        Operational Overview
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Current Stock
                                </CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {Number(currentStock).toFixed(2)} kg
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Available fish stock
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Sales
                                </CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary.totalSales}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    All-time transactions
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Outstanding Credits
                                </CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-destructive">
                                    SBD {totalOutstandingCredits.toFixed(2)}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {outstandingCredits.length} unpaid sale
                                    {outstandingCredits.length !== 1 ? 's' : ''}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Customers
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary.totalCustomers}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {summary.totalSuppliers} suppliers
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Charts Section */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            Analytics & Trends
                        </h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3 lg:items-stretch">
                        {/* Sales Section */}
                        <div className="flex flex-col gap-4">
                            <Card className="flex flex-1 flex-col">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Activity className="h-4 w-4" />
                                        Daily Sales Revenue
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Last 30 days revenue trend
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {dailySalesData.length > 0 ? (
                                        <ChartContainer
                                            config={salesConfig}
                                            className="h-[250px] w-full"
                                        >
                                            <LineChart
                                                accessibilityLayer
                                                data={dailySalesData}
                                            >
                                                <CartesianGrid
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey="date"
                                                    tickLine={false}
                                                    tickMargin={10}
                                                    axisLine={false}
                                                    tickFormatter={(value) => {
                                                        const date = new Date(
                                                            value,
                                                        );
                                                        return date.toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                            },
                                                        );
                                                    }}
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={8}
                                                    width={60}
                                                    tickFormatter={(value) => {
                                                        if (
                                                            value == null ||
                                                            isNaN(value)
                                                        )
                                                            return 'SBD 0';
                                                        if (value >= 1000) {
                                                            return `SBD ${(value / 1000).toFixed(1)}k`;
                                                        }
                                                        return `SBD ${Math.round(value)}`;
                                                    }}
                                                />
                                                <ChartTooltip
                                                    content={
                                                        <ChartTooltipContent
                                                            formatter={(
                                                                value,
                                                            ) => {
                                                                const numValue =
                                                                    Number(
                                                                        value,
                                                                    );
                                                                return `SBD ${numValue.toFixed(2)}`;
                                                            }}
                                                        />
                                                    }
                                                    labelFormatter={(value) => {
                                                        const date = new Date(
                                                            value,
                                                        );
                                                        return date.toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                weekday: 'long',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            },
                                                        );
                                                    }}
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
                                    ) : (
                                        <Empty className="h-[200px]">
                                            <EmptyMedia variant="icon">
                                                <BarChart3 className="h-6 w-6" />
                                            </EmptyMedia>
                                            <EmptyHeader>
                                                <EmptyTitle className="text-sm">
                                                    No Sales Data
                                                </EmptyTitle>
                                                <EmptyDescription className="text-xs">
                                                    No sales data available for
                                                    the last 30 days
                                                </EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    )}
                                </CardContent>
                            </Card>

                            {monthlyComparison.length > 0 && (
                                <Card className="flex flex-1 flex-col">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">
                                            Monthly Revenue vs Costs
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Compare revenue and costs over time
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer
                                            config={revenueCostConfig}
                                            className="h-[250px] w-full"
                                        >
                                            <BarChart
                                                accessibilityLayer
                                                data={monthlyComparison}
                                            >
                                                <CartesianGrid
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey="month"
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
                                                        if (
                                                            value == null ||
                                                            isNaN(value)
                                                        )
                                                            return 'SBD 0';
                                                        if (value >= 1000) {
                                                            return `SBD ${(value / 1000).toFixed(1)}k`;
                                                        }
                                                        return `SBD ${Math.round(value)}`;
                                                    }}
                                                />
                                                <ChartTooltip
                                                    content={
                                                        <ChartTooltipContent
                                                            formatter={(
                                                                value,
                                                            ) => {
                                                                const numValue =
                                                                    Number(
                                                                        value,
                                                                    );
                                                                return `SBD ${numValue.toFixed(2)}`;
                                                            }}
                                                        />
                                                    }
                                                />
                                                <Bar
                                                    dataKey="revenue"
                                                    radius={4}
                                                >
                                                    {monthlyComparison.map(
                                                        (entry, index) => (
                                                            <Cell
                                                                key={`revenue-cell-${index}`}
                                                                fill="#22c55e"
                                                            />
                                                        ),
                                                    )}
                                                </Bar>
                                                <Bar dataKey="cost" radius={4}>
                                                    {monthlyComparison.map(
                                                        (entry, index) => (
                                                            <Cell
                                                                key={`cost-cell-${index}`}
                                                                fill="#ef4444"
                                                            />
                                                        ),
                                                    )}
                                                </Bar>
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Expenses Section */}
                        <div className="flex flex-col">
                            {expenseBreakdown.length > 0 ? (
                                <Card className="flex h-full flex-col">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <BarChart3 className="h-4 w-4" />
                                            Expense Breakdown
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Spending by category
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-1 items-center">
                                        <ChartContainer
                                            config={expenseConfig}
                                            className="h-[250px] w-full"
                                        >
                                            <BarChart
                                                accessibilityLayer
                                                data={expenseBreakdown}
                                            >
                                                <CartesianGrid
                                                    vertical={false}
                                                />
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
                                                        if (
                                                            value == null ||
                                                            isNaN(value)
                                                        )
                                                            return 'SBD 0';
                                                        if (value >= 1000) {
                                                            return `SBD ${(value / 1000).toFixed(1)}k`;
                                                        }
                                                        return `SBD ${Math.round(value)}`;
                                                    }}
                                                />
                                                <ChartTooltip
                                                    content={
                                                        <ChartTooltipContent
                                                            formatter={(
                                                                value,
                                                            ) => {
                                                                const numValue =
                                                                    Number(
                                                                        value,
                                                                    );
                                                                return `SBD ${numValue.toFixed(2)}`;
                                                            }}
                                                        />
                                                    }
                                                />
                                                <Bar dataKey="total" radius={4}>
                                                    {expenseBreakdown.map(
                                                        (entry, index) => {
                                                            const type =
                                                                entry.type as keyof typeof expenseConfig;
                                                            const color =
                                                                expenseConfig[
                                                                    type
                                                                ]?.color ||
                                                                '#8b5cf6';
                                                            return (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={color}
                                                                />
                                                            );
                                                        },
                                                    )}
                                                </Bar>
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="flex h-full flex-col">
                                    <CardContent className="flex flex-1 items-center justify-center pt-6">
                                        <Empty className="h-[200px]">
                                            <EmptyMedia variant="icon">
                                                <BarChart3 className="h-6 w-6" />
                                            </EmptyMedia>
                                            <EmptyHeader>
                                                <EmptyTitle className="text-sm">
                                                    No Expense Data
                                                </EmptyTitle>
                                                <EmptyDescription className="text-xs">
                                                    No expense data available to
                                                    display
                                                </EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Stock Section */}
                        <div className="flex flex-col">
                            {supplierStockData.length > 0 ? (
                                <Card className="flex h-full flex-col">
                                    <CardHeader className="items-center pb-2">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <PieChart className="h-4 w-4" />
                                            Stock by Supplier
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Remaining stock distribution
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-1 items-center justify-center pb-2">
                                        <ChartContainer
                                            config={{}}
                                            className="mx-auto aspect-square w-full max-w-[250px]"
                                        >
                                            <RadialBarChart
                                                data={radialChartData}
                                                endAngle={180}
                                                innerRadius={80}
                                                outerRadius={130}
                                            >
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={
                                                        <ChartTooltipContent
                                                            hideLabel
                                                            formatter={(
                                                                value,
                                                            ) => {
                                                                const numValue =
                                                                    Number(
                                                                        value,
                                                                    );
                                                                return `${numValue.toFixed(2)} kg`;
                                                            }}
                                                        />
                                                    }
                                                />
                                                <PolarRadiusAxis
                                                    tick={false}
                                                    tickLine={false}
                                                    axisLine={false}
                                                >
                                                    <Label
                                                        content={({
                                                            viewBox,
                                                        }) => {
                                                            if (
                                                                viewBox &&
                                                                'cx' in
                                                                    viewBox &&
                                                                'cy' in viewBox
                                                            ) {
                                                                const totalStock =
                                                                    supplierStockData.reduce(
                                                                        (
                                                                            sum,
                                                                            item,
                                                                        ) =>
                                                                            sum +
                                                                            item.value,
                                                                        0,
                                                                    );
                                                                return (
                                                                    <text
                                                                        x={
                                                                            viewBox.cx
                                                                        }
                                                                        y={
                                                                            viewBox.cy
                                                                        }
                                                                        textAnchor="middle"
                                                                    >
                                                                        <tspan
                                                                            x={
                                                                                viewBox.cx
                                                                            }
                                                                            y={
                                                                                (viewBox.cy ||
                                                                                    0) -
                                                                                12
                                                                            }
                                                                            className="fill-foreground text-xl font-bold"
                                                                        >
                                                                            {totalStock.toFixed(
                                                                                2,
                                                                            )}
                                                                        </tspan>
                                                                        <tspan
                                                                            x={
                                                                                viewBox.cx
                                                                            }
                                                                            y={
                                                                                (viewBox.cy ||
                                                                                    0) +
                                                                                4
                                                                            }
                                                                            className="fill-muted-foreground text-xs"
                                                                        >
                                                                            kg
                                                                        </tspan>
                                                                    </text>
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </PolarRadiusAxis>
                                                {supplierStockData.map(
                                                    (entry, index) => {
                                                        const colors =
                                                            generateSupplierColors(
                                                                supplierStockData.length,
                                                            );
                                                        return (
                                                            <RadialBar
                                                                key={`radial-${index}`}
                                                                dataKey={`supplier_${index}`}
                                                                stackId="a"
                                                                cornerRadius={5}
                                                                fill={
                                                                    colors[
                                                                        index
                                                                    ]
                                                                }
                                                                className="stroke-transparent stroke-2"
                                                            />
                                                        );
                                                    },
                                                )}
                                            </RadialBarChart>
                                        </ChartContainer>
                                    </CardContent>
                                    <CardContent className="pt-2">
                                        <div className="flex flex-wrap justify-center gap-3 text-xs">
                                            {supplierStockData.map(
                                                (entry, index) => {
                                                    const colors =
                                                        generateSupplierColors(
                                                            supplierStockData.length,
                                                        );
                                                    const totalStock =
                                                        supplierStockData.reduce(
                                                            (sum, item) =>
                                                                sum +
                                                                item.value,
                                                            0,
                                                        );
                                                    const percentage = (
                                                        (entry.value /
                                                            totalStock) *
                                                        100
                                                    ).toFixed(1);
                                                    return (
                                                        <div
                                                            key={`legend-${index}`}
                                                            className="flex items-center gap-1.5"
                                                        >
                                                            <div
                                                                className="h-2.5 w-2.5 rounded-sm"
                                                                style={{
                                                                    backgroundColor:
                                                                        colors[
                                                                            index
                                                                        ],
                                                                }}
                                                            />
                                                            <span className="text-muted-foreground">
                                                                {entry.name}:{' '}
                                                                {entry.value.toFixed(
                                                                    2,
                                                                )}{' '}
                                                                kg ({percentage}
                                                                %)
                                                            </span>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="flex h-full flex-col">
                                    <CardContent className="flex flex-1 items-center justify-center pt-6">
                                        <Empty className="h-[200px]">
                                            <EmptyMedia variant="icon">
                                                <PieChart className="h-6 w-6" />
                                            </EmptyMedia>
                                            <EmptyHeader>
                                                <EmptyTitle className="text-sm">
                                                    No Stock Data
                                                </EmptyTitle>
                                                <EmptyDescription className="text-xs">
                                                    No supplier stock data
                                                    available to display
                                                </EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Activity with Tables */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold">
                        Recent Activity
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Sales</CardTitle>
                                <CardDescription>
                                    Latest {recentSales.length} sales
                                    transactions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {recentSales.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">
                                                    Amount
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentSales.map((sale) => (
                                                <TableRow key={sale.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                                            {sale.customer.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(
                                                            sale.sale_date,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        SBD{' '}
                                                        {Number(
                                                            sale.total_amount,
                                                        ).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <Empty className="h-[200px]">
                                        <EmptyMedia variant="icon">
                                            <ShoppingCart className="h-8 w-8" />
                                        </EmptyMedia>
                                        <EmptyHeader>
                                            <EmptyTitle>
                                                No Recent Sales
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                No recent sales transactions to
                                                display
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Outstanding Credits</CardTitle>
                                <CardDescription>
                                    {outstandingCredits.length > 0
                                        ? `${outstandingCredits.length} unpaid sale${outstandingCredits.length !== 1 ? 's' : ''} requiring attention`
                                        : 'All sales have been paid'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {outstandingCredits.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Progress</TableHead>
                                                <TableHead className="text-right">
                                                    Outstanding
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {outstandingCredits.map(
                                                (credit) => {
                                                    const total = Number(
                                                        credit.total,
                                                    );
                                                    const paid = Number(
                                                        credit.paid,
                                                    );
                                                    const outstanding = Number(
                                                        credit.outstanding,
                                                    );
                                                    const progress =
                                                        total > 0
                                                            ? (paid / total) *
                                                              100
                                                            : 0;

                                                    return (
                                                        <TableRow
                                                            key={credit.sale_id}
                                                        >
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                                                    {
                                                                        credit.customer
                                                                    }
                                                                </div>
                                                                <div className="mt-1 text-xs text-muted-foreground">
                                                                    Sale #
                                                                    {
                                                                        credit.sale_id
                                                                    }
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    <Progress
                                                                        value={
                                                                            progress
                                                                        }
                                                                        className="h-2 w-24"
                                                                    />
                                                                    <div className="text-xs text-muted-foreground">
                                                                        SBD{' '}
                                                                        {paid.toFixed(
                                                                            2,
                                                                        )}{' '}
                                                                        / SBD{' '}
                                                                        {total.toFixed(
                                                                            2,
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="font-semibold text-destructive">
                                                                    SBD{' '}
                                                                    {outstanding.toFixed(
                                                                        2,
                                                                    )}
                                                                </div>
                                                                <Badge
                                                                    variant="destructive"
                                                                    className="mt-1 text-xs"
                                                                >
                                                                    Outstanding
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                },
                                            )}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <Empty className="h-[200px]">
                                        <EmptyMedia variant="icon">
                                            <CreditCard className="h-8 w-8" />
                                        </EmptyMedia>
                                        <EmptyHeader>
                                            <EmptyTitle>
                                                No Outstanding Credits
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                All sales have been paid in full
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
