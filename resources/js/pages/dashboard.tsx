'use client';

import { RecentSale, RecentSales } from '@/components/dashboard/recent-sales';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    Package,
    ShoppingCart,
    Wallet,
} from 'lucide-react';
import * as React from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Label,
    Pie,
    PieChart as RePieChart,
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
    recentSales: Array<RecentSale>;
    outstandingCredits: Array<{
        sale_id: number;
        customer: string;
        total: number | string;
        paid: number | string;
        outstanding: number | string;
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

const chartConfig = {
    revenue: {
        label: 'Revenue',
        color: 'var(--chart-1)',
    },
    cost: {
        label: 'Cost',
        color: 'var(--chart-2)',
    },
    profit: {
        label: 'Profit',
        color: 'var(--chart-3)',
    },
} satisfies ChartConfig;

const expenseConfig = {
    Shipping: {
        label: 'Shipping',
        color: 'var(--chart-1)',
    },
    Ice: {
        label: 'Ice',
        color: 'var(--chart-2)',
    },
    Other: {
        label: 'Other',
        color: 'var(--chart-3)',
    },
} satisfies ChartConfig;

// Chart colors from theme - ensures consistency across all charts
const CHART_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
];

export default function Dashboard({
    currentStock,
    recentSales,
    outstandingCredits,
    expenseBreakdown = [],
    dailySalesData = [],
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
    // Use data directly from backend - no client-side filtering needed
    const safeDailySalesData = React.useMemo(() => {
        return Array.isArray(dailySalesData) ? dailySalesData : [];
    }, [dailySalesData]);

    const safeExpenseBreakdown = React.useMemo(() => {
        return Array.isArray(expenseBreakdown) ? expenseBreakdown : [];
    }, [expenseBreakdown]);

    const totalOutstandingCredits = outstandingCredits.reduce(
        (sum, credit) => sum + Number(credit.outstanding),
        0,
    );

    const totalExpenses = React.useMemo(() => {
        return safeExpenseBreakdown.reduce(
            (sum, expense) => sum + Number(expense.total),
            0,
        );
    }, [safeExpenseBreakdown]);

    const profitMargin =
        Number(summary.totalRevenue) > 0
            ? (
                  (Number(summary.netProfit) / Number(summary.totalRevenue)) *
                  100
              ).toFixed(1)
            : '0.0';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
                {/* Compact Header Section */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Overview of your fish shop business
                    </p>
                </div>

                {/* Alert Section */}
                {totalOutstandingCredits > 0 && (
                    <Alert className="border-destructive/50 bg-destructive/10">
                        <AlertCircle className="h-4 w-4" />
                        <div className="flex flex-1 items-center justify-between gap-4">
                            <div className="flex-1">
                                <AlertTitle>Outstanding Payments</AlertTitle>
                                <AlertDescription>
                                    <span className="block text-2xl font-bold text-destructive">
                                        SBD {totalOutstandingCredits.toFixed(2)}
                                    </span>
                                    <span className="mt-1 block text-sm">
                                        from {outstandingCredits.length}{' '}
                                        {outstandingCredits.length === 1
                                            ? 'customer'
                                            : 'customers'}
                                    </span>
                                </AlertDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.visit('/sales?is_credit=true')
                                }
                            >
                                View All
                            </Button>
                        </div>
                    </Alert>
                )}

                {/* KPI Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Revenue</CardDescription>
                            <CardTitle className="text-2xl font-bold">
                                SBD {Number(summary.totalRevenue).toFixed(2)}
                            </CardTitle>
                        </CardHeader>
                        <CardFooter>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                                {profitMargin}% profit margin
                            </div>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Net Profit</CardDescription>
                            <CardTitle className="text-2xl font-bold">
                                SBD {Number(summary.netProfit).toFixed(2)}
                            </CardTitle>
                        </CardHeader>
                        <CardFooter>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Wallet className="h-4 w-4" />
                                After costs & expenses
                            </div>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Sales</CardDescription>
                            <CardTitle className="text-2xl font-bold">
                                {summary.totalSales}
                            </CardTitle>
                        </CardHeader>
                        <CardFooter>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ShoppingCart className="h-4 w-4" />
                                {summary.totalCustomers} customers
                            </div>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Current Stock</CardDescription>
                            <CardTitle className="text-2xl font-bold">
                                {Number(currentStock).toFixed(2)}{' '}
                                <span className="text-base font-normal text-muted-foreground">
                                    kg
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardFooter>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Package className="h-4 w-4" />
                                {summary.totalSuppliers} suppliers
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* Main Chart - Full Width for Better Visual Impact */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Analytics</CardTitle>
                        <CardDescription>
                            Daily revenue trend over time
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                        {safeDailySalesData.length > 0 ? (
                            <ChartContainer
                                config={chartConfig}
                                className="aspect-auto h-[350px] w-full"
                            >
                                <AreaChart
                                    data={safeDailySalesData}
                                    margin={{
                                        left: 50,
                                        right: 20,
                                        top: 10,
                                        bottom: 10,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="fillRevenue"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="var(--color-revenue)"
                                                stopOpacity={0.8}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="var(--color-revenue)"
                                                stopOpacity={0.1}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        minTickGap={32}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
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
                                        tickMargin={12}
                                        width={100}
                                        tickFormatter={(value) => {
                                            const formattedValue =
                                                typeof value === 'number'
                                                    ? value.toLocaleString(
                                                          'en-US',
                                                          {
                                                              maximumFractionDigits: 0,
                                                          },
                                                      )
                                                    : value;
                                            return `SBD ${formattedValue}`;
                                        }}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(value) => {
                                                    return new Date(
                                                        value as string,
                                                    ).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        },
                                                    );
                                                }}
                                                indicator="dot"
                                            />
                                        }
                                    />
                                    <Area
                                        dataKey="revenue"
                                        type="natural"
                                        fill="url(#fillRevenue)"
                                        stroke="var(--color-revenue)"
                                        strokeWidth={2}
                                    />
                                    <ChartLegend
                                        content={<ChartLegendContent />}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <p className="text-sm font-medium">
                                        No data available for the selected time
                                        range
                                    </p>
                                    <p className="mt-1 text-xs">
                                        Try selecting a different time period
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Secondary Metrics & Outstanding Credits - 2 Column Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Expenses Breakdown */}
                    <Card className="flex flex-col">
                        <CardHeader className="items-center pb-0">
                            <CardTitle>Expenses Breakdown</CardTitle>
                            <CardDescription>
                                Distribution by expense type
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                            <ChartContainer
                                config={expenseConfig}
                                className="mx-auto aspect-square max-h-[280px]"
                            >
                                <RePieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent hideLabel />
                                        }
                                    />
                                    <Pie
                                        data={safeExpenseBreakdown}
                                        dataKey="total"
                                        nameKey="type"
                                        innerRadius={60}
                                        strokeWidth={5}
                                    >
                                        {safeExpenseBreakdown.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        CHART_COLORS[
                                                            index %
                                                                CHART_COLORS.length
                                                        ]
                                                    }
                                                />
                                            ),
                                        )}
                                        <Label
                                            content={({ viewBox }) => {
                                                if (
                                                    viewBox &&
                                                    'cx' in viewBox &&
                                                    'cy' in viewBox
                                                ) {
                                                    return (
                                                        <text
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                        >
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                className="fill-foreground text-3xl font-bold"
                                                            >
                                                                {totalExpenses.toLocaleString()}
                                                            </tspan>
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={
                                                                    (viewBox.cy ||
                                                                        0) + 24
                                                                }
                                                                className="fill-muted-foreground"
                                                            >
                                                                SBD Total
                                                            </tspan>
                                                        </text>
                                                    );
                                                }
                                            }}
                                        />
                                    </Pie>
                                </RePieChart>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="flex-col gap-2 pt-4 text-sm">
                            <div className="flex flex-wrap justify-center gap-4 text-xs">
                                {safeExpenseBreakdown.map((entry, index) => (
                                    <div
                                        key={entry.type}
                                        className="flex items-center gap-1.5"
                                    >
                                        <div
                                            className="h-2 w-2 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    CHART_COLORS[
                                                        index %
                                                            CHART_COLORS.length
                                                    ],
                                            }}
                                        />
                                        <span className="text-muted-foreground capitalize">
                                            {entry.type}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Outstanding Credits */}
                    {outstandingCredits.length > 0 && (
                        <Card className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Outstanding Credits</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            router.visit('/sales?filter=unpaid')
                                        }
                                        className="h-8 w-8"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                        <span className="sr-only">
                                            View All
                                        </span>
                                    </Button>
                                </div>
                                <CardDescription>
                                    Recent unpaid transactions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-4">
                                    {outstandingCredits
                                        .slice(0, 5)
                                        .map((credit) => {
                                            const total = Number(credit.total);
                                            const paid = Number(credit.paid);
                                            const outstanding = Number(
                                                credit.outstanding,
                                            );
                                            const progress =
                                                total > 0
                                                    ? (paid / total) * 100
                                                    : 0;

                                            return (
                                                <div
                                                    key={credit.sale_id}
                                                    className="space-y-2"
                                                >
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span
                                                            className="max-w-[120px] truncate font-medium"
                                                            title={
                                                                credit.customer
                                                            }
                                                        >
                                                            {credit.customer}
                                                        </span>
                                                        <span className="font-semibold text-destructive">
                                                            SBD{' '}
                                                            {outstanding.toFixed(
                                                                2,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={progress}
                                                        className="h-1.5"
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>
                                                            {Math.round(
                                                                progress,
                                                            )}
                                                            % paid
                                                        </span>
                                                        <span>
                                                            Sale #
                                                            {credit.sale_id}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Recent Transactions - Full Width */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                            Recent Transactions
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.visit('/sales')}
                        >
                            View All <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                    </div>
                    <RecentSales data={recentSales} />
                </div>
            </div>
        </AppLayout>
    );
}
