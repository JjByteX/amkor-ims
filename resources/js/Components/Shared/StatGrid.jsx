/**
 * StatGrid - consistent KPI grid above tables.
 */
export default function StatGrid({ children, className = '', min = '180px' }) {
    return (
        <div
            className={`grid ${className}`}
            style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))`,
                gap: 'var(--space-2)',
                alignItems: 'stretch',
            }}
        >
            {children}
        </div>
    );
}
