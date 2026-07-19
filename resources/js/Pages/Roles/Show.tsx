import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Shield, Save } from 'lucide-react';
import { Permission } from '@/types';

interface RoleDetailProps {
    role: {
        id: number;
        name: string;
        permissions: Permission[];
    };
    allPermissions: Permission[];
}

export default function RolesShow({ role, allPermissions }: RoleDetailProps) {
    const { flash } = usePage().props as any;

    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        role.permissions.map((p) => p.name)
    );
    const [processing, setProcessing] = useState(false);

    // Show flash messages as toasts
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleToggle = (permissionName: string, checked: boolean) => {
        setSelectedPermissions((prev) =>
            checked
                ? [...prev, permissionName]
                : prev.filter((name) => name !== permissionName)
        );
    };

    const handleSelectAll = () => {
        setSelectedPermissions(allPermissions.map((p) => p.name));
    };

    const handleDeselectAll = () => {
        setSelectedPermissions([]);
    };

    const handleSave = () => {
        setProcessing(true);
        router.put(
            route('roles.update', role.id),
            { permissions: selectedPermissions },
            {
                onSuccess: () => {
                    setProcessing(false);
                },
                onError: () => {
                    toast.error('Gagal memperbarui permissions. Silakan coba lagi.');
                    setProcessing(false);
                },
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/roles">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Detail Role
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Kelola permissions untuk role: {role.name}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Role - ${role.name}`} />

            <div className="mx-auto max-w-2xl space-y-6">
                {/* Role Info */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="size-5 text-muted-foreground" />
                            <div>
                                <CardTitle className="text-base">
                                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                </CardTitle>
                                <CardDescription>
                                    {selectedPermissions.length} dari {allPermissions.length} permissions aktif
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Permissions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Permissions</CardTitle>
                                <CardDescription>
                                    Centang permissions yang ingin diberikan ke role ini
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAll}
                                >
                                    Pilih Semua
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeselectAll}
                                >
                                    Hapus Semua
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {allPermissions.map((permission) => (
                                <div
                                    key={permission.id}
                                    className="flex items-center gap-3 rounded-md border p-3"
                                >
                                    <Checkbox
                                        id={`permission-${permission.id}`}
                                        checked={selectedPermissions.includes(permission.name)}
                                        onCheckedChange={(checked) =>
                                            handleToggle(permission.name, !!checked)
                                        }
                                    />
                                    <Label
                                        htmlFor={`permission-${permission.id}`}
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        {permission.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                            {selectedPermissions.length} permission dipilih
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/roles">
                            <Button type="button" variant="outline">
                                Kembali
                            </Button>
                        </Link>
                        <Button onClick={handleSave} disabled={processing}>
                            <Save className="mr-2 size-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Permissions'}
                        </Button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
