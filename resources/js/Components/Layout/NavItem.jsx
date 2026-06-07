import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';

/**
 * NavItem — sidebar navigation link.
 *
 * Corner radius driven by --radius-md token (8px).
 * Text colors use --color-text and --color-text-muted tokens (never
 * hardcoded Tailwind gray classes) so dark mode is always correct.
 *
 * Props:
 *   href     : string             (route URL)
 *   icon     : ReactNode          (Lucide icon, 20px)
 *   label    : string
 *   activeOn : string[]           (optional extra active URL prefixes)
 *   children : NavItem[]          (nested sub-items)
 *   collapsed: bool               (sidebar collapsed state)
 */
export default function NavItem({ href, icon, label, activeOn = [], inactiveOn = [], children, collapsed = false }) {
    const { url } = usePage();
    const hasChildren = !!children;
    const matches = (path) => path && (url === path || url.startsWith(path + '/'));
    const isSuppressed = inactiveOn.some(matches);

    const isActive = !isSuppressed && (
        (href ? matches(href) : false) ||
        activeOn.some(matches)
    );

    const childActive = hasChildren
        ? children.some((c) => {
            const childHref = c.props?.href;
            const childActiveOn = c.props?.activeOn ?? [];
            return matches(childHref) || childActiveOn.some(matches);
        })
        : false;

    const [open, setOpen] = useState(childActive);

    /* ── Shared item dimensions ─────────────────────────────────────────────── */
    // px-2 (8px) on top of the sidebar's --space-sidebar-x (12px) = 20px total
    // from sidebar edge. Keeps icon/text well clear of the wall.
    const itemStyle = {
        borderRadius: 'var(--radius-md)',
        height      : '40px',
    };

    /* ── Collapsed: icon centred + CSS tooltip ──────────────────────────────── */
    if (collapsed) {
        return (
            <li data-tooltip={label}>
                <Link
                    href={href ?? '#'}
                    className="flex items-center justify-center"
                    style={{
                        ...itemStyle,
                        width     : 40,
                        background: isActive || childActive ? 'var(--color-primary)' : 'transparent',
                        color     : isActive || childActive ? '#ffffff' : 'var(--color-text-muted)',
                    }}
                >
                    <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>
                </Link>
            </li>
        );
    }

    /* ── Leaf item (no children) ────────────────────────────────────────────── */
    if (!hasChildren) {
        return (
            <li>
                <Link
                    href={href}
                    className="flex items-center w-full"
                    style={{
                        ...itemStyle,
                        gap        : '12px',
                        paddingLeft: '14px',
                        paddingRight: '14px',
                        fontSize   : 'var(--font-size-small)',
                        fontFamily : 'var(--font-body)',
                        fontWeight : isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                        background : isActive ? 'var(--color-primary)' : 'transparent',
                        color      : isActive ? '#ffffff' : 'var(--color-text)',
                        textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'var(--color-hover)';
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center',
                                   color: isActive ? '#ffffff' : 'var(--color-text-muted)' }}>
                        {icon}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {label}
                    </span>
                </Link>
            </li>
        );
    }

    /* ── Parent item (with collapsible sub-items) ───────────────────────────── */
    return (
        <li>
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center"
                style={{
                    ...itemStyle,
                        gap        : '12px',
                        paddingLeft: '14px',
                        paddingRight: '14px',
                    fontSize   : 'var(--font-size-small)',
                    fontFamily : 'var(--font-body)',
                    fontWeight : childActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    background : childActive ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
                    color      : childActive ? 'var(--color-primary)' : 'var(--color-text)',
                    border     : 'none',
                    cursor     : 'pointer',
                    textAlign  : 'left',
                }}
                onMouseEnter={(e) => {
                    if (!childActive) e.currentTarget.style.background = 'var(--color-hover)';
                }}
                onMouseLeave={(e) => {
                    if (!childActive) e.currentTarget.style.background =
                        childActive ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent';
                }}
            >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center',
                               color: childActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    {icon}
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    {label}
                </span>
                <ChevronDown
                    size={15}
                    style={{
                        flexShrink: 0,
                        transform : open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms ease',
                        color     : 'var(--color-text-muted)',
                    }}
                />
            </button>

            {open && (
                <ul className="flex flex-col gap-0.5" style={{ marginTop: 2, marginLeft: 30 }}>
                    {children}
                </ul>
            )}
        </li>
    );
}
