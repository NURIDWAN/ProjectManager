import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout>
            <Head title="Masuk" />

            <div className="mb-6 text-center">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Masuk</h1>
            </div>

            {status && (
                <div role="status" className="mb-5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            autoComplete="username"
                            autoFocus
                            placeholder="nama@perusahaan.com"
                            className="h-10 pl-9 text-sm"
                            aria-invalid={Boolean(errors.email)}
                            onChange={(event) => setData('email', event.target.value)}
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                    <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            autoComplete="current-password"
                            placeholder="Masukkan password"
                            className="h-10 pl-9 pr-10 text-sm"
                            aria-invalid={Boolean(errors.password)}
                            onChange={(event) => setData('password', event.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((visible) => !visible)}
                            className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                        >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} />
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', checked === true)}
                        />
                        <Label htmlFor="remember" className="cursor-pointer text-xs font-normal text-muted-foreground">
                            Ingat saya
                        </Label>
                    </div>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            Lupa password?
                        </Link>
                    )}
                </div>

                <Button type="submit" className="w-full font-medium" disabled={processing}>
                    {processing ? 'Memproses...' : 'Masuk'}
                </Button>
            </form>
        </GuestLayout>
    );
}
