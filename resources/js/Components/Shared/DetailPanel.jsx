/**
 * DetailPanel — inline right-side panel that pushes the table rather than
 * overlaying it.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  PageStack                                              │
 * │  ┌──────────────────────────────────────────────────┐  │
 * │  │  PageHeader                                       │  │
 * │  ├──────────────────────────────────────────────────┤  │
 * │  │  StatGrid  (compresses horizontally, never cut)  │  │
 * │  ├──────────────────────────────────────────────────┤  │
 * │  │  TableWithPanel  ← flex-row, flex-1              │  │
 * │  │  ┌──────────────────────┐  ┌──────────────────┐  │  │
 * │  │  │  DataTable  flex-1   │  │  DetailPanel     │  │  │
 * │  │  │  (table frozen)      │  │  (slides in)     │  │  │
 * │  │  └──────────────────────┘  └──────────────────┘  │  │
 * │  └──────────────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────────────┘
 *
 * EXPORTS
 *   default DetailPanel      — the animated panel shell (used inside TableWithPanel)
 *   TableWithPanel           — the flex-row wrapper (replaces DataTable + DetailPanel
 *                              in every Index page — single import change)
 *   useDetailPanel           — hook: manages open/data/loading state
 *   PanelColumns / PanelCol / PanelColRight
 *   PanelSection / PanelField / PanelFieldRow
 *   PanelDivider / PanelFullRow
 *   PanelActions / PanelMeta / PanelMetaItem
 *
 * MIGRATION (per Index page — ~5 lines changed)
 * ─────────────────────────────────────────────
 * Before:
 *   import DetailPanel, { useDetailPanel } from '…/DetailPanel';
 *   …
 *   <DataTable … />
 *   <DetailPanel open={showPanel} onClose={…} …>…</DetailPanel>
 *
 * After:
 *   import DetailPanel, { TableWithPanel, useDetailPanel } from '…/DetailPanel';
 *   …
 *   <TableWithPanel
 *     panelOpen={showPanel}
 *     panel={<DetailPanel open={showPanel} onClose={…} …>…</DetailPanel>}
 *   >
 *     <DataTable panelOpen={showPanel} … />
 *   </TableWithPanel>
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { router } from '@inertiajs/react';
import { X, Pencil, Loader2 } from 'lucide-react';

// ─── Design constants ─────────────────────────────────────────────────────────
// Keep in sync with the panel width prop default.
const PANEL_WIDTH     = 612;   // px — the card width when open
const PANEL_GAP       = 16;    // px — gap between table and panel
const SLIDE_DURATION  = 0.20;  // seconds
const SLIDE_EASE      = [0.25, 0.46, 0.45, 0.94]; // smooth decelerate

/**
 * How long (ms) the panel takes to fully collapse on close.
 * Exported so DataTable can hold its width freeze for exactly this duration
 * before releasing — keeps the two files in sync without duplicating numbers.
 */
export const PANEL_CLOSE_MS = Math.round(SLIDE_DURATION * 1000);

// ─── useDetailPanel ────────────────────────────────────────────────────────────
/**
 * LRU cache shared across all panels in the session.
 * Keyed by fetch URL. Holds up to CACHE_MAX fully-hydrated responses.
 * Once a record is fetched it re-opens instantly with zero network cost.
 */
const CACHE_MAX = 30;
const _cache = new Map();

function cacheGet(url) { return _cache.get(url) ?? null; }

function cacheSet(url, data) {
    if (_cache.has(url)) _cache.delete(url);
    _cache.set(url, data);
    if (_cache.size > CACHE_MAX) _cache.delete(_cache.keys().next().value);
}

/**
 * useDetailPanel(urlFn, options?)
 *
 * options.preview — fn(id) => partialData
 *   Pass the row the user clicked so fields already on the page render
 *   instantly while the full fetch runs in the background.
 *   Replaced by the real response once it arrives.
 *   If already cached, preview is never shown (opens instantly).
 *
 * Extra returned value:
 *   hydrating — true while background-fetching over a preview
 *   invalidate(id) — evict one record from cache (call after mutations)
 */
