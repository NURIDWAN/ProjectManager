import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, DataTableColumnHeader } from '@/Components/DataTable';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface Client {
    id: number;
    name: string;
    npwp: string | null;
    address: string;
    pic_name: string | null;
    pic_phone: string | null;
    is_active: boolean;
    created_at: string;
}

interface PaginatedData {
    data: Client[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Filters {
    search: string;
    is_active: string;
}

interface Props {
    clients: PaginatedData;
    filters: Filters;
}

export default function ClientsIndex({ clients, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.is_active || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

    const { flash } = usePage().props as any;

    // Show flash messages as toasts
    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            '/clients',
            { search: value, is_active: statusFilter },
            { preserveState: true, replace: true }
        );
    };

    const handleStatusFilter = (value: string) => {
        const filterValue = value === 'all' ? '' : value;
        setStatusFilter(filterValue);
        router.get(
            '/clients',
            { search, is_active: filterValue },
            { preserveState: true, replace: true }
        );
    };

    const handleDelete = (client: Client) => {
        setClientToDelete(client);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!clientToDelete) return;
        router.delete(`/clients/${clientToDelete.id}`, {
            data: { confirmed: true },
            onSuccess: () => {
                toast.success('Klien berhasil dihapus.');
                setDeleteModalOpen(false);
                setClientToDelete(null);
            },
            onError: () => {
                toast.error('Gagal menghapus klien.');
                setDeleteModalOpen(false);
                setClientToDelete(null);
            },
        });
    };

    const columns: ColumnDef<Client, any>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Nama" />
            ),
        },
        {
            accessorKey: 'npwp',
            header: 'NPWP',
            cell: ({ row }) => row.original.npwp || '-',
        },
        {
            accessorKey: 'address',
            header: 'Alamat',
            cell: ({ row }) => (
                <span className="line-clamp-2 max-w-xs">
                    {row.original.address}
                </span>
            ),
        },
        {
            accessorKey: 'pic_name',
            header: 'PIC',
            cell: ({ row }) => row.original.pic_name || '-',
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
                    {row.original.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Link href={`/clients/${row.original.id}/edit`}>
                        <Button variant="ghost" size="icon-sm">
                            <Pencil className="size-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(row.original)}
                    >
                        <Trash2 className="size-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Klien
                    </h2>
                    <Link href="/clients/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Tambah Klien
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Klien" />

            <Card>
                <CardHeader>
                    <CardTitle>Klien</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama atau NPWP..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select
                            value={statusFilter || 'all'}
                            onValueChange={(value) => handleStatusFilter(value ?? 'all')}
                            items={{ all: 'Semua Status', '1': 'Aktif', '0': 'Nonaktif' }}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="1">Aktif</SelectItem>
                                <SelectItem value="0">Nonaktif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <DataTable columns={columns} data={clients.data} />

                    {/* Server-side Pagination */}
                    {clients.last_page > 1 && (
                        <div className="flex items-center justify-between px-2">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {clients.from}–{clients.to} dari {clients.total} data
                            </p>
                            <div className="flex items-center gap-2">
                                {clients.links.map((link, index) => (
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
                title="Hapus Klien"
                description={`Apakah Anda yakin ingin menghapus klien "${clientToDelete?.name}"? Tindakan ini akan melakukan soft-delete.`}
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
                variant="destructive"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setClientToDelete(null);
                    setDeleteModalOpen(false);
                }}
            />
        </AuthenticatedLayout>
    );
}
