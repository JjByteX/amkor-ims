import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

/**
 * Alert — inline feedback message.
 *
 * Corner radius driven by --radius-md token (8px).
 *
 * Props:
 *   variant  : 'success' | 'warning' | 'error' | 'info'  (default: 'info')
 *   title    : string   (optional bold heading)
 *   children : ReactNode
 *   onClose  : fn       (renders X button when provided)
 *   className: string
 */
export default function Alert({
    variant  = 'info',
    title    = '',
    children,
    onClose,
    className = '',
}) {
    const config = {
        success : {
            icon  : CheckCircle,
            bg    : 'bg-green-50  dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800',
            icon_c: 'text-[var(--color-success)]',
            text  : 'text-green-800 dark:text-green-300',
        },
        warning : {
            icon  : AlertTriangle,
            bg    : 'bg-amber-50  dark:bg-amber-900/20',
            border: 'border-amber-200 dark:border-amber-800',
            icon_c: 'text-[var(--color-warning)]',
            text  : 'text-amber-800 dark:text-amber-300',
        },
        error : {
            icon  : XCircle,
            bg    : 'bg-red-50    dark:bg-red-900/20',
            border: 'border-red-200   dark:border-red-800',
            icon_c: 'text-[var(--color-error)]',
            text  : 'text-red-800   dark:text-red-300',
        },
        info : {
            icon  : Info,
            bg    : 'bg-blue-50   dark:bg-blue-900/20',
            border: 'border-blue-200  dark:border-blue-800',
            icon_c: 'text-[var(--color-info)]',
            text  : 'text-blue-800  dark:text-blue-300',
        },
    };

    const c    = config[variant] ?? config.info;
    const Icon = c.icon;

    return (
        <div
            role="alert"
            className={[
                'flex gap-3 items-start',
                'border',
                'px-4 py-3',
                'font-body text-sm',
                c.bg,
                c.border,
                c.text,
                className,
            ].join(' ')}
            style={{ borderRadius: 'var(--radius-md)' }}
        >
            <Icon size={20} className={`shrink-0 mt-0.5 ${c.icon_c}`} />

            <div className="flex-1 min-w-0">
                {title && <p className="font-semibold mb-0.5">{title}</p>}
                {children && <div>{children}</div>}
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="shrink-0 p-0.5 opacity-60 hover:opacity-100 transition-opacity"
                    style={{ borderRadius: 'var(--radius-md)' }}
                    aria-label="Dismiss"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}
