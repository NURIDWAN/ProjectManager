import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyRevenueData {
    month: string;
    total: number;
}

interface RevenueChartProps {
    data: MonthlyRevenueData[];
    isLoading?: boolean;
}

const monthNames: Record<string, string> = {
    '01': 'Jan',
    '02': 'Feb',
    '03': 'Mar',
    '04': 'Apr',
    '05': 'Mei',
    '06': 'Jun',
    '07': 'Jul',
    '08': 'Agu',
    '09': 'Sep',
    '10': 'Okt',
    '11': 'Nov',
    '12': 'Des',
};

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
}

function formatRupiahShort(value: number): string {
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}jt`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(0)}rb`;
    }
    return `${value}`;
}

function formatMonthLabel(month: string): string {
    const parts = month.split('-');
    if (parts.length === 2) {
        return monthNames[parts[1]] || parts[1];
    }
    return month;
}

const chartConfig = {
    total: {
        label: 'Pendapatan',
        color: 'hsl(var(--primary))',
    },
} satisfies ChartConfig;

export function RevenueChart({ data, isLoading = false }: RevenueChartProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[280px] w-full" />
                </CardContent>
            </Card>
        );
    }

    const chartData = data.map((item) => ({
        ...item,
        label: formatMonthLabel(item.month),
    }));

    // Calculate trend (compare last month to previous month)
    const lastMonth = data[data.length - 1]?.total ?? 0;
    const previousMonth = data[data.length - 2]?.total ?? 0;
    const trendPercent =
        previousMonth > 0
            ? ((lastMonth - previousMonth) / previousMonth) * 100
            : 0;
    const isPositiveTrend = trendPercent >= 0;

    // Calculate total revenue for the period
    const totalRevenue = data.reduce((sum, entry) => sum + entry.total, 0);

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                        Pendapatan 12 Bulan Terakhir
                    </CardTitle>
                    <CardDescription className="text-sm">
                        Total: {formatRupiah(totalRevenue)}
                    </CardDescription>
                </div>
                {previousMonth > 0 && (
                    <div
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                            isPositiveTrend
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                        }`}
                    >
                        {isPositiveTrend ? (
                            <TrendingUp className="size-3.5" />
                        ) : (
                            <TrendingDown className="size-3.5" />
                        )}
                        {isPositiveTrend ? '+' : ''}
                        {trendPercent.toFixed(1)}%
                    </div>
                )}
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[280px] w-full"
                >
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-total)"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-total)"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            tickFormatter={formatRupiahShort}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={60}
                            tick={{ fontSize: 11 }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => `Bulan: ${String(value)}`}
                                    formatter={(value) => (
                                        <div className="flex min-w-[120px] items-center gap-2 text-xs">
                                            <div
                                                className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-total]"
                                                style={{ '--color-total': 'var(--color-total)' } as React.CSSProperties}
                                            />
                                            <span className="text-muted-foreground">Pendapatan</span>
                                            <span className="ml-auto font-mono font-medium text-foreground">
                                                {formatRupiah(value as number)}
                                            </span>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="var(--color-total)"
                            strokeWidth={2.5}
                            fill="url(#fillRevenue)"
                            dot={false}
                            activeDot={{
                                r: 5,
                                fill: 'var(--color-total)',
                                stroke: 'hsl(var(--background))',
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
