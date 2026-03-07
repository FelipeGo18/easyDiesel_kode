import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';

interface KpiCardProps {
    label: string;
    value: string;
    trend?: { direction: 'up' | 'down' | 'neutral'; text: string };
    icon?: ReactNode;
    className?: string;
    delay?: number;
}

export function KpiCard({ label, value, trend, icon, className, delay = 0 }: KpiCardProps) {
    const trendColors = {
        up: 'text-green-500',
        down: 'text-red-500',
        neutral: 'text-text-muted',
    };

    const iconName = trend
        ? trend.direction === 'up' ? 'trending-up'
            : trend.direction === 'down' ? 'trending-down'
                : 'minus'
        : null;

    return (
        <div
            className={cn(
                'bg-bg-surface border border-border-subtle rounded-brand p-5',
                'animate-enter',
                className
            )}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-label text-text-secondary">{label}</span>
                {icon && (
                    <span className="text-amber-500 opacity-60">{icon}</span>
                )}
            </div>

            {/* Value */}
            <div className="kpi-value" style={{ animationDelay: `${delay + 100}ms` }}>
                <span className="font-display text-[48px] leading-none text-text-primary tracking-wide">
                    {value}
                </span>
            </div>

            {trend && iconName && (
                <div className={cn('flex items-center gap-1.5 mt-3', trendColors[trend.direction])}>
                    <Icon name={iconName} size={12} />
                    <span className="font-mono text-[10px] tracking-wider">{trend.text}</span>
                </div>
            )}
        </div>
    );
}
