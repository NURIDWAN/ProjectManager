import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, DataTableColumnHeader } from '@/Components/DataTable';
import { ConfirmModal } from '@/Components/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JobCategory {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
}

interface PaginatedData {
    data: JobCategory[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    categories: PaginatedData;
    filters: {
        search?: string;
    };
}

export default function JobCategoriesIndex({ categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(null);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/job-categories', { search: value || undefined }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = () => {
        if (selectedCategory) {
            router.delete(`/job-categories/${selectedCategory.id}`, {
                onSuccess: () => {
                    setDeleteModalOpen(false);
                    setSelectedCategory(null);
                },
            });
        }
    };

    const columns: ColumnDef<JobCategory>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
        },
        {
            accessorKey: 'description',
            header: 'Deskripsi',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.description || '-'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const category = row.original;
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
                                onClick={() => router.get(`/job-categories/${category.id}/edit`)}
                            >
                                <Pencil className="mr-2 size-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                    setSelectedCategory(category);
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
                        Kategori Pekerjaan
                    </h2>
                    <Link href="/job-categories/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Tambah Kategori
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Kategori Pekerjaan" />

            <Card>
                <CardHeader>
                    <CardTitle>Kategori Pekerjaan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Input
                            placeholder="Cari kategori..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>

                    <DataTable
                        columns={columns}
                        data={categories.data}
                        pageSize={15}
                    />
                </CardContent>
            </Card>

            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="Hapus Kategori"
                description={`Apakah Anda yakin ingin menghapus kategori "${selectedCategory?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel="Hapus"
                onConfirm={handleDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
