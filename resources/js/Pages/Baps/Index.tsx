import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageHeader } from '@/Components/PageHeader';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/Components/DeleteConfirmationDialog';
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
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
    const [approveTarget, setApproveTarget] = useState<{ id: number; label: string } | null>(null);
    const [signedBy, setSignedBy] = useState('');
    const [signedByError, setSignedByError] = useState('');
    const [deleting, setDeleting] = useState(false);

    const { flash } = usePage().props as any;

    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }

    const handleApprove = () => {
        if (!approveTarget) return;
        if (!signedBy.trim()) {
            setSignedByError('Nama pihak yang menyetujui wajib diisi.');
            return;
        }

        setSignedByError('');
        router.post(`/baps/${approveTarget.id}/approve`, { signed_by: signedBy.trim() }, {
            onSuccess: () => {
                toast.success('BAP berhasil di-approve.');
                setApproveTarget(null);
                setSignedBy('');
            },
            onError: (errors) => {
                const message = Object.values(errors).flat().join(', ');
                toast.error(message || 'Gagal approve BAP.');
            },
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/baps/${deleteTarget.id}`, {
            onSuccess: () => {
                toast.success('Data berhasil dihapus.');
                setDeleteTarget(null);
            },
            onError: () => toast.error('Gagal menghapus data.'),
            onFinish: () => setDeleting(false),
        });
    };

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
            only: ['baps', 'filters'],
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
                <DataTableColumnHeader column={column} title="No. Surat" />
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
            meta: { responsiveHidden: 'mobile' },
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
                const item = row.original;
                return (
                    <div className="flex items-center gap-1">
                        <Link href={`/baps/${item.id}`}>
                            <Button variant="ghost" size="icon-sm" title="Lihat Detail">
                                <Eye className="size-4" />
                            </Button>
                        </Link>
                        <Link href={`/baps/${item.id}/edit`}>
                            <Button variant="ghost" size="icon-sm" title="Edit">
                                <Pencil className="size-4" />
                            </Button>
                        </Link>
                        {item.status === 'draft' && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Approved"
                                onClick={() => {
                                    setApproveTarget({ id: item.id, label: item.nomor_surat });
                                    setSignedBy('');
                                    setSignedByError('');
                                }}
                            >
                                <CheckCircle className="size-4 text-green-600" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Hapus"
                            onClick={() => setDeleteTarget({ id: item.id, label: item.nomor_surat })}
                        >
                            <Trash2 className="size-4 text-destructive" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <PageHeader title="Berita Acara Pekerjaan" description="Buat, tinjau, dan setujui dokumen BAP dari laporan kerja." actions={
                    <Link href="/baps/create">
                        <Button>
                            <Plus className="size-4" />
                            Buat BAP
                        </Button>
                    </Link>
                } />
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
                            items={{ all: 'Semua Status', draft: 'Draft', approved: 'Approved' }}
                        >
                            <SelectTrigger className="w-full sm:w-[160px]">
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
                            items={{ all: 'Semua Klien', ...Object.fromEntries(clients.map(c => [String(c.id), c.name])) }}
                        >
                            <SelectTrigger className="w-full sm:w-[200px]">
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
                    <DataTable columns={columns} data={baps.data} serverSide />

                    {/* Server-side Pagination */}
                    {baps.last_page > 1 && (
                        <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {baps.from}-{baps.to} dari{' '}
                                {baps.total} data
                            </p>

                            {/* Desktop pagination: all buttons */}
                            <div className="hidden items-center gap-2 sm:flex">
                                {baps.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                router.get(link.url, {}, {
                                                    preserveState: true,
                                                    only: ['baps', 'filters'],
                                                });
                                            }
                                        }}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>

                            {/* Mobile pagination: prev/next only */}
                            <div className="flex items-center gap-2 sm:hidden">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!baps.links[0]?.url}
                                    onClick={() => {
                                        if (baps.links[0]?.url) {
                                            router.get(baps.links[0].url, {}, {
                                                preserveState: true,
                                                only: ['baps', 'filters'],
                                            });
                                        }
                                    }}
                                >
                                    &laquo; Prev
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {baps.current_page} / {baps.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!baps.links[baps.links.length - 1]?.url}
                                    onClick={() => {
                                        const lastLink = baps.links[baps.links.length - 1];
                                        if (lastLink?.url) {
                                            router.get(lastLink.url, {}, {
                                                preserveState: true,
                                                only: ['baps', 'filters'],
                                            });
                                        }
                                    }}
                                >
                                    Next &raquo;
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog
                open={!!approveTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setApproveTarget(null);
                        setSignedBy('');
                        setSignedByError('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve BAP?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Setelah disetujui, status BAP akan berubah menjadi Approved.
                            Masukkan nama pihak yang menyetujui untuk melanjutkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="bap-signed-by">
                            Nama Penyetuju <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="bap-signed-by"
                            value={signedBy}
                            onChange={(event) => {
                                setSignedBy(event.target.value);
                                if (signedByError) setSignedByError('');
                            }}
                            placeholder="Masukkan nama pihak yang menyetujui"
                            aria-invalid={!!signedByError}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    handleApprove();
                                }
                            }}
                        />
                        {signedByError && (
                            <p className="text-sm text-destructive">{signedByError}</p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setApproveTarget(null);
                                setSignedBy('');
                                setSignedByError('');
                            }}
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove}>
                            Ya, Approved
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DeleteConfirmationDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                title="Hapus BAP?"
                description={`Apakah Anda yakin ingin menghapus BAP "${deleteTarget?.label}"? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={handleDelete}
                processing={deleting}
            />
        </AuthenticatedLayout>
    );
}
