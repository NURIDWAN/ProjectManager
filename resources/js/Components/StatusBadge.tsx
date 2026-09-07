import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType = 'draft' | 'submitted' | 'approved' | 'paid' | 'overdue' | 'unpaid';

interface StatusBadgeProps {
    status: StatusType;
    className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
    draft: {
        label: 'Draft',
        className: 'border-border bg-muted text-muted-foreground',
    },
    submitted: {
        label: 'Submitted',
        className: 'border-primary/20 bg-primary/10 text-primary',
    },
    approved: {
        label: 'Approved',
        className: 'border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    paid: {
        label: 'Paid',
        className: 'border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    overdue: {
        label: 'Overdue',
        className: 'border-destructive/20 bg-destructive/10 text-destructive',
    },
    unpaid: {
        label: 'Unpaid',
        className: 'border-amber-600/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status];

    if (!config) {
        return (
            <Badge variant="outline" className={className}>
                {status}
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className={cn(config.className, className)}
        >
            {config.label}
        </Badge>
    );
}
