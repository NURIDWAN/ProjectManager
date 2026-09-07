import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { BrandIdentity } from '@/Components/BrandIdentity';
import { ThemeToggle } from '@/Components/ThemeToggle';
import type { PageProps } from '@/types';

const capabilities = [
    'Laporan kerja terpusat',
    'Dokumen BAP dan BAST',
    'Invoice serta pemantauan piutang',
];

export default function GuestLayout({ children }: PropsWithChildren) {
    const { company } = usePage<PageProps>().props;

    return (
        <div className="grid min-h-[100dvh] bg-background lg:grid-cols-[minmax(360px,0.8fr)_minmax(520px,1.2fr)]">
            <aside className="relative hidden overflow-hidden bg-[oklch(0.22_0.075_255)] p-10 text-white lg:flex lg:flex-col xl:p-14">
                <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(oklch(1_0_0/0.06)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/0.06)_1px,transparent_1px)] [background-size:56px_56px]" />
                <div className="pointer-events-none absolute -bottom-32 -right-24 size-[420px] rounded-full bg-blue-400/15 blur-3xl" />
                <Link href="/" className="relative w-fit rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                    <BrandIdentity name={company.name} logoUrl={company.logoUrl} inverse />
                </Link>

                <div className="relative my-auto max-w-lg py-16">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">Satu ruang kerja</p>
                    <h1 className="mt-5 max-w-md text-4xl font-bold leading-[1.08] tracking-[-0.04em] xl:text-5xl">
                        Pekerjaan selesai. Dokumen siap. Tagihan terkendali.
                    </h1>
                    <p className="mt-5 max-w-md text-base leading-relaxed text-blue-100/70">
                        Kelola alur operasional teknisi hingga invoice dalam satu sistem yang dapat ditelusuri.
                    </p>
                    <div className="mt-10 space-y-3">
                        {capabilities.map((capability) => (
                            <div key={capability} className="flex items-center gap-3 text-sm text-blue-50/85">
                                <CheckCircle2 className="size-4 text-blue-300" strokeWidth={1.8} />
                                <span>{capability}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative text-xs text-blue-100/45">
                    Akses aman untuk tim operasional perusahaan.
                </p>
            </aside>

            <main className="relative flex min-h-[100dvh] items-center justify-center px-5 py-10 sm:px-8">
                <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
                    <ThemeToggle />
                </div>
                <div className="w-full max-w-md">
                    <Link href="/" className="mb-10 inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
                        <BrandIdentity name={company.name} logoUrl={company.logoUrl} />
                    </Link>
                    <div className="rounded-xl border bg-card p-6 shadow-[0_12px_40px_oklch(0.2_0.04_255/0.08)] sm:p-8">
                        {children}
                    </div>
                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        © {new Date().getFullYear()} {company.name}. Hak cipta dilindungi.
                    </p>
                </div>
            </main>
        </div>
    );
}
