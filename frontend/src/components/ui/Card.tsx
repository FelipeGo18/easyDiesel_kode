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
            'hover:border-border-strong hover:bg-bg-elevated',
            'interactive cursor-pointer',
        ],
    };

    return (
        <div
            className={cn(
                'rounded-[var(--radius-brand)] border p-5',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
