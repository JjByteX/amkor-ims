import { useState, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip from './Tooltip';

/**
 * NavItem — sidebar navigation link.
 *
 * Corner radius driven by --radius-md token (8px).
 * Text colors use --color-text and --color-text-muted tokens (never
 * hardcoded Tailwind gray classes) so dark mode is always correct.
 *
 * Animation strategy
 * ──────────────────
 * The icon sits at a fixed left offset (8px nav padding + 14px item padding
 * = 22px from the sidebar edge) in both collapsed and expanded states. In
 * collapsed mode, 14px padding on both sides centers the 20px icon within
 * the 48px available width. Only the label text is wrapped in
 * AnimatePresence + motion.span so it fades and clips horizontally. This
 * keeps the icon column perfectly still during expand/collapse — no
 * jitter, shake, or lopsided padding.
 *
 * Props:
 *   href     : string             (route URL)
 *   icon     : ReactNode          (Lucide icon, 20px)
 *   label    : string
 *   activeOn : string[]           (optional extra active URL prefixes)
 *   children : NavItem[]          (nested sub-items)
 *   collapsed: bool               (sidebar collapsed state)
 */

/* ── Label animation constants (mirror Sidebar.jsx) ─────────────────────── */
const LABEL_EXIT_DURATION  = 0.10;
const LABEL_ENTER_DURATION = 0.16;
const LABEL_ENTER_DELAY    = 0.12;
const SIDEBAR_EASE         = [0.4, 0, 0.2, 1];

/* ── Shared label motion props (fade + horizontal clip) ─────────────────── */
const labelMotionProps = {
    initial: false,
    animate: { opacity: 1, width: 'auto', transition: { duration: LABEL_ENTER_DURATION, delay: LABEL_ENTER_DELAY, ease: SIDEBAR_EASE } },
    exit   : { opacity: 0, width: 0, transition: { duration: LABEL_EXIT_DURATION, ease: 'easeIn' } },
};

export default function NavItem({ href, icon, label, activeOn = [], inactiveOn = [], children, collapsed = false }) {
    const { url } = usePage();
    // Strip query string so /payables?tab=pending still matches /payables
    const pathname = url.split('?')[0];
    const hasChildren = !!children;
    const matches = (path) => path && (pathname === path || pathname.startsWith(path + '/'));
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

    /* ── Portal tooltip state (collapsed only) ──────────────────────────────── */
    const [tipVisible, setTipVisible] = useState(false);
    const anchorRef = useRef(null);

    /* ── Shared item dimensions ─────────────────────────────────────────────── */
    const baseItemStyle = {
        borderRadius: 'var(--radius-md)',
        height      : '34px',
        paddingLeft : '14px',
        paddingRight: '10px',
    };

    /* ── Icon — fixed slot, never moves ─────────────────────────────────────── */
    const iconSpan = (color) => (
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color }}>
            {icon}
        </span>
    );

    /* ── Collapsed: icon only + portal tooltip ──────────────────────────────── */
    if (collapsed) {
        const isHighlighted = isActive || childActive;
        return (
            <li>
                <Link
                    prefetch
                    ref={anchorRef}
                    href={href ?? '#'}
                    className={['flex items-center w-full nav-item-hoverable', isHighlighted ? 'nav-item-active' : ''].join(' ')}
                    style={{
                        ...baseItemStyle,
                        paddingRight  : '14px',
                        background    : isHighlighted ? 'var(--color-primary)' : 'transparent',
                        color         : isHighlighted ? '#ffffff' : 'var(--color-text-muted)',
                        textDecoration: 'none',
                    }}
                    onMouseEnter={() => setTipVisible(true)}
                    onMouseLeave={() => setTipVisible(false)}
                >
                    {iconSpan(isHighlighted ? '#ffffff' : 'var(--color-text-muted)')}
                </Link>
                {tipVisible && <Tooltip label={label} anchorRef={anchorRef} />}
            </li>
        );
    }

    /* ── Leaf item (no children) ────────────────────────────────────────────── */
    if (!hasChildren) {
        return (
            <li>
                <Link
                    prefetch
                    href={href}
                    className={['flex items-center w-full nav-item-hoverable', isActive ? 'nav-item-active' : ''].join(' ')}
                    style={{
                        ...baseItemStyle,
                        gap       : '10px',
                        fontSize  : 'var(--font-size-small)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                        background: isActive ? 'var(--color-primary)' : 'transparent',
                        color     : isActive ? '#ffffff' : 'var(--color-text)',
                        textDecoration: 'none',
                    }}
                >
                    {iconSpan(isActive ? '#ffffff' : 'var(--color-text-muted)')}

                    {/* Label — animated, never affects the icon position */}
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                style={{ overflow: 'hidden', whiteSpace: 'nowrap', display: 'block', minWidth: 0 }}
                                {...labelMotionProps}
                            >
                                {label}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>
            </li>
        );
    }

    /* ── Parent item (with collapsible sub-items) ───────────────────────────── */
    return (
        <li>
            <button
                onClick={() => setOpen((v) => !v)}
                className={['w-full flex items-center nav-item-hoverable', childActive ? 'nav-item-active' : ''].join(' ')}
                style={{
                    ...baseItemStyle,
                    gap       : '10px',
                    fontSize  : 'var(--font-size-small)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: childActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    background: childActive ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
                    color     : childActive ? 'var(--color-primary)' : 'var(--color-text)',
                    border    : 'none',
                    cursor    : 'pointer',
                    textAlign : 'left',
                }}
            >
                {iconSpan(childActive ? 'var(--color-primary)' : 'var(--color-text-muted)')}

                {/* Label — animated, never affects the icon position */}
                <AnimatePresence>
                    {!collapsed && (
                        <motion.span
                            style={{ overflow: 'hidden', whiteSpace: 'nowrap', flex: 1, display: 'block', minWidth: 0, textAlign: 'left' }}
                            {...labelMotionProps}
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Chevron — only shown when expanded */}
                <AnimatePresence>
                    {!collapsed && (
                        <motion.span
                            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
                            initial={false}
                            animate={{ opacity: 1, transition: { duration: LABEL_ENTER_DURATION, delay: LABEL_ENTER_DELAY } }}
                            exit={{ opacity: 0, transition: { duration: LABEL_EXIT_DURATION } }}
                        >
                            <ChevronDown
                                size={15}
                                style={{
                                    transform : open ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 200ms ease',
                                    color     : 'var(--color-text-muted)',
                                }}
                            />
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            {open && (
                <ul className="flex flex-col gap-0.5" style={{ marginTop: 2, marginLeft: 30 }}>
                    {children}
                </ul>
            )}
        </li>
    );
}
