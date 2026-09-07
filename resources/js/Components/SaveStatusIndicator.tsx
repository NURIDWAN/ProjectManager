import { useEffect, useState } from 'react';
import { Check, CloudUpload, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SaveState } from '@/hooks/useWorkReportAutosave';

interface SaveStatusIndicatorProps {
    state: SaveState;
    lastSavedAt: string | null;
    className?: string;
}

const formatTime = (iso: string): string =>
    new Date(iso).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });

export function SaveStatusIndicator({ state, lastSavedAt, className }: SaveStatusIndicatorProps) {
    const [savedLabel, setSavedLabel] = useState('');

    // Rerender once per minute so "5 menit lalu" stays accurate.
    useEffect(() => {
        if (!lastSavedAt) return;

        const update = () => {
            const saved = new Date(lastSavedAt).getTime();
            const diffMinutes = Math.max(0, Math.round((Date.now() - saved) / 60000));
            setSavedLabel(diffMinutes < 1 ? 'baru saja' : `${diffMinutes} menit lalu`);
        };

        update();
        const interval = setInterval(update, 60000);

        return () => clearInterval(interval);
    }, [lastSavedAt]);

    if (state === 'idle') {
        return (
            <p className={cn('text-xs text-muted-foreground', className)}>
                Perubahan akan tersimpan otomatis
            </p>
        );
    }

    if (state === 'dirty') {
        return (
            <p className={cn('text-xs text-amber-600', className)}>Perubahan belum tersimpan</p>
        );
    }

    if (state === 'saving') {
        return (
            <p className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
                <CloudUpload className="size-3.5 animate-pulse" />
                Menyimpan…
            </p>
        );
    }

    if (state === 'error') {
        return (
            <p className={cn('flex items-center gap-1.5 text-xs text-destructive', className)}>
                <TriangleAlert className="size-3.5" />
                Gagal menyimpan — perubahan akan dicoba lagi
            </p>
        );
    }

    return (
        <p className={cn('flex items-center gap-1.5 text-xs text-emerald-600', className)}>
            <Check className="size-3.5" />
            Tersimpan otomatis {lastSavedAt ? formatTime(lastSavedAt) : ''} ({savedLabel})
        </p>
    );
}
