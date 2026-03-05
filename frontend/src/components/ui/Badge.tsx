import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'amber';

interface BadgeProps {
    variant?: BadgeVariant;
    children: ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    green: 'bg-green-dim text-green-500 border-green-500/40',
    red: 'bg-red-dim text-red-500 border-red-500/40',
    yellow: 'bg-yellow-dim text-yellow-500 border-yellow-500/40',
    blue: 'bg-blue-dim text-blue-500 border-blue-500/40',
    amber: 'bg-amber-dim text-amber-500 border-amber-500/40',
};

export function Badge({ variant = 'amber', children, className }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center',
                'font-mono text-[9px] font-normal tracking-[0.06em] uppercase',
                'px-2 py-0.5 rounded-[2px] border',
                variantStyles[variant],
                className
            )}
        >
            {children}
        </span>
    );
}
