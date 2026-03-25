import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'amber';

interface BadgeProps {
    variant?: BadgeVariant;
    children: ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    green: 'bg-transparent text-[#10B981] border-[#10B981]',
    red: 'bg-transparent text-[#E53935] border-[#E53935]',
    yellow: 'bg-transparent text-[#F5A623] border-[#F5A623]',
    blue: 'bg-transparent text-[#3B82F6] border-[#3B82F6]',
    amber: 'bg-transparent text-amber-500 border-amber-500',
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
