import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    title: string;
    description: string;
    action?: ReactNode;
    icon?: ReactNode;
    className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
    return (
        <div className={cn('flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/25 px-6 py-12 text-center', className)}>
            <div className="mb-4 flex size-11 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-xs">
                {icon ?? <Inbox className="size-5" />}
            </div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
