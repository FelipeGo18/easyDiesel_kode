import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    success: (message: string) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

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
                            <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        )}
                        <p className="text-[13px] text-text-primary font-sans flex-1">{t.message}</p>
                        <button onClick={() => remove(t.id)} className="text-text-muted hover:text-text-primary shrink-0">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
