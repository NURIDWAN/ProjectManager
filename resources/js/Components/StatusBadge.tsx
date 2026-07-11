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
        className: 'bg-gray-100 text-gray-700 border-gray-200',
    },
    submitted: {
        label: 'Submitted',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    approved: {
        label: 'Approved',
        className: 'bg-green-100 text-green-700 border-green-200',
    },
    paid: {
        label: 'Paid',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    overdue: {
        label: 'Overdue',
        className: 'bg-red-100 text-red-700 border-red-200',
    },
    unpaid: {
        label: 'Unpaid',
        className: 'bg-amber-100 text-amber-700 border-amber-200',
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
