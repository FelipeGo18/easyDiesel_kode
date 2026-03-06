import React from 'react';
import { cn } from '@/lib/utils';

export interface IconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    name: string;
    size?: number | string;
    strokeWidth?: number | string;
}

export function Icon({ name, size = 24, strokeWidth, className, ...props }: IconProps) {
    return (
        <img
            src={`/icons/${name}.svg`}
            alt={`${name} icon`}
            width={size}
            height={size}
            className={cn('inline-block shrink-0', className)}
            {...props}
        />
    );
}
