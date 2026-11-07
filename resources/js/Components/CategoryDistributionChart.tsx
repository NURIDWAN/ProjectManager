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
import { Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface CategoryDistributionEntry {
    category: string;
    count: number;
}

interface CategoryDistributionChartProps {
    data: CategoryDistributionEntry[];
    isLoading?: boolean;
}

const chartConfig = {
    count: {
        label: 'Jumlah Pekerjaan',
        color: 'var(--chart-3)',
    },
} satisfies ChartConfig;

export function CategoryDistributionChart({ data, isLoading = false }: CategoryDistributionChartProps) {
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

    const totalJobs = data.reduce((sum, item) => sum + item.count, 0);

    if (data.length === 0 || totalJobs === 0) {
        return (
            <Card className="min-w-0">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Distribusi Kategori Pekerjaan</CardTitle>
                    <CardDescription className="text-sm">Proporsi jenis layanan yang dikerjakan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        title="Belum ada data kategori"
                        description="Data akan muncul setelah laporan kerja selesai dan disubmit."
                        icon={<Layers className="size-5" />}
                        className="min-h-72"
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="min-w-0">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                        Distribusi Kategori Pekerjaan
                    </CardTitle>
                    <CardDescription className="text-sm">
                        Total {totalJobs} pekerjaan dari {data.length} kategori
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[260px] w-full"
                >
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                        <YAxis
                            dataKey="category"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={110}
                            tick={{ fontSize: 12 }}
                        />
                        <XAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                            tick={{ fontSize: 11 }}
                        />
                        <ChartTooltip
                            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
                            content={
                                <ChartTooltipContent
                                    formatter={(value, name, item) => {
                                        const count = Number(value);
                                        const pct = totalJobs > 0 ? ((count / totalJobs) * 100).toFixed(1) : '0';
                                        return (
                                            <div className="flex min-w-[140px] items-center justify-between gap-3 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="size-2 rounded-full bg-[--color-count]" />
                                                    <span className="text-muted-foreground">{item?.payload?.category}</span>
                                                </div>
                                                <span className="font-mono font-medium text-foreground">
                                                    {count} ({pct}%)
                                                </span>
                                            </div>
                                        );
                                    }}
                                />
                            }
                        />
                        <Bar
                            dataKey="count"
                            fill="var(--color-count)"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={28}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
