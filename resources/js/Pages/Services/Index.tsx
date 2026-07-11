import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, DataTableColumnHeader } from '@/Components/DataTable';
import { ConfirmModal } from '@/Components/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Service {
    id: number;
    code: string;
    name: string;
    unit: string;
    price: string;
    type: 'service' | 'product';
    is_active: boolean;
    created_at: string;
}

interface PaginatedData {
    data: Service[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    services: PaginatedData;
    filters: {
        type?: string;
        is_active?: string;
        search?: string;
    };
}

function formatCurrency(value: string | number) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(num);
}

export default function ServicesIndex({ services, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const applyFilters = (newFilters: Record<string, string | undefined>) => {
        const params = {
            search: search || undefined,
            type: filters.type || undefined,
            is_active: filters.is_active || undefined,
            ...newFilters,
        };

        // Remove undefined values
        Object.keys(params).forEach((key) => {
            if (params[key as keyof typeof params] === undefined || params[key as keyof typeof params] === '') {
                delete params[key as keyof typeof params];
            }
        });

        router.get('/services', params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        applyFilters({ search: value || undefined });
    };

    const handleTypeFilter = (value: string) => {
        applyFilters({ type: value === 'all' ? undefined : value });
    };

    const handleStatusFilter = (value: string) => {
        applyFilters({ is_active: value === 'all' ? undefined : value });
    };

    const handleDelete = () => {
        if (selectedService) {
            router.delete(`/services/${selectedService.id}`, {
                onSuccess: () => {
                    setDeleteModalOpen(false);
                    setSelectedService(null);
                },
            });
        }
    };

    const columns: ColumnDef<Service>[] = [
        {
            accessorKey: 'code',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
        },
        {
            accessorKey: 'unit',
            header: 'Satuan',
        },
        {
            accessorKey: 'price',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
            cell: ({ row }) => formatCurrency(row.original.price),
        },
        {
            accessorKey: 'type',
            header: 'Tipe',
            cell: ({ row }) => (
                <Badge variant={row.original.type === 'service' ? 'default' : 'secondary'}>
                    {row.original.type === 'service' ? 'Jasa' : 'Produk'}
                </Badge>
            ),
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.is_active ? 'default' : 'outline'}>
                    {row.original.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const service = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                        >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Aksi</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => router.get(`/services/${service.id}/edit`)}
                            >
                                <Pencil className="mr-2 size-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                    setSelectedService(service);
                                    setDeleteModalOpen(true);
                                }}
                            >
                                <Trash2 className="mr-2 size-4" />
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Jasa/Produk
                    </h2>
                    <Link href="/services/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Tambah Jasa/Produk
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Jasa/Produk" />

            <Card>
                <CardHeader>
                    <CardTitle>Jasa/Produk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Input
                            placeholder="Cari nama atau kode..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="max-w-sm"
                        />
                        <Select
                            value={filters.type || 'all'}
                            onValueChange={(value) => handleTypeFilter(value ?? 'all')}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Semua Tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                <SelectItem value="service">Jasa</SelectItem>
                                <SelectItem value="product">Produk</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.is_active ?? 'all'}
                            onValueChange={(value) => handleStatusFilter(value ?? 'all')}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="1">Aktif</SelectItem>
                                <SelectItem value="0">Nonaktif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DataTable
                        columns={columns}
                        data={services.data}
                        pageSize={15}
                    />
                </CardContent>
            </Card>

            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="Hapus Jasa/Produk"
                description={`Apakah Anda yakin ingin menghapus "${selectedService?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel="Hapus"
                onConfirm={handleDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
