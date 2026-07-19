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
import { ArrowLeft, UserPlus, Save } from 'lucide-react';
import { createUserSchema, CreateUserFormData } from './schemas';
import { Role } from '@/types';
import { useState } from 'react';

interface Props {
    roles: Role[];
}

export default function UsersCreate({ roles }: Props) {
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
    } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: '',
        },
    });

    const selectedRole = watch('role');

    const onSubmit = (data: CreateUserFormData) => {
        setProcessing(true);

        router.post(route('users.store'), data, {
            onSuccess: () => {
                toast.success('User berhasil ditambahkan.');
                setProcessing(false);
            },
            onError: () => {
                toast.error('Gagal menyimpan user. Periksa form dan coba lagi.');
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
                            Tambah User
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Buat akun pengguna baru untuk ditambahkan ke sistem
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Tambah User" />

            <div className="mx-auto max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <UserPlus className="size-5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Informasi User</CardTitle>
                                    <CardDescription>
                                        Isi data akun pengguna baru
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
                                <Label htmlFor="password">
                                    Password <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password')}
                                    placeholder="Minimal 8 karakter"
                                    aria-invalid={!!(errors.password || serverErrors?.password)}
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                                {serverErrors?.password && (
                                    <p className="text-sm text-destructive">{serverErrors.password}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Minimal 8 karakter
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
                                {processing ? 'Menyimpan...' : 'Simpan User'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
