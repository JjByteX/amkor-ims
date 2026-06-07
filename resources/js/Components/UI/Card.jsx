/**
 * Card — surface container with brand shadow, 16px radius, and container border.
 *
 * Uses --radius-lg (16px) — Card and Modal panel are the only two surfaces
 * that use the large radius.  All other elements (buttons, inputs, badges,
 * table wrapper, etc.) use --radius-md (8px).
 *
 * Padding is controlled by the design token --space-card (24px) by default.
 * Use compact={true} for denser contexts such as filter bars (drops to 16px
 * via --space-2). No arbitrary padding strings are accepted — all cards in
 * the system must use one of these two values.
 *
 * Border is driven by --border-container token in app.css.
 * Change the token once → all cards update.
 *
 * Props:
 *   children  : ReactNode
 *   className : string
 *   compact   : bool     (default false — uses --space-card / 24px)
 *   as        : string   (HTML element, default 'div')
 *   style     : object   (optional inline style overrides)
 */
export default function Card({
    children,
    className = '',
    compact   = false,
    as        = 'div',
    style     = {},
    ...rest
}) {
    const Tag = as;

    return (
        <Tag
            className={[
                'bg-[var(--color-card)]',
                className,
            ].join(' ')}
            style={{
                padding     : compact ? 'var(--space-2)' : 'var(--space-card)',
                border      : 'var(--border-container)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: [
                    '0 4px 6px -6px rgba(0,0,0,0.015)',
                    '0 3px 4px -4px rgba(0,0,0,0.012)',
                    '0 2px 2px -2px rgba(0,0,0,0.010)',
                    '0 1px 1px -1px rgba(0,0,0,0.008)',
                ].join(','),
                ...style,
            }}
            {...rest}
        >
            {children}
        </Tag>
    );
}
