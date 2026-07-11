import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, DataTableColumnHeader } from '@/Components/DataTable';
import { StatusBadge } from '@/Components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Bap {
    id: number;
    nomor_surat: string;
    client_id: number;
    tanggal: string;
    status: 'draft' | 'approved';
    work_report_ids: number[];
    signed_by: string | null;
    created_at: string;
    client?: { id: number; name: string } | null;
}

interface PaginatedData {
    data: Bap[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    baps: PaginatedData;
    clients: { id: number; name: string }[];
    filters: {
        status: string;
        client_id: string;
    };
}

export default function Index({ baps, clients, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [clientFilter, setClientFilter] = useState(filters.client_id || '');

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
            ...overrides,
        };

        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== '' && v !== 'all')
        );

        router.get('/baps', cleanParams, {
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

    const columns: ColumnDef<Bap, any>[] = [
        {
            accessorKey: 'nomor_surat',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Nomor Surat" />
            ),
        },
        {
            accessorKey: 'tanggal',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tanggal" />
            ),
            cell: ({ row }) =>
                new Date(row.original.tanggal).toLocaleDateString('id-ID', {
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
            id: 'jumlah_laporan',
            header: 'Jumlah Laporan',
            cell: ({ row }) => (
                <span>{row.original.work_report_ids?.length ?? 0} laporan</span>
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
                const bap = row.original;
                return (
                    <div className="flex items-center gap-1">
                        <Link href={`/baps/${bap.id}`}>
                            <Button variant="ghost" size="icon-sm" title="Lihat Detail">
                                <Eye className="size-4" />
                            </Button>
                        </Link>
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
                        Berita Acara Pekerjaan (BAP)
                    </h2>
                    <Link href="/baps/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Buat BAP
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="BAP" />

            <Card>
                <CardHeader>
                    <CardTitle>Berita Acara Pekerjaan (BAP)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                        <Select
                            value={statusFilter || 'all'}
                            onValueChange={(value) => handleStatusFilter(value ?? 'all')}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={clientFilter || 'all'}
                            onValueChange={(value) => handleClientFilter(value ?? 'all')}
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
                    </div>

                    {/* Table */}
                    <DataTable columns={columns} data={baps.data} />

                    {/* Server-side Pagination */}
                    {baps.last_page > 1 && (
                        <div className="flex items-center justify-between px-2">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {baps.from}–{baps.to} dari{' '}
                                {baps.total} data
                            </p>
                            <div className="flex items-center gap-2">
                                {baps.links.map((link, index) => (
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
        </AuthenticatedLayout>
    );
}
