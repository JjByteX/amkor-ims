/**
 * PageStack - consistent vertical page rhythm inside AppShell.
 *
 * Use for authenticated pages that should stretch to the available viewport
 * height, especially table/list pages.
 */
export default function PageStack({ children, className = '', gap = 'var(--space-section)', ...rest }) {
    return (
        <div
            className={`flex min-h-0 flex-1 flex-col ${className}`}
            style={{ gap }}
            {...rest}
        >
            {children}
        </div>
    );
}
