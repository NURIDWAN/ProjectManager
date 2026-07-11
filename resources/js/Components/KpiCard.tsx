import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
    label: string;
    value: string | number;
    icon?: ReactNode;
    description?: string;
    className?: string;
    trend?: {
        value: number;
        label?: string;
    };
    iconColor?: 'default' | 'blue' | 'emerald' | 'amber' | 'rose';
}

const iconColorMap = {
    default: 'bg-muted text-muted-foreground',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
};

export function KpiCard({
    label,
    value,
    icon,
    description,
    className,
    trend,
    iconColor = 'default',
}: KpiCardProps) {
    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                            {label}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold tracking-tight">
                                {value}
                            </p>
                            {trend && (
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium',
                                        trend.value >= 0
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                            : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                                    )}
                                >
                                    {trend.value >= 0 ? '+' : ''}
                                    {trend.value}%
                                </span>
                            )}
                        </div>
                        {description && (
                            <p className="text-xs text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    {icon && (
                        <div
                            className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                                iconColorMap[iconColor]
                            )}
                        >
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
