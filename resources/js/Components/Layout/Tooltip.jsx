import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Tooltip — portal-based tooltip that escapes overflow-hidden ancestors.
 *
 * Usage:
 *   const anchorRef = useRef(null);
 *   const [tip, setTip] = useState(false);
 *
 *   <button ref={anchorRef} onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
 *     ...
 *   </button>
 *   {tip && <Tooltip label="My label" anchorRef={anchorRef} />}
 *
 * The tooltip is rendered into document.body via a portal so it can never
 * be clipped by overflow:hidden / overflow-y:auto ancestors (e.g. the nav
 * scroll container or the AppShell root).
 *
 * Position: fixed, left of anchor.right + 8px, vertically centred on anchor.
 */
export default function Tooltip({ label, anchorRef }) {
    const [style, setStyle] = useState({ opacity: 0, visibility: 'hidden' });

    const reposition = useCallback(() => {
        if (!anchorRef.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        setStyle({
            position  : 'fixed',
            left      : rect.right + 8,
            top       : rect.top + rect.height / 2,
            transform : 'translateY(-50%)',
            whiteSpace: 'nowrap',

            backgroundColor: 'var(--color-text)',
            color          : 'var(--color-card)',
            fontFamily     : 'var(--font-body)',
            fontSize       : '12px',
            fontWeight     : 500,
            lineHeight     : 1,
            padding        : '5px 9px',
            borderRadius   : 'var(--radius-md)',
            pointerEvents  : 'none',
            zIndex         : 99999,
            opacity        : 1,
            visibility     : 'visible',
        });
    }, [anchorRef]);

    useEffect(() => {
        reposition();
        // Reposition on scroll/resize so tooltip tracks the anchor
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [reposition]);

    return createPortal(
        <div style={style}>{label}</div>,
        document.body
    );
}
