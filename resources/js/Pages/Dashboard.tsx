import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { KpiCard } from '@/Components/KpiCard';
import { PageHeader } from '@/Components/PageHeader';
import { RevenueChart } from '@/Components/RevenueChart';
import { InvoiceStatusChart, type InvoiceStatusEntry } from '@/Components/InvoiceStatusChart';
import { WorkReportsTrendChart, type MonthlyWorkReportEntry } from '@/Components/WorkReportsTrendChart';
import { CategoryDistributionChart, type CategoryDistributionEntry } from '@/Components/CategoryDistributionChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
    invoiceStatus: InvoiceStatusEntry[];
    monthlyWorkReports: MonthlyWorkReportEntry[];
    categoryDistribution: CategoryDistributionEntry[];
}

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function DashboardSkeleton() {
    return (
        <div className="app-page">
            <div className="grid overflow-hidden rounded-xl border bg-card sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="space-y-3 border-b p-4 last:border-b-0 sm:border-r xl:border-b-0">
                        <Skeleton className="h-4 w-28" />
                        <div className="flex items-center justify-between gap-3">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-24" />
                    </div>
                ))}
            </div>
            <div className="grid min-w-0 gap-6 lg:grid-cols-2">
                <Skeleton className="h-[340px] w-full rounded-2xl" />
                <Skeleton className="h-[340px] w-full rounded-2xl" />
            </div>
            <div className="grid min-w-0 gap-6 lg:grid-cols-2">
                <Skeleton className="h-[340px] w-full rounded-2xl" />
                <Skeleton className="h-[340px] w-full rounded-2xl" />
            </div>
        </div>
    );
}

export default function Dashboard({
    kpiData,
    monthlyRevenue,
    invoiceStatus = [],
    monthlyWorkReports = [],
    categoryDistribution = [],
}: DashboardProps) {
    const isLoading = !kpiData;
    const kpis = kpiData ? [
        {
            label: 'Klien Aktif',
            value: kpiData.total_active_clients,
            description: 'Klien dengan status aktif',
        },
        {
            label: 'Pekerjaan Bulan Ini',
            value: kpiData.work_reports_this_month,
            description: 'Laporan yang sudah disubmit',
        },
        {
            label: 'Total Belum Dibayar',
            value: formatRupiah(kpiData.total_unpaid_amount),
            description: 'Akumulasi invoice unpaid',
        },
        {
            label: 'Invoice Overdue',
            value: kpiData.overdue_count,
            description: kpiData.overdue_count > 0 ? 'Memerlukan perhatian' : 'Tidak ada yang terlambat',
        },
    ] : [];

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Dashboard"
                    description="Ringkasan pekerjaan, piutang, dan pendapatan perusahaan."
                    actions={kpiData?.overdue_count > 0 ? (
                        <Link href="/invoices?status=overdue">
                            <Badge variant="destructive" className="gap-1.5 px-3 py-1.5">
                                <AlertTriangle className="size-3.5" />
                                {kpiData.overdue_count} jatuh tempo
                            </Badge>
                        </Link>
                    ) : undefined}
                />
            }
        >
            <Head title="Dashboard" />

            {isLoading ? <DashboardSkeleton /> : (
                <div className="app-page space-y-6">
                    {kpiData.overdue_count > 0 && (
                        <section aria-label="Peringatan invoice" className="flex flex-col gap-4 rounded-xl border border-destructive/25 bg-destructive/8 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/12 text-destructive">
                                    <AlertTriangle className="size-4.5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Invoice perlu ditindaklanjuti</p>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        {kpiData.overdue_count} invoice sudah melewati jatuh tempo. Total piutang saat ini {formatRupiah(kpiData.total_unpaid_amount)}.
                                    </p>
                                </div>
                            </div>
                            <Link href="/invoices?status=overdue">
                                <Button variant="outline" size="sm" className="w-full bg-background sm:w-auto">
                                    Lihat invoice <ArrowRight className="size-4" />
                                </Button>
                            </Link>
                        </section>
                    )}

                    <section aria-label="Indikator kinerja" className="grid overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_24px_50px_-35px_rgba(15,23,42,0.18)] sm:grid-cols-2 xl:grid-cols-4">
                        {kpis.map((kpi, index) => {
                            const borderClassName = [
                                'border-b sm:border-r xl:border-b-0',
                                'border-b xl:border-b-0 xl:border-r',
                                'border-b sm:border-b-0 sm:border-r',
                                '',
                            ][index];

                            return (
                                <KpiCard
                                    key={kpi.label}
                                    className={borderClassName}
                                    label={kpi.label}
                                    value={kpi.value}
                                    description={kpi.description}
                                />
                            );
                        })}
                    </section>

                    {/* Finansial: Tren Pendapatan & Status Tagihan */}
                    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
                        <RevenueChart data={monthlyRevenue} />
                        <InvoiceStatusChart data={invoiceStatus} />
                    </div>

                    {/* Operasional: Volume Pekerjaan & Distribusi Kategori */}
                    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
                        <WorkReportsTrendChart data={monthlyWorkReports} />
                        <CategoryDistributionChart data={categoryDistribution} />
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
