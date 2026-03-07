import { useState, useCallback, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ToastContext, type ToastContextValue, type ToastItem, type ToastType } from '@/components/ui/ToastContext';

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const remove = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const add = useCallback((type: ToastType, message: string) => {
        const id = nextId++;
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => remove(id), 4000);
    }, [remove]);

    const ctx: ToastContextValue = {
        success: (msg) => add('success', msg),
        error: (msg) => add('error', msg),
    };

    return (
        <ToastContext.Provider value={ctx}>
            {children}

            {/* Toast container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`flex items-start gap-2.5 px-4 py-3 rounded-brand border shadow-xl animate-enter ${t.type === 'success'
                            ? 'bg-bg-base border-green-500/30'
                            : 'bg-bg-base border-red-500/30'
                            }`}
                    >
                        {t.type === 'success' ? (
                            <Icon name="check" size={16} className="text-green-500 shrink-0 mt-0.5" />
                        ) : (
                            <Icon name="alert" size={16} className="text-red-500 shrink-0 mt-0.5" />
                        )}
                        <p className="text-[13px] text-text-primary font-sans flex-1">{t.message}</p>
                        <Icon name="close" size={14} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

