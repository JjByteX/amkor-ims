/**
 * FilterStrip - responsive toolbar used inside DataTable's toolbar slot.
 */
export default function FilterStrip({ children, className = '', ...rest }) {
    return (
        <div
            className={`flex flex-wrap items-center ${className}`}
            style={{
                gap: 'var(--space-1)',
            }}
            {...rest}
        >
            {children}
        </div>
    );
}

export function FilterField({ children, grow = false, width = 168, className = '' }) {
    return (
        <div
            className={className}
            style={{
                flex: grow ? '1 1 260px' : `0 1 ${width}px`,
                minWidth: grow ? 220 : Math.min(width, 180),
            }}
        >
            {children}
        </div>
    );
}
