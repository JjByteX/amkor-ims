import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * SlideOver — right-aligned drawer panel.
 *
 * Renders via a portal so it always sits above the page regardless of
 * stacking context. Uses the same backdrop + Escape-key patterns as Modal.jsx.
 *
 * Props:
 *   open     : bool
 *   onClose  : fn
 *   title    : string
 *   children : ReactNode   (scrollable body content)
 *   footer   : ReactNode   (sticky footer — action buttons)
 *   width    : string      (CSS value, default '480px'; full-width on mobile)
 */
export default function SlideOver({
    open     = false,
    onClose,
    title    = '',
    children,
    footer,
    width    = '480px',
}) {
    const panelRef = useRef(null);

    // Escape key
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Body scroll lock
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // Focus trap on open
    useEffect(() => {
        if (open && panelRef.current) {
            const focusable = panelRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length) focusable[0].focus();
        }
    }, [open]);

    return createPortal(
        <AnimatePresence>
            {open && (
                /* Backdrop */
                <motion.div
                    key="slideover-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex justify-end"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
                    aria-modal="true"
                    role="dialog"
                    aria-label={title}
                >
                    {/* Panel */}
                    <motion.div
                        ref={panelRef}
                        key="slideover-panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 0.9 }}
                        className="flex flex-col h-full"
                        style={{
                            width,
                            maxWidth: '100vw',
                            background  : 'var(--color-card)',
                            borderLeft  : 'var(--border-container)',
                            boxShadow   : '-8px 0 40px rgba(0,0,0,0.15)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-6 py-4 shrink-0"
                            style={{ borderBottom: 'var(--border-container)' }}
                        >
                            <h2
                                className="font-heading font-bold text-[var(--color-text)]"
                                style={{ fontSize: 'var(--font-size-heading)', lineHeight: 'var(--line-height-tight)', margin: 0 }}
                            >
                                {title}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                style={{ borderRadius: 'var(--radius-md)' }}
                                aria-label="Close"
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
                            <div
                                className="flex items-center justify-end gap-2 px-6 py-4 shrink-0"
                                style={{ borderTop: 'var(--border-container)' }}
                            >
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
