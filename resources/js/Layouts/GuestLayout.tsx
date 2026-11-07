import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { BrandIdentity } from '@/Components/BrandIdentity';
import { PwaStatusBanner } from '@/Components/PwaStatusBanner';
import { ThemeToggle } from '@/Components/ThemeToggle';
import type { PageProps } from '@/types';

export default function GuestLayout({ children }: PropsWithChildren) {
    const { company } = usePage<PageProps>().props;

    return (
        <div className="relative flex min-h-[100dvh] flex-col justify-between overflow-hidden bg-background px-4 py-8 sm:px-6">
            <PwaStatusBanner />

            {/* Subtle ambient background glow */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className="size-[500px] rounded-full bg-primary/5 blur-3xl" />
            </div>

            {/* Top Bar: Theme toggle */}
            <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
                <ThemeToggle />
            </div>

            {/* Centered Auth Card Container */}
            <main className="relative z-10 my-auto flex w-full flex-col items-center justify-center">
                <div className="w-full max-w-[400px]">
                    <div className="mb-6 flex justify-center">
                        <Link
                            href="/"
                            className="inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <BrandIdentity name={company.name} logoUrl={company.logoUrl} />
                        </Link>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
                        {children}
                    </div>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        © {new Date().getFullYear()} {company.name}
                    </p>
                </div>
            </main>
        </div>
    );
}
