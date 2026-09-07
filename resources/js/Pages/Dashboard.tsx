import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, FileCheck, FileText, Receipt } from 'lucide-react';
import { KpiCard } from '@/Components/KpiCard';
import { PageHeader } from '@/Components/PageHeader';
import { RevenueChart } from '@/Components/RevenueChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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

function getTrendPercent(current: number, previous: number): number {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
}

const shortcuts = [
    { label: 'Laporan Kerja', description: 'Tinjau laporan dari teknisi', href: '/work-reports', icon: FileText },
    { label: 'Berita Acara', description: 'Siapkan dan setujui BAP', href: '/baps', icon: FileCheck },
    { label: 'Invoice', description: 'Kelola tagihan dan pembayaran', href: '/invoices', icon: Receipt },
];

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
            <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
    );
}

export default function Dashboard({ kpiData, monthlyRevenue }: DashboardProps) {
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
                <div className="app-page">
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

                    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                        <RevenueChart data={monthlyRevenue} />

                        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_20px_40px_-35px_rgba(15,23,42,0.12)]">
                            <h2 className="text-base font-semibold tracking-[-0.01em]">Akses cepat</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Buka pekerjaan yang paling sering digunakan.</p>
                            <div className="mt-5 space-y-2">
                                {shortcuts.map((shortcut) => (
                                    <Link
                                        key={shortcut.href}
                                        href={shortcut.href}
                                        className="group flex min-h-16 items-center gap-3 rounded-lg border border-transparent px-3 outline-none hover:border-border hover:bg-muted/55 focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                                            <shortcut.icon className="size-4.5" strokeWidth={1.8} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-foreground">{shortcut.label}</p>
                                            <p className="truncate text-xs text-muted-foreground">{shortcut.description}</p>
                                        </div>
                                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
