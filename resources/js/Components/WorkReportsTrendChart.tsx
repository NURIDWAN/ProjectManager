import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { EmptyState } from '@/Components/EmptyState';
import { FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface MonthlyWorkReportEntry {
    month: string;
    count: number;
}

interface WorkReportsTrendChartProps {
    data: MonthlyWorkReportEntry[];
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

function formatMonthLabel(month: string): string {
    const parts = month.split('-');
    if (parts.length === 2) {
        return monthNames[parts[1]] || parts[1];
    }
    return month;
}

const chartConfig = {
    count: {
        label: 'Pekerjaan',
        color: 'var(--chart-2)',
    },
} satisfies ChartConfig;

export function WorkReportsTrendChart({ data, isLoading = false }: WorkReportsTrendChartProps) {
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

    const totalReports = data.reduce((sum, item) => sum + item.count, 0);

    if (totalReports === 0) {
        return (
            <Card className="min-w-0">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Tren Volume Pekerjaan (12 Bulan)</CardTitle>
                    <CardDescription className="text-sm">Laporan kerja yang diselesaikan oleh teknisi.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        title="Belum ada data laporan kerja"
                        description="Laporan kerja berstatus submitted akan tercatat di grafik ini."
                        icon={<FileText className="size-5" />}
                        className="min-h-72"
                    />
                </CardContent>
            </Card>
        );
    }

    const chartData = data.map((item) => ({
        ...item,
        label: formatMonthLabel(item.month),
    }));

    // Trend comparison
    const lastMonth = data[data.length - 1]?.count ?? 0;
    const previousMonth = data[data.length - 2]?.count ?? 0;
    const diff = lastMonth - previousMonth;

    return (
        <Card className="min-w-0">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                        Tren Volume Pekerjaan (12 Bulan)
                    </CardTitle>
                    <CardDescription className="text-sm">
                        Total: {totalReports} laporan diselesaikan
                    </CardDescription>
                </div>
                {previousMonth > 0 && (
                    <div
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                            diff >= 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                        }`}
                    >
                        {diff >= 0 ? (
                            <TrendingUp className="size-3.5" />
                        ) : (
                            <TrendingDown className="size-3.5" />
                        )}
                        {diff >= 0 ? '+' : ''}
                        {diff} vs bln lalu
                    </div>
                )}
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[260px] w-full"
                >
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={35}
                            allowDecimals={false}
                            tick={{ fontSize: 11 }}
                        />
                        <ChartTooltip
                            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => `Bulan: ${String(value)}`}
                                    formatter={(value) => (
                                        <div className="flex min-w-[120px] items-center gap-2 text-xs">
                                            <div className="size-2 rounded-full bg-[--color-count]" />
                                            <span className="text-muted-foreground">Pekerjaan</span>
                                            <span className="ml-auto font-mono font-medium text-foreground">
                                                {value} laporan
                                            </span>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <Bar
                            dataKey="count"
                            fill="var(--color-count)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={36}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
