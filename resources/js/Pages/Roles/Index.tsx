import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Plus, Shield, Trash2 } from 'lucide-react';
import CreateRoleDialog from './CreateRoleDialog';
import EditRoleDialog from './EditRoleDialog';
import DeleteRoleDialog from './DeleteRoleDialog';

interface RoleListItem {
    id: number;
    name: string;
    permissions_count: number;
    permissions: { id: number; name: string }[];
}

interface Props {
    roles: RoleListItem[];
}

export default function RolesIndex({ roles }: Props) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleListItem | null>(null);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Role & Perizinan
                    </h2>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-1 size-4" />
                        Create Role
                    </Button>
                </div>
            }
        >
            <Head title="Role & Perizinan" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => (
                    <Link
                        key={role.id}
                        href={`/roles/${role.id}`}
                        className="block transition-shadow hover:shadow-md rounded-lg"
                    >
                        <Card className="h-full">
                            <CardHeader className="flex flex-row items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                                    <Shield className="size-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg capitalize">
                                        {role.name}
                                    </CardTitle>
                                </div>
                                {role.name !== 'admin' && (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setSelectedRole(role);
                                                setEditDialogOpen(true);
                                            }}
                                        >
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setSelectedRole(role);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                        {role.permissions_count} permission{role.permissions_count !== 1 ? 's' : ''}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <CreateRoleDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />
            <EditRoleDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                role={selectedRole}
            />
            <DeleteRoleDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                role={selectedRole}
            />
        </AuthenticatedLayout>
    );
}
