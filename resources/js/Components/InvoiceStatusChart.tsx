import * as React from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { EmptyState } from '@/Components/EmptyState';
import { Receipt } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface InvoiceStatusEntry {
    status: string;
    label: string;
    color: string;
    count: number;
    total: number;
}

interface InvoiceStatusChartProps {
    data: InvoiceStatusEntry[];
    isLoading?: boolean;
}

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

const chartConfig = {
    paid: {
        label: 'Lunas',
        color: 'oklch(0.627 0.194 149.214)', // emerald
    },
    unpaid: {
        label: 'Belum Dibayar',
        color: 'oklch(0.769 0.188 70.08)', // amber
    },
    overdue: {
        label: 'Jatuh Tempo',
        color: 'oklch(0.637 0.237 25.331)', // red / destructive
    },
    draft: {
        label: 'Draft',
        color: 'oklch(0.551 0.027 264.364)', // slate
    },
} satisfies ChartConfig;

const statusColorMap: Record<string, string> = {
    paid: '#10b981',
    unpaid: '#f59e0b',
    overdue: '#ef4444',
    draft: '#64748b',
};

export function InvoiceStatusChart({ data, isLoading = false }: InvoiceStatusChartProps) {
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

    const totalInvoices = data.reduce((acc, curr) => acc + curr.count, 0);
    const totalAmount = data.reduce((acc, curr) => acc + curr.total, 0);

    if (totalInvoices === 0) {
        return (
            <Card className="min-w-0">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Status Tagihan & Piutang</CardTitle>
                    <CardDescription className="text-sm">Rincian status seluruh invoice yang diterbitkan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        title="Belum ada data invoice"
                        description="Buat invoice pertama untuk melihat rincian status tagihan."
                        icon={<Receipt className="size-5" />}
                        className="min-h-72"
                    />
                </CardContent>
            </Card>
        );
    }

    const pieData = data.filter((d) => d.count > 0);

    return (
        <Card className="flex flex-col min-w-0">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">Status Tagihan & Piutang</CardTitle>
                    <CardDescription className="text-sm">
                        Total {totalInvoices} invoice ({formatRupiah(totalAmount)})
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1 px-4 pt-2 pb-4 sm:px-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                    <div className="relative flex items-center justify-center w-full max-w-[200px] h-[200px]">
                        <ChartContainer config={chartConfig} className="w-full h-full aspect-square">
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            hideLabel
                                            formatter={(_value, name, item) => {
                                                const raw = item?.payload as InvoiceStatusEntry;
                                                return (
                                                    <div className="flex flex-col gap-1 min-w-[130px] text-xs">
                                                        <div className="flex items-center justify-between font-semibold">
                                                            <span>{name}</span>
                                                            <span className="font-mono">{raw?.count ?? 0} unit</span>
                                                        </div>
                                                        <div className="text-muted-foreground">
                                                            {formatRupiah(raw?.total ?? 0)}
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                        />
                                    }
                                />
                                <Pie
                                    data={pieData}
                                    dataKey="count"
                                    nameKey="label"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    strokeWidth={2}
                                    stroke="var(--background)"
                                >
                                    {pieData.map((entry) => (
                                        <Cell
                                            key={`cell-${entry.status}`}
                                            fill={statusColorMap[entry.status] || '#94a3b8'}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold tracking-tight text-foreground">
                                {totalInvoices}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground">
                                Total Invoice
                            </span>
                        </div>
                    </div>

                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-1 sm:flex-col sm:gap-2.5">
                        {data.map((item) => {
                            const percent = totalInvoices > 0 ? ((item.count / totalInvoices) * 100).toFixed(0) : '0';
                            const dotColor = statusColorMap[item.status] || '#94a3b8';

                            return (
                                <div
                                    key={item.status}
                                    className="flex flex-col justify-between p-2.5 rounded-lg border bg-muted/20 sm:flex-row sm:items-center"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="size-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: dotColor }}
                                        />
                                        <span className="text-xs font-medium text-foreground">{item.label}</span>
                                        <span className="text-[11px] text-muted-foreground">({percent}%)</span>
                                    </div>
                                    <div className="mt-1 text-left sm:mt-0 sm:text-right">
                                        <div className="text-xs font-semibold tabular-nums text-foreground">
                                            {item.count} <span className="text-[10px] font-normal text-muted-foreground">inv</span>
                                        </div>
                                        <div className="text-[11px] font-mono text-muted-foreground">
                                            {formatRupiah(item.total)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
