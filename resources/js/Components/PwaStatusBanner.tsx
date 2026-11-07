import { useState } from 'react';
import { Download, RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import { usePwa } from '@/hooks/usePwa';
import { Button } from '@/components/ui/button';

export function PwaStatusBanner() {
    const { isOnline, wasOffline, canInstall, isInstalled, isIos, promptInstall } = usePwa();
    const [dismissInstall, setDismissInstall] = useState(false);
    const [installing, setInstalling] = useState(false);

    const handleInstall = async () => {
        setInstalling(true);
        try {
            await promptInstall();
        } finally {
            setInstalling(false);
        }
    };

    return (
        <aside aria-label="Status koneksi dan aplikasi" className="relative z-50">
            {/* Offline Alert Banner */}
            {!isOnline && (
                <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300">
                    <div className="flex items-center gap-2">
                        <WifiOff className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>
                            <strong>Mode Offline:</strong> Koneksi internet terputus. Pekerjaan yang tersimpan lokal tetap aman.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="inline-flex shrink-0 items-center gap-1 font-medium underline underline-offset-2 hover:opacity-80"
                    >
                        <RefreshCw className="size-3" />
                        Coba lagi
                    </button>
                </div>
            )}

            {/* Back Online Toast */}
            {isOnline && wasOffline && (
                <div className="flex items-center justify-center gap-2 border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-1 duration-300">
                    <Wifi className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Koneksi internet kembali terhubung.</span>
                </div>
            )}

            {/* Android / Desktop Install Prompt Banner */}
            {canInstall && !dismissInstall && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-500/20 bg-blue-50 px-4 py-2 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                    <div className="flex items-center gap-2">
                        <Download className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>
                            Pasang <strong>ManPro</strong> di layar utama perangkat Anda untuk akses instan dan lebih cepat.
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="default"
                            className="h-7 px-3 text-xs"
                            onClick={handleInstall}
                            disabled={installing}
                        >
                            {installing ? 'Memasang...' : 'Pasang Aplikasi'}
                        </Button>
                        <button
                            type="button"
                            onClick={() => setDismissInstall(true)}
                            className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
                            aria-label="Tutup saran pemasangan"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* iOS Safari Install Guidance */}
            {isIos && !isInstalled && !dismissInstall && !canInstall && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-500/20 bg-blue-50 px-4 py-2 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                    <div className="flex items-center gap-2">
                        <Download className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>
                            Pasang di iPhone/iPad: Tekan tombol <strong>Bagikan</strong> (ikon kotak panah ke atas) lalu pilih <strong>Tambahkan ke Layar Utama</strong>.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDismissInstall(true)}
                        className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
                        aria-label="Tutup panduan"
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            )}
        </aside>
    );
}

export function PwaInstallButton({ className = '' }: { className?: string }) {
    const { canInstall, promptInstall } = usePwa();
    const [installing, setInstalling] = useState(false);

    if (!canInstall) return null;

    const handleInstall = async () => {
        setInstalling(true);
        try {
            await promptInstall();
        } finally {
            setInstalling(false);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleInstall}
            disabled={installing}
            className={className}
        >
            <Download className="mr-1.5 size-3.5" />
            {installing ? 'Memasang...' : 'Pasang Aplikasi'}
        </Button>
    );
}
