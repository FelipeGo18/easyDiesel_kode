import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
    bodyClassName?: string;
    className?: string;
    headerClassName?: string;
    fullscreen?: boolean;
}

export function Modal({
    open,
    onClose,
    title,
    children,
    maxWidth = '480px',
    bodyClassName,
    className,
    headerClassName,
    fullscreen = false,
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            ref={overlayRef}
            className={cn(
                'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto',
                fullscreen ? 'p-0' : 'p-3 sm:p-4'
            )}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className={cn(
                    'relative flex w-full flex-col overflow-hidden bg-bg-base shadow-2xl animate-enter',
                    fullscreen
                        ? 'h-[100dvh] max-h-[100dvh] rounded-none border-0'
                        : 'my-3 max-h-[calc(100vh-24px)] rounded-brand border border-border-subtle sm:my-4 sm:max-h-[calc(100vh-32px)]',
                    className
                )}
                style={{ maxWidth }}
            >
                {/* Header */}
                <div className={cn('flex items-center justify-between border-b border-border-subtle px-5 py-4', headerClassName)}>
                    <h2 className="text-h2 text-text-primary">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-text-primary"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', fullscreen && 'px-0 py-0', bodyClassName)}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
