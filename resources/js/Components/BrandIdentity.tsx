import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandIdentityProps {
    name: string;
    logoUrl?: string | null;
    compact?: boolean;
    inverse?: boolean;
    className?: string;
}

export function BrandIdentity({
    name,
    logoUrl,
    compact = false,
    inverse = false,
    className,
}: BrandIdentityProps) {
    return (
        <div className={cn('flex min-w-0 items-center gap-3', className)}>
            <div
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border',
                    inverse
                        ? 'border-white/15 bg-white/10 text-white'
                        : 'border-primary/15 bg-primary text-primary-foreground',
                )}
            >
                {logoUrl ? (
                    <img src={logoUrl} alt="" className="size-full object-contain p-1" />
                ) : (
                    <Building2 className="size-4.5" strokeWidth={1.8} />
                )}
            </div>
            {!compact && (
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold tracking-[-0.01em]">{name}</p>
                    <p className={cn('truncate text-[11px]', inverse ? 'text-white/55' : 'text-muted-foreground')}>
                        Operasional proyek
                    </p>
                </div>
            )}
        </div>
    );
}
