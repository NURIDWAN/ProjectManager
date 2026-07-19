import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, DataTableColumnHeader } from '@/Components/DataTable';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/Components/DeleteConfirmationDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bast } from '@/types';

interface PaginatedData {
    data: Bast[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    basts: PaginatedData;
    clients: { id: number; name: string }[];
    filters: {
        client_id: string;
    };
}

export default function Index({ basts, clients, filters }: Props) {
    const [clientFilter, setClientFilter] = useState(filters.client_id || '');
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { flash } = usePage().props as any;

    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }

    const applyFilters = (overrides: Record<string, string> = {}) => {
        const params: Record<string, string> = {
            client_id: clientFilter,
            ...overrides,
        };

        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== '' && v !== 'all')
        );

        router.get('/basts', cleanParams, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClientFilter = (value: string) => {
        const v = value === 'all' ? '' : value;
        setClientFilter(v);
        applyFilters({ client_id: v });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/basts/${deleteTarget.id}`, {
            onSuccess: () => {
                toast.success('Data berhasil dihapus.');
                setDeleteTarget(null);
            },
            onError: () => toast.error('Gagal menghapus data.'),
            onFinish: () => setDeleting(false),
        });
    };

    const columns: ColumnDef<Bast, any>[] = [
        {
            accessorKey: 'document_number',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Nomor Dokumen" />
            ),
        },
        {
            id: 'client_name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Klien" />
            ),
            accessorFn: (row) => row.client?.name ?? '-',
        },
        {
            accessorKey: 'tanggal',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tanggal" />
            ),
            cell: ({ row }) =>
                new Date(row.original.tanggal).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                }),
        },
        {
            id: 'bap_nomor_surat',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="BAP Nomor Surat" />
            ),
            accessorFn: (row) => row.bap?.nomor_surat ?? '-',
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const bast = row.original;
                return (
                    <div className="flex items-center gap-1">
                        <Link href={`/basts/${bast.id}`}>
                            <Button variant="ghost" size="icon-sm" title="Lihat Detail">
                                <Eye className="size-4" />
                            </Button>
                        </Link>
                        <Link href={`/basts/${bast.id}/edit`}>
                            <Button variant="ghost" size="icon-sm" title="Edit">
                                <Pencil className="size-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Hapus"
                            onClick={() => setDeleteTarget({ id: bast.id, label: bast.document_number })}
                        >
                            <Trash2 className="size-4" />
                        </Button>
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
                        Berita Acara Serah Terima (BAST)
                    </h2>
                    <Link href="/basts/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Buat BAST
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="BAST" />

            <Card>
                <CardHeader>
                    <CardTitle>Berita Acara Serah Terima (BAST)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Client Filter */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
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
                    </div>

                    {/* Table */}
                    <DataTable columns={columns} data={basts.data} />

                    {/* Server-side Pagination */}
                    {basts.last_page > 1 && (
                        <div className="flex items-center justify-between px-2">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {basts.from}–{basts.to} dari{' '}
                                {basts.total} data
                            </p>
                            <div className="flex items-center gap-2">
                                {basts.links.map((link, index) => (
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

            <DeleteConfirmationDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                title="Hapus BAST?"
                description={`Apakah Anda yakin ingin menghapus BAST "${deleteTarget?.label}"? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={handleDelete}
                processing={deleting}
            />
        </AuthenticatedLayout>
    );
}
