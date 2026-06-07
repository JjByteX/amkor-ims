import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal — accessible dialog overlay.
 *
 * Panel uses --radius-lg (16px) — the only surface that does.
 * All interactive elements inside (close button) use --radius-md (8px).
 *
 * Props:
 *   open     : bool
 *   onClose  : fn
 *   title    : string
 *   size     : 'default' (480px) | 'wide' (720px)
 *   children : ReactNode  (body content)
 *   footer   : ReactNode  (action buttons slot)
 */
export default function Modal({
    open     = false,
    onClose,
    title    = '',
    size     = 'default',
    children,
    footer,
}) {
    const dialogRef = useRef(null);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Lock body scroll while open
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // Focus trap — move focus into dialog on open
    useEffect(() => {
        if (open && dialogRef.current) {
            const focusable = dialogRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length) focusable[0].focus();
        }
    }, [open]);

    if (!open) return null;

    const widths = {
        default : 'max-w-[480px]',
        wide    : 'max-w-[720px]',
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            {/* Panel — uses --radius-lg (16px), the only surface that does */}
            <div
                ref={dialogRef}
                className={[
                    'relative w-full',
                    widths[size] ?? widths.default,
                    'bg-[var(--color-card)]',
                    'flex flex-col',
                    'max-h-[90vh]',
                ].join(' ')}
                style={{
                    borderRadius: 'var(--radius-lg)',
                    border      : 'var(--border-container)',
                    boxShadow   : '0 24px 80px -32px rgba(15,23,42,0.45), var(--shadow-card)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: 'var(--border-container)' }}>
                    <h2
                        className="font-heading font-bold text-[var(--color-text)]"
                        style={{ fontSize: 'var(--font-size-heading)', lineHeight: 'var(--line-height-tight)' }}
                    >
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        style={{ borderRadius: 'var(--radius-md)' }}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 font-body text-sm text-[var(--color-text)]">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-2 px-6 py-4 shrink-0" style={{ borderTop: 'var(--border-container)' }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
