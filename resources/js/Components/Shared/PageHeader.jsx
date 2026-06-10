import { router } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

/**
 * PageHeader — consistent page title bar with optional breadcrumb trail.
 *
 * Props:
 *   title       : string                 — current page name
 *   actions     : ReactNode              — rendered on the right (Buttons etc.)
 *   breadcrumb  : Array<{ label, href }> — optional ancestors, left-to-right
 *   inlineTitle : bool                   — injected by FormLayout; renders the
 *                                          title inline at the end of the breadcrumb
 *                                          row instead of as a large <h1> below it.
 *                                          Do not set this manually.
 *   className   : string
 *
 * Normal (standalone index pages):
 *   Ormoc Branch          ← breadcrumb row (small, muted)
 *   New Booking           ← large h1 below
 *
 * Inside FormLayout (inlineTitle injected automatically):
 *   Ormoc Branch  ›  New Booking   [subtitle]    ← single compact row
 */
export default function PageHeader({
    title,
    actions,
    breadcrumb = [],
    inlineTitle = false,
    className = '',
}) {
    // ── Inline mode (form pages inside FormLayout) ──────────────────────────
    // Breadcrumb ancestors + › + current title, all on one line.
    // Subtitle sits just below on the same left edge.
    // Actions are suppressed by FormLayout (actions=null injected via cloneElement).
    if (inlineTitle) {
        return (
            <div
                className={`flex items-start justify-between ${className}`}
                style={{ marginBottom: '8px' }}
            >
                <div className="min-w-0">
                    {/* Single inline row: Parent › Current Page */}
                    <div
                        className="flex flex-wrap items-center font-body"
                        style={{ gap: '4px', fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}
                    >
                        {breadcrumb.map((crumb, i) => (
                            <span key={i} className="flex items-center" style={{ gap: '4px' }}>
                                {i > 0 && (
                                    <ChevronRight size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                                )}
                                <button
                                    type="button"
                                    onClick={() => router.visit(crumb.href)}
                                    className="font-body"
                                    style={{
                                        background: 'none', border: 'none', padding: 0,
                                        cursor: 'pointer', color: 'var(--color-primary)',
                                        fontSize: 'var(--font-size-small)', fontWeight: 500,
                                        textDecoration: 'none', lineHeight: 1.4,
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                >
                                    {crumb.label}
                                </button>
                            </span>
                        ))}

                        {/* Separator before current page title */}
                        {breadcrumb.length > 0 && (
                            <ChevronRight size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        )}

                        {/* Current page — full heading size */}
                        <span
                            className="font-heading font-bold"
                            style={{
                                color: 'var(--color-text)',
                                fontSize: 'var(--font-size-heading)',
                                lineHeight: 'var(--line-height-tight)',
                            }}
                        >
                            {title}
                        </span>
                    </div>


                </div>

                {/* Actions suppressed by FormLayout — rendered here only if somehow passed */}
                {actions && (
                    <div className="flex flex-wrap items-center justify-end shrink-0" style={{ gap: 'var(--space-1)' }}>
                        {actions}
                    </div>
                )}
            </div>
        );
    }

    // ── Normal mode (index / detail pages, standalone use) ──────────────────
    return (
        <div
            className={`flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-start ${className}`}
            style={{ marginBottom: '8px' }}
        >
            <div className="min-w-0">
                {/* Breadcrumb trail */}
                {breadcrumb.length > 0 && (
                    <div
                        className="flex flex-wrap items-center font-body"
                        style={{ gap: '4px', marginBottom: '4px', fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}
                    >
                        {breadcrumb.map((crumb, i) => (
                            <span key={i} className="flex items-center" style={{ gap: '4px' }}>
                                {i > 0 && (
                                    <ChevronRight size={13} style={{ color: 'var(--color-border)', flexShrink: 0 }} />
                                )}
                                <button
                                    type="button"
                                    onClick={() => router.visit(crumb.href)}
                                    className="font-body"
                                    style={{
                                        background: 'none', border: 'none', padding: 0,
                                        cursor: 'pointer', color: 'var(--color-primary)',
                                        fontSize: 'var(--font-size-small)', fontWeight: 500,
                                        textDecoration: 'none', lineHeight: 1.4,
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                >
                                    {crumb.label}
                                </button>
                            </span>
                        ))}
                        <ChevronRight size={13} style={{ color: 'var(--color-border)', flexShrink: 0 }} />
                    </div>
                )}

                {/* Page title */}
                <h1
                    className="font-heading font-bold text-[var(--color-text)] truncate"
                    style={{ fontSize: 'var(--font-size-heading)', lineHeight: 'var(--line-height-tight)', margin: 0 }}
                >
                    {title}
                </h1>


            </div>

            {actions && (
                <div className="flex flex-wrap items-center justify-start sm:justify-end sm:shrink-0" style={{ gap: 'var(--space-1)' }}>
                    {actions}
                </div>
            )}
        </div>
    );
}
