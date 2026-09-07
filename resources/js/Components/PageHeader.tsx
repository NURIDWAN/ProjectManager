import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
    return (
        <div className={cn('flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-[-0.02em] text-foreground sm:text-2xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}
