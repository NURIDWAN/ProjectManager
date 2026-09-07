import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verifikasi Email" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-[-0.03em]">Verifikasi email Anda</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Buka tautan yang kami kirim ke email Anda. Jika belum diterima, kirim ulang tautan verifikasi.</p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    Tautan verifikasi baru sudah dikirim ke email Anda.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        Kirim Ulang Verifikasi
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm font-semibold text-primary underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Keluar
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
