import { cn } from '@/lib/utils';

interface KpiCardProps {
    label: string;
    value: string | number;
    description?: string;
    className?: string;
}

export function KpiCard({ label, value, description, className }: KpiCardProps) {
    return (
        <div className={cn('min-w-0 p-5 sm:p-6', className)}>
            <div className="space-y-3">
                <p className="truncate text-3xl font-semibold tabular-nums tracking-[-0.04em] text-foreground sm:text-4xl">
                    {value}
                </p>
                <div className="space-y-1">
                    <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">{label}</p>
                    {description && <p className="max-w-[22ch] text-xs leading-relaxed text-muted-foreground">{description}</p>}
                </div>
            </div>
        </div>
    );
}
