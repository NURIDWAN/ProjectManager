import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Lupa Password" />

            <div className="mb-6 text-center">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Reset Password</h1>
                <p className="mt-1 text-xs text-muted-foreground">
                    Masukkan email untuk menerima tautan reset password.
                </p>
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
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                <Button type="submit" className="w-full font-medium" disabled={processing}>
                    {processing ? 'Mengirim...' : 'Kirim Tautan Reset'}
                </Button>

                <div className="text-center pt-2">
                    <Link
                        href={route('login')}
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                        Kembali ke halaman masuk
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
