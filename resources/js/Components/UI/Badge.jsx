/**
 * Badge — inline status/label chip.
 *
 * Uses solid CSS-var colors (same style as the Visa agent code pills)
 * so they look correct in both light and dark mode without Tailwind
 * dark-mode hacks.
 *
 * Corner radius driven by --radius-md token (8px).
 *
 * Props:
 *   variant  : 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'
 *   children : ReactNode
 *   className: string
 */

const VARIANT_STYLES = {
    // ── Branding green — completed / confirmed / approved / paid / active
    primary : {
        background: 'var(--color-primary)',
        color     : '#fff',
    },
    // Same as primary — alias so existing 'success' mappings get the green pill
    success : {
        background: 'var(--color-primary)',
        color     : '#fff',
    },
    // Amber — pending / in-progress
    warning : {
        background: 'var(--color-warning)',
        color     : '#fff',
    },
    // Red — denied / cancelled / overdue / unpaid
    error   : {
        background: 'var(--color-error)',
        color     : '#fff',
    },
    // Blue — on process / sent / info states
    info    : {
        background: 'var(--color-info)',
        color     : '#fff',
    },
    // Muted — refunded / draft / inactive / neutral states
    neutral : {
        background: 'var(--color-text-muted)',
        color     : '#fff',
    },
};

export default function Badge({ variant = 'neutral', children, className = '' }) {
    const style = VARIANT_STYLES[variant] ?? VARIANT_STYLES.neutral;

    return (
        <span
            className={[
                'inline-flex items-center',
                'font-semibold',
                'font-body',
                'whitespace-nowrap',
                className,
            ].join(' ')}
            style={{
                fontSize     : 'var(--badge-font-size)',
                borderRadius : 'var(--radius-md)',
                lineHeight   : 1,
                paddingLeft  : 'var(--badge-px)',
                paddingRight : 'var(--badge-px)',
                paddingTop   : 'var(--badge-py)',
                paddingBottom: 'var(--badge-py)',
                background   : style.background,
                color        : style.color,
                width        : 'fit-content',
            }}
        >
            {children}
        </span>
    );
}
