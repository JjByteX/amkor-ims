import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   Context + Provider
   ───────────────────────────────────────────────────────────────────────────── */

const ToastContext = createContext(null);

let _id = 0;
const nextId = () => ++_id;

/**
 * ToastProvider — wrap your app (or AppShell) with this once.
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(({ variant = 'info', title = '', message = '', duration = 4000 }) => {
        const id = nextId();
        setToasts((prev) => {
            const next = [...prev, { id, variant, title, message, duration }];
            return next.length > 3 ? next.slice(next.length - 3) : next;
        });
        if (duration > 0) {
            setTimeout(() => dismiss(id), duration);
        }
        return id;
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ addToast, dismiss }}>
            {children}
            <ToastStack toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hook
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * useToast — consume anywhere inside ToastProvider.
 *
 * Returns: { toast, dismiss }
 * toast({ variant, title, message, duration })
 *   — shorthand: toast.success(msg), toast.error(msg), toast.warning(msg), toast.info(msg)
 */
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');

    const toast = useCallback((opts) => ctx.addToast(opts), [ctx]);
    toast.success = (message, opts = {}) => ctx.addToast({ ...opts, variant: 'success', message });
    toast.error   = (message, opts = {}) => ctx.addToast({ ...opts, variant: 'error',   message });
    toast.warning = (message, opts = {}) => ctx.addToast({ ...opts, variant: 'warning', message });
    toast.info    = (message, opts = {}) => ctx.addToast({ ...opts, variant: 'info',    message });

    return { toast, dismiss: ctx.dismiss };
}

/* ─────────────────────────────────────────────────────────────────────────────
   UI — Toast stack (bottom-right)
   Corner radius driven by --radius-md token (8px).
   ───────────────────────────────────────────────────────────────────────────── */

const ICONS = {
    success : <CheckCircle  size={18} className="text-[var(--color-success)] shrink-0" />,
    warning : <AlertTriangle size={18} className="text-[var(--color-warning)] shrink-0" />,
    error   : <XCircle      size={18} className="text-[var(--color-error)]   shrink-0" />,
    info    : <Info          size={18} className="text-[var(--color-info)]    shrink-0" />,
};

function ToastItem({ toast, onDismiss }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            role="alert"
            aria-live="polite"
            className={[
                'flex items-start gap-3',
                'min-w-[280px] max-w-[360px]',
                'px-4 py-3',
                'bg-[var(--color-card)]',
                'border border-gray-100 dark:border-gray-700',
                'font-body text-sm text-[var(--color-text)]',
            ].join(' ')}
            style={{
                opacity     : visible ? 1 : 0,
                transform   : visible ? 'translateY(0)' : 'translateY(8px)',
                transition  : 'opacity 0.2s ease, transform 0.2s ease',
                borderRadius: 'var(--radius-md)',
                boxShadow   : '0 4px 6px -6px rgba(0,0,0,0.015),0 3px 4px -4px rgba(0,0,0,0.012),0 2px 2px -2px rgba(0,0,0,0.010),0 1px 1px -1px rgba(0,0,0,0.008)',
            }}
        >
            {ICONS[toast.variant] ?? ICONS.info}

            <div className="flex-1 min-w-0">
                {toast.title   && <p className="font-semibold text-[13px] mb-0.5">{toast.title}</p>}
                {toast.message && <p className="text-[13px] opacity-80">{toast.message}</p>}
            </div>

            <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 p-0.5 opacity-40 hover:opacity-80 transition-opacity"
                style={{ borderRadius: 'var(--radius-md)' }}
                aria-label="Close"
            >
                <X size={14} />
            </button>
        </div>
    );
}

function ToastStack({ toasts, onDismiss }) {
    if (!toasts.length) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem toast={t} onDismiss={onDismiss} />
                </div>
            ))}
        </div>
    );
}
