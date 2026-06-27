import { useState, useEffect, useRef, useCallback } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NavGroup — collapsible sidebar group with child NavItems.
 *
 * Mirrors the label-motion and icon-slot conventions in NavItem.jsx so the
 * group header sits flush with sibling NavItems in both expanded and
 * collapsed sidebar states.
 *
 * Props:
 *   icon       : ReactNode   (20px Lucide icon — group header)
 *   label      : string
 *   children   : [{ key, href, icon, label, roles }]   (already role-filtered)
 *   storageKey : string      (localStorage key for open/closed persistence)
 *   collapsed  : bool        (sidebar collapsed / icon-rail state)
 */

const LABEL_EXIT_DURATION  = 0.10;
const LABEL_ENTER_DURATION = 0.16;
const LABEL_ENTER_DELAY    = 0.12;
const SIDEBAR_EASE         = [0.4, 0, 0.2, 1];
const GROUP_COLLAPSE_DURATION = 0.2;

const labelMotionProps = {
    initial: false,
    animate: { opacity: 1, width: 'auto', transition: { duration: LABEL_ENTER_DURATION, delay: LABEL_ENTER_DELAY, ease: SIDEBAR_EASE } },
    exit   : { opacity: 0, width: 0, transition: { duration: LABEL_EXIT_DURATION, ease: 'easeIn' } },
};

const baseItemStyle = {
    borderRadius: 'var(--radius-md)',
    height      : '34px',
    paddingLeft : '14px',
    paddingRight: '10px',
};

