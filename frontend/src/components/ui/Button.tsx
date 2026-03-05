import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
    isLoading?: boolean;
}

export function Button({
    variant = 'primary',
    size = 'md',
    children,
    isLoading = false,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const base = [
        'inline-flex items-center justify-center gap-2',
        'font-mono font-semibold uppercase tracking-wider',
        'rounded-[var(--radius-brand)] border',
        'interactive cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed',
    ];

    const variants = {
        primary: [
            'bg-amber-500 text-text-inverted border-amber-500',
            'hover:bg-amber-600 hover:border-amber-600',
        ],
        ghost: [
            'bg-transparent text-text-secondary border-border-strong',
            'hover:bg-bg-elevated hover:text-text-primary',
        ],
        danger: [
            'bg-transparent text-red-500 border-red-500/30',
            'hover:bg-red-dim hover:border-red-500',
        ],
    };

    const sizes = {
        sm: 'text-[10px] px-3 py-1.5 tracking-[0.06em]',
        md: 'text-[11px] px-4 py-2 tracking-[0.05em]',
        lg: 'text-[12px] px-6 py-2.5 tracking-[0.05em]',
    };

    return (
        <button
            className={cn(base, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    );
}
