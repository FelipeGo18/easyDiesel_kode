import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = '480px' }: ModalProps) {
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

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-bg-base border border-border-subtle rounded-brand shadow-2xl animate-enter w-full overflow-hidden"
                style={{ maxWidth }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                    <h2 className="text-h2 text-text-primary">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-text-primary"
                    >
                        <Icon name="close" size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