export default function NavGroup({ icon, label, children = [], storageKey = 'amkor_nav_hr_open', collapsed = false }) {
    const { url } = usePage();
    const pathname = url.split('?')[0];
    const matches = (path) => path && (pathname === path || pathname.startsWith(path + '/'));
    // For inactiveOn: exact match only, so /hr/attendance/me suppresses only that path
    const matchesExact = (path) => path && pathname === path;
    const matchesChild = (child) => {
        const suppressed = (child.inactiveOn ?? []).some(matchesExact);
        if (suppressed) return false;
        return matches(child.href) || (child.activeOn ?? []).some(matches);
    };

    const childActive = children.some(matchesChild);

    /* ── Open/closed state, persisted in localStorage, forced open on active child ── */
    const [open, setOpen] = useState(() => {
        if (childActive) return true;
        try {
            return localStorage.getItem(storageKey) === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        if (childActive) setOpen(true);
    }, [childActive]);

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, String(open));
        } catch { /* ignore */ }
    }, [open, storageKey]);

    /* ── Collapsed (icon rail) flyout state ──────────────────────────────────── */
    const [flyoutVisible, setFlyoutVisible] = useState(false);
    const anchorRef = useRef(null);
    const [flyoutStyle, setFlyoutStyle] = useState({ opacity: 0, visibility: 'hidden' });

    const reposition = useCallback(() => {
        if (!anchorRef.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        setFlyoutStyle({
            position : 'fixed',
            left     : rect.right + 8,
            top      : rect.top,
            zIndex   : 99999,
            opacity  : 1,
            visibility: 'visible',
        });
    }, []);

    useEffect(() => {
        if (!flyoutVisible) return;
        reposition();
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [flyoutVisible, reposition]);

    const iconSpan = (color) => (
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color, pointerEvents: 'none' }}>
            {icon}
        </span>
    );

    const childIconSpan = (childIcon, color) => (
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color, pointerEvents: 'none' }}>
            {childIcon}
        </span>
    );

    /* ── Collapsed: icon only, hover opens portal flyout ────────────────────── */
    if (collapsed) {
        const isHighlighted = childActive;
        return (
            <li>
                <span
                    ref={anchorRef}
                    style={{ display: 'block' }}
                    onMouseEnter={() => setFlyoutVisible(true)}
                    onMouseLeave={() => setFlyoutVisible(false)}
                >
                    <div
                        className="flex items-center w-full nav-item-hoverable"
                        style={{
                            ...baseItemStyle,
                            paddingRight: '14px',
                            background  : isHighlighted ? 'var(--color-primary)' : 'transparent',
                            color       : isHighlighted ? '#ffffff' : 'var(--color-text-muted)',
                            cursor      : 'default',
                        }}
                    >
                        {iconSpan(isHighlighted ? '#ffffff' : 'var(--color-text-muted)')}
                    </div>
                </span>

                {flyoutVisible && createPortal(
                    <div
                        style={flyoutStyle}
                        onMouseEnter={() => setFlyoutVisible(true)}
                        onMouseLeave={() => setFlyoutVisible(false)}
                    >
                        <div
                            style={{
                                background  : 'var(--color-card)',
                                border      : 'var(--border-container)',
                                borderRadius: 'var(--radius-md)',
                                boxShadow   : 'var(--shadow-card)',
                                padding     : '6px',
                                minWidth    : '180px',
                            }}
                        >
                            <div
                                style={{
                                    padding      : '4px 10px 6px',
                                    fontSize     : '10px',
                                    fontWeight   : 600,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    color        : 'var(--color-text-muted)',
                                }}
                            >
                                {label}
                            </div>
                            <ul className="flex flex-col" style={{ gap: 'var(--nav-item-gap)' }}>
                                {children.map((child) => {
                                    const isChildActive = matchesChild(child);
                                    return (
                                        <li key={child.key}>
                                            <Link
                                                prefetch
                                                href={child.href}
                                                className="flex items-center w-full nav-item-hoverable"
                                                style={{
                                                    ...baseItemStyle,
                                                    gap       : '10px',
                                                    fontSize  : 'var(--font-size-small)',
                                                    fontFamily: 'var(--font-body)',
                                                    fontWeight: isChildActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                                                    background: isChildActive ? 'var(--color-primary)' : 'transparent',
                                                    color     : isChildActive ? '#ffffff' : 'var(--color-text)',
                                                    textDecoration: 'none',
                                                }}
                                            >
                                                {childIconSpan(child.icon, isChildActive ? '#ffffff' : 'var(--color-text-muted)')}
                                                <span>{child.label}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>,
                    document.body
                )}
            </li>
        );
    }

    /* ── Expanded: header row + collapsible children ─────────────────────────── */
    return (
        <li>
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center nav-item-hoverable"
                style={{
                    ...baseItemStyle,
                    gap         : '10px',
                    fontSize    : 'var(--font-size-small)',
                    fontFamily  : 'var(--font-body)',
                    fontWeight  : childActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    background  : 'transparent',
                    color       : 'var(--color-text)',
                    border      : 'none',
                    cursor      : 'pointer',
                    textAlign   : 'left',
                }}
            >
                {iconSpan('var(--color-text-muted)')}

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

                <AnimatePresence>
                    {!collapsed && (
                        <motion.span
                            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
                            initial={false}
                            animate={{ rotate: open ? 90 : 0, opacity: 1, transition: { duration: LABEL_ENTER_DURATION, delay: LABEL_ENTER_DELAY } }}
                            exit={{ opacity: 0, transition: { duration: LABEL_EXIT_DURATION } }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            <AnimatePresence initial={false}>
                {open && !collapsed && (
                    <motion.ul
                        className="flex flex-col overflow-hidden"
                        style={{ gap: 'var(--nav-item-gap)', marginLeft: '20px', marginTop: '2px' }}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: GROUP_COLLAPSE_DURATION, ease: SIDEBAR_EASE }}
                    >
                        {children.map((child) => {
                            const suppressed = (child.inactiveOn ?? []).some(matchesExact);
                            const isChildActive = matchesChild(child);
                            return (
                                <li key={child.key}>
                                    <Link
                                        prefetch
                                        href={child.href}
                                        className={['flex items-center w-full nav-item-hoverable', isChildActive ? 'nav-item-active' : ''].join(' ')}
                                        style={{
                                            ...baseItemStyle,
                                            gap       : '10px',
                                            fontSize  : 'var(--font-size-small)',
                                            fontFamily: 'var(--font-body)',
                                            fontWeight: isChildActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                                            background: isChildActive ? 'var(--color-primary)' : 'transparent',
                                            color     : isChildActive ? '#ffffff' : 'var(--color-text)',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        {childIconSpan(child.icon, isChildActive ? '#ffffff' : 'var(--color-text-muted)')}
                                        <span>{child.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </motion.ul>
                )}
            </AnimatePresence>
        </li>
    );
}
