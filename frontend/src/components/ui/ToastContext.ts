import { createContext } from 'react';

export type ToastType = 'success' | 'error';

export interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
}

export interface ToastContextValue {
    success: (message: string) => void;
    error: (message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);