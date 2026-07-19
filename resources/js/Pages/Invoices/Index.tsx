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
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/Components/DeleteConfirmationDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Invoice {
    id: number;
    invoice_number: string;
    bap_id: number;
    client_id: number;
    subtotal: string;
    discount_total: string;
    ppn: string;
    grand_total: string;
    due_date: string | null;
    status: 'draft' | 'unpaid' | 'overdue' | 'paid';
    paid_at: string | null;
    created_at: string;
    client?: { id: number; name: string } | null;
    bap?: { id: number; nomor_surat: string } | null;
}

interface PaginatedData {
    data: Invoice[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    invoices: PaginatedData;
    clients: { id: number; name: string }[];
    filters: {
        status: string;
        client_id: string;
    };
}

const formatRupiah = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

export default function Index({ invoices, clients, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
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
            status: statusFilter,
            client_id: clientFilter,
            ...overrides,
        };

        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== '' && v !== 'all')
        );

        router.get('/invoices', cleanParams, {
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

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/invoices/${deleteTarget.id}`, {
            onSuccess: () => {
                toast.success('Data berhasil dihapus.');
                setDeleteTarget(null);
            },
            onError: () => toast.error('Gagal menghapus data.'),
            onFinish: () => setDeleting(false),
        });
    };

    const columns: ColumnDef<Invoice, any>[] = [
        {
            accessorKey: 'invoice_number',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="No. Invoice" />
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
            id: 'bap_nomor',
            header: 'No. BAP',
            cell: ({ row }) => row.original.bap?.nomor_surat ?? '-',
            meta: { responsiveHidden: 'mobile' },
        },
        {
            accessorKey: 'grand_total',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Grand Total" />
            ),
            cell: ({ row }) => formatRupiah(row.original.grand_total),
        },
        {
            accessorKey: 'due_date',
            header: 'Jatuh Tempo',
            cell: ({ row }) =>
                row.original.due_date
                    ? new Date(row.original.due_date).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                      })
                    : '-',
            meta: { responsiveHidden: 'mobile' },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const invoice = row.original;
                return (
                    <div className="flex items-center gap-1">
                        <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="icon-sm" title="Lihat Detail">
                                <Eye className="size-4" />
                            </Button>
                        </Link>
                        <Link href={`/invoices/${invoice.id}/edit`}>
                            <Button variant="ghost" size="icon-sm" title="Edit">
                                <Pencil className="size-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Hapus"
                            onClick={() =>
                                setDeleteTarget({
                                    id: invoice.id,
                                    label: invoice.invoice_number,
                                })
                            }
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
                        Invoice
                    </h2>
                    <Link href="/invoices/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Buat Invoice
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Invoice" />

            <Card>
                <CardHeader>
                    <CardTitle>Invoice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                        <Select
                            value={statusFilter || 'all'}
                            onValueChange={(value) => handleStatusFilter(value ?? 'all')}
                            items={{ all: 'Semua Status', draft: 'Draft', unpaid: 'Unpaid', overdue: 'Overdue', paid: 'Paid' }}
                        >
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
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
                    <DataTable columns={columns} data={invoices.data} />

                    {/* Server-side Pagination */}
                    {invoices.last_page > 1 && (
                        <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {invoices.from}–{invoices.to} dari{' '}
                                {invoices.total} data
                            </p>

                            {/* Desktop pagination: all buttons */}
                            <div className="hidden items-center gap-2 sm:flex">
                                {invoices.links.map((link, index) => (
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

                            {/* Mobile pagination: prev/next only */}
                            <div className="flex items-center gap-2 sm:hidden">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!invoices.links[0]?.url}
                                    onClick={() => {
                                        if (invoices.links[0]?.url) {
                                            router.get(invoices.links[0].url, {}, { preserveState: true });
                                        }
                                    }}
                                >
                                    &laquo; Prev
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {invoices.current_page} / {invoices.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!invoices.links[invoices.links.length - 1]?.url}
                                    onClick={() => {
                                        const lastLink = invoices.links[invoices.links.length - 1];
                                        if (lastLink?.url) {
                                            router.get(lastLink.url, {}, { preserveState: true });
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

            <DeleteConfirmationDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                title="Hapus Invoice?"
                description={`Apakah Anda yakin ingin menghapus Invoice "${deleteTarget?.label}"? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={handleDelete}
                processing={deleting}
            />
        </AuthenticatedLayout>
    );
}
