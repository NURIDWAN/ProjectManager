import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Users,
    FileText,
    CreditCard,
    AlertTriangle,
    ArrowRight,
    Clock,
} from 'lucide-react';
import { KpiCard } from '@/Components/KpiCard';
import { RevenueChart } from '@/Components/RevenueChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface KpiData {
    total_active_clients: number;
    work_reports_this_month: number;
    total_unpaid_amount: number;
    overdue_count: number;
}

interface MonthlyRevenueEntry {
    month: string;
    total: number;
}

interface DashboardProps {
    kpiData: KpiData;
    monthlyRevenue: MonthlyRevenueEntry[];
}

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
}

function KpiCardSkeleton() {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="size-10 rounded-lg" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard({ kpiData, monthlyRevenue }: DashboardProps) {
    const isLoading = !kpiData;

    if (isLoading) {
        return (
            <AuthenticatedLayout
                header={
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Dashboard
                    </h2>
                }
            >
                <Head title="Dashboard" />
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCardSkeleton />
                        <KpiCardSkeleton />
                        <KpiCardSkeleton />
                        <KpiCardSkeleton />
                    </div>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[280px] w-full" />
                        </CardContent>
                    </Card>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Dashboard
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Ringkasan performa dan aktivitas bisnis
                        </p>
                    </div>
                    {kpiData.overdue_count > 0 && (
                        <Link href="/invoices?status=overdue">
                            <Badge
                                variant="destructive"
                                className="flex cursor-pointer items-center gap-1.5 px-3 py-1.5 transition-opacity hover:opacity-80"
                            >
                                <AlertTriangle className="size-3.5" />
                                {kpiData.overdue_count} Invoice Overdue
                            </Badge>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Overdue Alert Banner */}
                {kpiData.overdue_count > 0 && (
                    <Card className="border-destructive/50 bg-destructive/5">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-full bg-destructive/10">
                                    <Clock className="size-4.5 text-destructive" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-destructive">
                                        {kpiData.overdue_count} invoice melewati jatuh tempo
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Total:{' '}
                                        {formatRupiah(kpiData.total_unpaid_amount)} belum dibayar
                                    </p>
                                </div>
                            </div>
                            <Link href="/invoices?status=overdue">
                                <Button variant="destructive" size="sm">
                                    Lihat Detail
                                    <ArrowRight className="ml-1.5 size-3.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* KPI Cards - 4 columns */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        label="Total Klien Aktif"
                        value={kpiData.total_active_clients}
                        icon={<Users className="size-5" />}
                        iconColor="blue"
                        description="Klien dengan status aktif"
                    />
                    <KpiCard
                        label="Pekerjaan Bulan Ini"
                        value={kpiData.work_reports_this_month}
                        icon={<FileText className="size-5" />}
                        iconColor="emerald"
                        description="Laporan kerja submitted"
                    />
                    <KpiCard
                        label="Total Belum Dibayar"
                        value={formatRupiah(kpiData.total_unpaid_amount)}
                        icon={<CreditCard className="size-5" />}
                        iconColor="amber"
                        description={
                            kpiData.overdue_count > 0
                                ? `${kpiData.overdue_count} sudah jatuh tempo`
                                : 'Semua dalam tenggat waktu'
                        }
                    />
                    <KpiCard
                        label="Invoice Overdue"
                        value={kpiData.overdue_count}
                        icon={<AlertTriangle className="size-5" />}
                        iconColor={kpiData.overdue_count > 0 ? 'rose' : 'default'}
                        description={
                            kpiData.overdue_count > 0
                                ? 'Memerlukan perhatian segera'
                                : 'Tidak ada yang overdue'
                        }
                    />
                </div>

                {/* Revenue Chart */}
                <RevenueChart data={monthlyRevenue} />

                {/* Quick Actions */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Laporan Kerja
                            </CardTitle>
                            <CardDescription>
                                Kelola laporan dari teknisi
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Link href="/work-reports">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-between"
                                >
                                    Lihat Semua Laporan
                                    <ArrowRight className="size-3.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Berita Acara (BAP)
                            </CardTitle>
                            <CardDescription>
                                Buat dan kelola BAP dari laporan
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Link href="/baps">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-between"
                                >
                                    Kelola BAP
                                    <ArrowRight className="size-3.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Invoice
                            </CardTitle>
                            <CardDescription>
                                Tagihan dan pembayaran klien
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Link href="/invoices">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-between"
                                >
                                    Kelola Invoice
                                    <ArrowRight className="size-3.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
