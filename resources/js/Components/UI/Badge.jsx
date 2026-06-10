/**
 * Badge — inline status/label chip.
 *
 * Corner radius driven by --radius-md token (8px).
 * Change the token in app.css → all badges update.
 *
 * Props:
 *   variant  : 'success' | 'warning' | 'error' | 'info' | 'neutral'  (default: 'neutral')
 *   children : ReactNode
 *   className: string
 */
export default function Badge({ variant = 'neutral', children, className = '' }) {
    const variants = {
        success : 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400',
        warning : 'bg-amber-100  text-amber-800  dark:bg-amber-900/30  dark:text-amber-400',
        error   : 'bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400',
        info    : 'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400',
        neutral : 'bg-gray-100   text-gray-700   dark:bg-gray-700      dark:text-gray-300',
    };

    return (
        <span
            className={[
                'inline-flex items-center',
                'font-semibold',
                'font-body',
                'whitespace-nowrap',
                variants[variant] ?? variants.neutral,
                className,
            ].join(' ')}
            style={{
                fontSize      : 'var(--badge-font-size)',
                borderRadius  : 'var(--radius-md)',
                lineHeight    : 1,
                paddingLeft   : 'var(--badge-px)',
                paddingRight  : 'var(--badge-px)',
                paddingTop    : 'var(--badge-py)',
                paddingBottom : 'var(--badge-py)',
            }}
        >
            {children}
        </span>
    );
}
