import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, DataTableColumnHeader } from '@/Components/DataTable';
import { StatusBadge } from '@/Components/StatusBadge';
import { ConfirmModal } from '@/Components/ConfirmModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Eye, Pencil, Trash2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkReport {
    id: number;
    client_id: number | null;
    category_id: number | null;
    technician_id: number;
    description: string | null;
    status: 'draft' | 'submitted';
    submitted_at: string | null;
    before_photos: string[] | null;
    after_photos: string[] | null;
    created_at: string;
    client?: { id: number; name: string } | null;
    category?: { id: number; name: string } | null;
    technician?: { id: number; name: string } | null;
}

interface PaginatedData {
    data: WorkReport[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    workReports: PaginatedData;
    clients: { id: number; name: string }[];
    filters: {
        status: string;
        client_id: string;
        date_from: string;
        date_to: string;
    };
}

export default function Index({ workReports, clients, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [clientFilter, setClientFilter] = useState(filters.client_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<WorkReport | null>(null);

    const { flash } = usePage().props as any;

    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }

    const applyFilters = (overrides: Record<string, string> = {}) => {
        const params: Record<string, string> = {
            status: statusFilter,
            client_id: clientFilter,
            date_from: dateFrom,
            date_to: dateTo,
            ...overrides,
        };

        // Remove empty params
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== '' && v !== 'all')
        );

        router.get('/work-reports', cleanParams, {
            preserveState: true,
            replace: true,
        });
    };

    const handleStatusFilter = (value: string) => {
        const v = value === 'all' ? '' : value;
        setStatusFilter(v);
        applyFilters({ status: v });
    };

    const handleClientFilter = (value: string) => {
        const v = value === 'all' ? '' : value;
        setClientFilter(v);
        applyFilters({ client_id: v });
    };

    const handleDateFrom = (value: string) => {
        setDateFrom(value);
        applyFilters({ date_from: value });
    };

    const handleDateTo = (value: string) => {
        setDateTo(value);
        applyFilters({ date_to: value });
    };

    const handleDelete = (report: WorkReport) => {
        setReportToDelete(report);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!reportToDelete) return;
        router.delete(`/work-reports/${reportToDelete.id}`, {
            onSuccess: () => {
                toast.success('Laporan kerja berhasil dihapus.');
                setDeleteModalOpen(false);
                setReportToDelete(null);
            },
            onError: () => {
                toast.error('Gagal menghapus laporan kerja.');
                setDeleteModalOpen(false);
                setReportToDelete(null);
            },
        });
    };

    const handleSubmit = (report: WorkReport) => {
        router.post(`/work-reports/${report.id}/submit`, {}, {
            onSuccess: () => {
                toast.success('Laporan kerja berhasil disubmit.');
            },
            onError: (errors) => {
                const errorMsg = Object.values(errors).flat().join(', ');
                toast.error(errorMsg || 'Gagal submit laporan kerja.');
            },
        });
    };

    const columns: ColumnDef<WorkReport, any>[] = [
        {
            accessorKey: 'created_at',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tanggal" />
            ),
            cell: ({ row }) =>
                new Date(row.original.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                }),
        },
        {
            id: 'client_name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Klien" />
            ),
            accessorFn: (row) => row.client?.name ?? '-',
        },
        {
            id: 'category_name',
            header: 'Kategori',
            accessorFn: (row) => row.category?.name ?? '-',
        },
        {
            id: 'technician_name',
            header: 'Teknisi',
            accessorFn: (row) => row.technician?.name ?? '-',
        },
        {
            accessorKey: 'description',
            header: 'Deskripsi',
            cell: ({ row }) => (
                <span className="line-clamp-2 max-w-xs">
                    {row.original.description || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <StatusBadge status={row.original.status} />
            ),
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const report = row.original;
                return (
                    <div className="flex items-center gap-1">
                        <Link href={`/work-reports/${report.id}`}>
                            <Button variant="ghost" size="icon-sm" title="Lihat">
                                <Eye className="size-4" />
                            </Button>
                        </Link>
                        {report.status === 'draft' && (
                            <>
                                <Link href={`/work-reports/${report.id}/edit`}>
                                    <Button variant="ghost" size="icon-sm" title="Edit">
                                        <Pencil className="size-4" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    title="Submit"
                                    onClick={() => handleSubmit(report)}
                                >
                                    <Send className="size-4 text-blue-600" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    title="Hapus"
                                    onClick={() => handleDelete(report)}
                                >
                                    <Trash2 className="size-4 text-destructive" />
                                </Button>
                            </>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Laporan Kerja
                    </h2>
                    <Link href="/work-reports/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Buat Laporan
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Laporan Kerja" />

            <Card>
                <CardHeader>
                    <CardTitle>Laporan Kerja</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                        <Select
                            value={statusFilter || 'all'}
                            onValueChange={(value) => handleStatusFilter(value ?? 'all')}
                            items={{ all: 'Semua Status', draft: 'Draft', submitted: 'Submitted' }}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={clientFilter || 'all'}
                            onValueChange={(value) => handleClientFilter(value ?? 'all')}
                            items={{ all: 'Semua Klien', ...Object.fromEntries(clients.map(c => [String(c.id), c.name])) }}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Klien" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Klien</SelectItem>
                                {clients.map((client) => (
                                    <SelectItem
                                        key={client.id}
                                        value={String(client.id)}
                                    >
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => handleDateFrom(e.target.value)}
                                className="w-[150px]"
                                placeholder="Dari"
                            />
                            <span className="text-sm text-muted-foreground">—</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => handleDateTo(e.target.value)}
                                className="w-[150px]"
                                placeholder="Sampai"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <DataTable columns={columns} data={workReports.data} />

                    {/* Server-side Pagination */}
                    {workReports.last_page > 1 && (
                        <div className="flex items-center justify-between px-2">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {workReports.from}–{workReports.to} dari{' '}
                                {workReports.total} data
                            </p>
                            <div className="flex items-center gap-2">
                                {workReports.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                router.get(link.url, {}, { preserveState: true });
                                            }
                                        }}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="Hapus Laporan Kerja"
                description={`Apakah Anda yakin ingin menghapus laporan kerja ini? Foto terkait juga akan dihapus.`}
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
                variant="destructive"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setReportToDelete(null);
                    setDeleteModalOpen(false);
                }}
            />
        </AuthenticatedLayout>
    );
}
