/**
 * PageHeader — consistent page title bar.
 *
 * Props:
 *   title    : string
 *   subtitle : string       (optional secondary line)
 *   actions  : ReactNode    (rendered on the right side — typically Buttons)
 *   className: string
 */
export default function PageHeader({ title, subtitle, actions, className = '' }) {
    return (
        <div
            className={`flex items-start justify-between gap-4 ${className}`}
            style={{ marginBottom: 'var(--space-section)' }}
        >
            <div className="min-w-0">
                <h1
                    className="font-heading font-bold text-[var(--color-text)] truncate"
                    style={{ fontSize: 'var(--font-size-heading)', lineHeight: 'var(--line-height-tight)' }}
                >
                    {title}
                </h1>
                {subtitle && (
                    <p className="font-body text-[var(--color-text-muted)]" style={{ fontSize: 'var(--font-size-small)', marginTop: 4 }}>
                        {subtitle}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex items-center shrink-0" style={{ gap: 'var(--space-1)' }}>
                    {actions}
                </div>
            )}
        </div>
    );
}