export function useDetailPanel(urlFn, options = {}) {
    const [state, setState] = useState({
        open     : false,
        loading  : false,
        hydrating: false,
        data     : null,
        error    : null,
        id       : null,
    });

    const urlFnRef   = useRef(urlFn);
    const optionsRef = useRef(options);
    useEffect(() => { urlFnRef.current   = urlFn;    }, [urlFn]);
    useEffect(() => { optionsRef.current = options;  }, [options]);

    const open = useCallback(async (idOrRow) => {
        // Accept either a plain id or a full row object.
        // When a row object is passed, use it as an instant preview so fields
        // already in the table render immediately with no spinner.
        const isRow = idOrRow !== null && typeof idOrRow === 'object';
        const id    = isRow ? idOrRow.id : idOrRow;

        const raw = urlFnRef.current;
        const url = typeof raw === 'function' ? raw(id) : raw.replace(':id', id);
        const fetchUrl = url + (url.includes('?') ? '&' : '?') + 'json=1';

        // 1. Cache hit — instant, no spinner, no network
        const cached = cacheGet(fetchUrl);
        if (cached) {
            setState({ open: true, loading: false, hydrating: false, data: cached, error: null, id });
            return;
        }

        // 2. Row or preview fn — render partial data immediately, hydrate in background
        const previewFromOpt = optionsRef.current?.preview?.(id) ?? null;
        const preview = isRow ? idOrRow : previewFromOpt;
        if (preview) {
            setState({ open: true, loading: false, hydrating: true, data: preview, error: null, id });
        } else {
            // 3. No preview — show spinner until fetch resolves
            setState({ open: true, loading: true, hydrating: false, data: null, error: null, id });
        }

        try {
            const res = await fetch(fetchUrl, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            cacheSet(fetchUrl, data);
            setState(s => s.id === id
                ? { ...s, loading: false, hydrating: false, data, error: null }
                : s
            );
        } catch (e) {
            setState(s => s.id === id
                ? { ...s, loading: false, hydrating: false, error: e.message }
                : s
            );
        }
    }, []);

    const close = useCallback(() =>
        setState(s => ({ ...s, open: false, id: null }))
    , []);

    const invalidate = useCallback((id) => {
        const raw = urlFnRef.current;
        const url = typeof raw === 'function' ? raw(id) : raw.replace(':id', id);
        _cache.delete(url + (url.includes('?') ? '&' : '?') + 'json=1');
    }, []);

    return { ...state, open, close, invalidate };
}

// ─── TableWithPanel ───────────────────────────────────────────────────────────
/**
 * Wraps a DataTable + DetailPanel in a flex-row container.
 *
 * The panel slides in from the right beside the table. The table is frozen
 * at its pre-open width — the card's overflow:hidden clips the right side.
 *
 * Props:
 *   children   : the <DataTable> (receives panelOpen automatically via cloneElement)
 *   panel      : the <DetailPanel> element
 *   panelOpen  : bool — controls the slide animation
 *   panelWidth : number — panel width in px (default 600)
 */
export function TableWithPanel({
    children,
    panel,
    panelOpen  = false,
    panelWidth = PANEL_WIDTH,
}) {
    return (
        <div
            className="flex flex-1 min-h-0"
        >
            {/* Table — shrinks as panel pushes in; DataTable handles internal scroll */}
            <div className="flex flex-col flex-1 min-h-0 min-w-0">
                {children}
            </div>

            {/* Panel — slides in from the right, same height as table zone.
                The gap is baked into marginLeft so it grows/shrinks in sync
                with the panel width — no instant-jump jitter on open. */}
            <AnimatePresence initial={false}>
                {panelOpen && (
                    <motion.div
                        key="detail-panel"
                        initial={{ width: 0, marginLeft: 0, opacity: 0 }}
                        animate={{ width: panelWidth, marginLeft: PANEL_GAP, opacity: 1 }}
                        exit={{ width: 0, marginLeft: 0, opacity: 0 }}
                        transition={{ duration: SLIDE_DURATION, ease: SLIDE_EASE }}
                        style={{
                            flexShrink: 0,
                            overflow  : 'hidden',
                            // Height is governed by the flex parent — matches DataTable zone exactly
                        }}
                    >
                        {/* Inner card — full height of the flex zone */}
                        <div style={{ width: panelWidth, height: '100%' }}>
                            {panel}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────
/**
 * The panel card itself. Designed to live inside <TableWithPanel>.
 * No overlay, no fixed positioning — it's a normal flow element
 * that fills the height provided by TableWithPanel's flex container.
 *
 * Props:
 *   open      : bool
 *   onClose   : fn
 *   title     : string
 *   subtitle  : string
 *   badges    : ReactNode
 *   editHref  : string
 *   loading   : bool
 *   error     : string
 *   children  : ReactNode
 *   width     : number  (default 600 — should match TableWithPanel panelWidth)
 */
export default function DetailPanel({
    open     = false,
    onClose,
    title    = '',
    subtitle,
    badges,
    editHref,
    loading  = false,
    error,
    children,
    width    = PANEL_WIDTH,
}) {
    const panelRef = useRef(null);

    // Escape key closes the panel
    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [open, onClose]);

    // Focus trap — focus the panel when it opens
    useEffect(() => {
        if (open && !loading && panelRef.current) panelRef.current.focus();
    }, [open, loading]);

    // Note: no body overflow lock — this is an inline panel, page never scrolls
    if (!open) return null;

    return (
        <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="false"
            aria-label={title}
            style={{
                width         : '100%',
                height        : '100%',
                display       : 'flex',
                flexDirection : 'column',
                background    : 'var(--color-card)',
                border        : 'var(--border-container)',
                borderRadius  : 'var(--radius-lg)',
                boxShadow     : 'var(--shadow-card)',
                outline       : 'none',
                overflow      : 'hidden',
            }}
        >
            {/* Header — two rows: title+badges, then subtitle */}
            <div style={{
                display      : 'flex',
                alignItems   : 'center',
                gap          : 10,
                padding      : '10px 14px 10px 22px',
                borderBottom : 'var(--border-container)',
                flexShrink   : 0,
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <h2 className="font-heading font-bold" style={{
                            fontSize    : 'var(--font-size-base)',
                            lineHeight  : 1,
                            color       : 'var(--color-text)',
                            margin      : 0,
                            overflow    : 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace  : 'nowrap',
                            flexShrink  : 0,
                        }}>
                            {loading ? <span style={{ opacity: 0.4 }}>Loading…</span> : title}
                        </h2>
                        {!loading && badges && (
                            <div className="flex items-center" style={{ gap: 4, flexShrink: 0 }}>
                                {badges}
                            </div>
                        )}
                    </div>
                    {!loading && subtitle && (
                        <div className="font-body" style={{
                            fontSize    : 'var(--font-size-small)',
                            color       : 'var(--color-text-muted)',
                            marginTop   : 3,
                            overflow    : 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace  : 'nowrap',
                        }}>
                            {subtitle}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {!loading && editHref && (
                        <button type="button" onClick={() => router.get(editHref)}
                            className="font-body font-medium"
                            style={{
                                display      : 'flex',
                                alignItems   : 'center',
                                gap          : 5,
                                padding      : '5px 10px',
                                fontSize     : 'var(--font-size-small)',
                                color        : 'var(--color-text)',
                                background   : 'var(--color-bg)',
                                border       : 'var(--border-container)',
                                borderRadius : 'var(--radius-md)',
                                cursor       : 'pointer',
                                transition   : 'background 0.12s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 8%, var(--color-bg))'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg)'}
                        >
                            <Pencil size={13} /> Edit
                        </button>
                    )}
                    <button type="button" onClick={onClose} aria-label="Close"
                        style={{
                            display        : 'flex',
                            alignItems     : 'center',
                            justifyContent : 'center',
                            width          : 30,
                            height         : 30,
                            background     : 'none',
                            border         : 'none',
                            borderRadius   : 'var(--radius-md)',
                            color          : 'var(--color-text-muted)',
                            cursor         : 'pointer',
                            transition     : 'background 0.12s, color 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-hover)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none';               e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 32px' }}>
                {loading && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--color-text-muted)' }}>
                        <Loader2 size={22} style={{ animation: 'spin 0.8s linear infinite' }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}
                {error && !loading && (
                    <div style={{ padding: 'var(--space-3)', color: 'var(--color-error)', fontSize: 'var(--font-size-small)' }}>
                        Failed to load: {error}
                    </div>
                )}
                {!loading && !error && children}
            </div>
        </div>
    );
}

// ─── Layout primitives ────────────────────────────────────────────────────────

export function PanelColumns({ children }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, alignItems: 'start' }}>
            {children}
        </div>
    );
}

export function PanelCol({ children }) {
    return (
        <div className="flex flex-col" style={{ gap: 'var(--space-3)', paddingRight: 20, borderRight: '1px solid var(--color-border)' }}>
            {children}
        </div>
    );
}

export function PanelColRight({ children }) {
    return (
        <div className="flex flex-col" style={{ gap: 'var(--space-3)', paddingLeft: 20 }}>
            {children}
        </div>
    );
}

export function PanelSection({ title, children }) {
    return (
        <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
            {title && (
                <div className="font-body font-semibold" style={{
                    fontSize     : 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color        : 'var(--color-text-muted)',
                }}>
                    {title}
                </div>
            )}
            <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                {children}
            </div>
        </div>
    );
}

export function PanelField({ label, value, highlight = false, mono = false }) {
    const empty = value === null || value === undefined || value === '';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="font-body font-semibold" style={{
                fontSize     : 10,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color        : 'var(--color-text-muted)',
                lineHeight   : 1.2,
            }}>
                {label}
            </span>
            <span className="font-body" style={{
                fontSize  : 'var(--font-size-small)',
                color     : highlight ? 'var(--color-primary)' : empty ? 'var(--color-text-muted)' : 'var(--color-text)',
                fontWeight: highlight ? 600 : 400,
                fontFamily: mono ? 'monospace' : undefined,
                wordBreak : 'break-word',
            }}>
                {empty ? '—' : value}
            </span>
        </div>
    );
}

export function PanelFieldRow({ children }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {children}
        </div>
    );
}

export function PanelDivider() {
    return <div style={{ height: 1, background: 'var(--color-border)', margin: '2px 0' }} />;
}

export function PanelFullRow({ title, children }) {
    return (
        <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
            {title && (
                <div className="font-body font-semibold" style={{
                    fontSize     : 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color        : 'var(--color-text-muted)',
                    marginBottom : 'var(--space-2)',
                }}>
                    {title}
                </div>
            )}
            {children}
        </div>
    );
}

export function PanelActions({ children }) {
    return <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>{children}</div>;
}

export function PanelMeta({ children }) {
    return (
        <div style={{
            display    : 'flex',
            flexWrap   : 'wrap',
            gap        : '6px 14px',
            paddingTop : 10,
            borderTop  : '1px solid var(--color-border)',
        }}>
            {children}
        </div>
    );
}

export function PanelMetaItem({ label, value }) {
    if (!value) return null;
    return (
        <span className="font-body" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 3 }}>{label}:</span>
            {value}
        </span>
    );
}
