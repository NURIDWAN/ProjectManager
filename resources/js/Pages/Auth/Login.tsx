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

            <div className="mb-7">
                <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">Selamat datang kembali</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Masukkan kredensial Anda untuk melanjutkan pekerjaan.
                </p>
            </div>

            {status && (
                <div role="status" className="mb-5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
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
                            className="h-11 pl-10"
                            aria-invalid={Boolean(errors.email)}
                            onChange={(event) => setData('email', event.target.value)}
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="password">Password</Label>
                        {canResetPassword && (
                            <Link href={route('password.request')} className="text-xs font-semibold text-primary hover:underline">
                                Lupa password?
                            </Link>
                        )}
                    </div>
                    <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            autoComplete="current-password"
                            placeholder="Masukkan password"
                            className="h-11 px-10"
                            aria-invalid={Boolean(errors.password)}
                            onChange={(event) => setData('password', event.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((visible) => !visible)}
                            className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                        >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} />
                </div>

                <div className="flex items-center gap-2.5">
                    <Checkbox
                        id="remember"
                        checked={data.remember}
                        onCheckedChange={(checked) => setData('remember', checked === true)}
                    />
                    <Label htmlFor="remember" className="cursor-pointer font-normal text-muted-foreground">
                        Ingat saya di perangkat ini
                    </Label>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={processing}>
                    {processing ? 'Memproses...' : 'Masuk'}
                </Button>
            </form>
        </GuestLayout>
    );
}
