import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'interactive';
    children: ReactNode;
}

export function Card({ variant = 'default', children, className, ...props }: CardProps) {
    const variants = {
        default: 'bg-bg-surface border-border-subtle',
        elevated: 'bg-bg-elevated border-border-default',
        interactive: [
            'bg-bg-surface border-border-subtle',
            'hover:border-white/10',
            'interactive cursor-pointer',
        ],
    };

    return (
        <div
            className={cn(
                'rounded-[4px] border p-5',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
