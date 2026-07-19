import { Head, Link, router, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, UserCog, Save } from 'lucide-react';
import { editUserSchema, EditUserFormData } from './schemas';
import { Role } from '@/types';
import { useState } from 'react';

interface UserListItem {
    id: number;
    name: string;
    email: string;
    roles: { id: number; name: string }[];
    created_at: string;
}

interface Props {
    user: UserListItem;
    roles: Role[];
}

export default function UsersEdit({ user, roles }: Props) {
    const { errors: serverErrors } = usePage().props as unknown as {
        errors: Record<string, string>;
    };

    const [processing, setProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<EditUserFormData>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            name: user.name,
            email: user.email,
            password: '',
            role: user.roles?.[0]?.name ?? '',
        },
    });

    const selectedRole = watch('role');

    const onSubmit = (data: EditUserFormData) => {
        setProcessing(true);

        const payload: Record<string, string> = {
            name: data.name,
            email: data.email,
            role: data.role,
        };

        if (data.password && data.password.length > 0) {
            payload.password = data.password;
        }

        router.put(route('users.update', user.id), payload, {
            onSuccess: () => {
                toast.success('User berhasil diperbarui.');
                setProcessing(false);
            },
            onError: () => {
                toast.error('Gagal memperbarui user. Periksa form dan coba lagi.');
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/users">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Edit User
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Perbarui data pengguna: {user.name}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Edit User - ${user.name}`} />

            <div className="mx-auto max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <UserCog className="size-5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Informasi User</CardTitle>
                                    <CardDescription>
                                        Perbarui data akun pengguna
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Nama */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nama <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    {...register('name')}
                                    placeholder="Nama lengkap"
                                    aria-invalid={!!(errors.name || serverErrors?.name)}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                                {serverErrors?.name && (
                                    <p className="text-sm text-destructive">{serverErrors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register('email')}
                                    placeholder="email@contoh.com"
                                    aria-invalid={!!(errors.email || serverErrors?.email)}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                                {serverErrors?.email && (
                                    <p className="text-sm text-destructive">{serverErrors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password')}
                                    placeholder="Kosongkan jika tidak ingin mengubah password"
                                    aria-invalid={!!(errors.password || serverErrors?.password)}
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                                {serverErrors?.password && (
                                    <p className="text-sm text-destructive">{serverErrors.password}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Minimal 8 karakter. Kosongkan jika tidak ingin mengubah password.
                                </p>
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label htmlFor="role">
                                    Role <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={selectedRole}
                                    onValueChange={(value) => setValue('role', value ?? '', { shouldValidate: true })}
                                >
                                    <SelectTrigger id="role" className="w-full">
                                        <SelectValue placeholder="Pilih role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.name}>
                                                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role && (
                                    <p className="text-sm text-destructive">{errors.role.message}</p>
                                )}
                                {serverErrors?.role && (
                                    <p className="text-sm text-destructive">{serverErrors.role}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                        <p className="text-sm text-muted-foreground">
                            <span className="text-destructive">*</span> Menandakan field wajib diisi
                        </p>
                        <div className="flex items-center gap-3">
                            <Link href="/users">
                                <Button type="button" variant="outline">
                                    Batal
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 size-4" />
                                {processing ? 'Menyimpan...' : 'Perbarui User'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
