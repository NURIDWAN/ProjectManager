import { useState, useCallback, useRef, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, DataTableColumnHeader } from '@/Components/DataTable';
import { ConfirmModal } from '@/Components/ConfirmModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface UserListItem {
    id: number;
    name: string;
    email: string;
    roles: { id: number; name: string }[];
    created_at: string;
}

interface PaginatedData {
    data: UserListItem[];
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
    sort_field: string;
    sort_direction: string;
}

interface Props {
    users: PaginatedData;
    filters: Filters;
}

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { flash, auth } = usePage().props as any;

    // Show flash messages as toasts
    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }

    const performSearch = useCallback(
        (value: string) => {
            router.get(
                '/users',
                {
                    search: value,
                    sort_field: filters.sort_field,
                    sort_direction: filters.sort_direction,
                },
                { preserveState: true, replace: true }
            );
        },
        [filters.sort_field, filters.sort_direction]
    );

    const handleSearch = (value: string) => {
        setSearch(value);
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const handleSort = (field: string) => {
        let direction = 'asc';
        if (filters.sort_field === field && filters.sort_direction === 'asc') {
            direction = 'desc';
        }
        router.get(
            '/users',
            { search, sort_field: field, sort_direction: direction },
            { preserveState: true, replace: true }
        );
    };

    const handleDelete = (user: UserListItem) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!userToDelete) return;
        router.delete(`/users/${userToDelete.id}`, {
            onSuccess: () => {
                toast.success('Pengguna berhasil dihapus.');
                setDeleteModalOpen(false);
                setUserToDelete(null);
            },
            onError: () => {
                toast.error('Gagal menghapus pengguna.');
                setDeleteModalOpen(false);
                setUserToDelete(null);
            },
        });
    };

    const columns: ColumnDef<UserListItem, any>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Nama" />
            ),
            enableSorting: true,
        },
        {
            accessorKey: 'email',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Email" />
            ),
            enableSorting: true,
        },
        {
            id: 'role',
            header: 'Role',
            cell: ({ row }) => {
                const roles = row.original.roles;
                if (!roles || roles.length === 0) return '-';
                return (
                    <div className="flex flex-wrap gap-1">
                        {roles.map((role) => (
                            <Badge key={role.id} variant="secondary">
                                {role.name}
                            </Badge>
                        ))}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const isSelf = row.original.id === auth?.user?.id;
                return (
                    <div className="flex items-center gap-2">
                        <Link href={`/users/${row.original.id}/edit`}>
                            <Button variant="ghost" size="icon-sm">
                                <Pencil className="size-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(row.original)}
                            disabled={isSelf}
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
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Pengguna
                    </h2>
                    <Link href="/users/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Tambah User
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Pengguna" />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pengguna</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama atau email..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <DataTable columns={columns} data={users.data} />

                    {/* Server-side Pagination */}
                    {users.last_page > 1 && (
                        <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {users.from}–{users.to} dari {users.total} data
                            </p>
                            <div className="hidden items-center gap-2 sm:flex">
                                {users.links.map((link, index) => (
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
                                    disabled={!users.links[0]?.url}
                                    onClick={() => {
                                        if (users.links[0]?.url) {
                                            router.get(users.links[0].url, {}, { preserveState: true });
                                        }
                                    }}
                                >
                                    &laquo; Prev
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {users.current_page} / {users.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!users.links[users.links.length - 1]?.url}
                                    onClick={() => {
                                        const lastLink = users.links[users.links.length - 1];
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

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="Hapus Pengguna"
                description={`Apakah Anda yakin ingin menghapus pengguna "${userToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
                variant="destructive"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setUserToDelete(null);
                    setDeleteModalOpen(false);
                }}
            />
        </AuthenticatedLayout>
    );
}
