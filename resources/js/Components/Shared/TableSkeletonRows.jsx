/**
 * TableSkeletonRows — placeholder <tbody> shown while a table's data is
 * settling (either an actual network fetch, or the brief pre-fetch window
 * where useAutoPageSize already knows the row count is about to change).
 *
 * Deliberately shaped from the SAME `columns` array the real rows use, so a
 * 4-column table and a 9-column table each get a skeleton that already
 * matches their own real layout — no per-page configuration needed. Only the
 * <tbody> is replaced; the real <thead>, toolbar, and pagination footer stay
 * exactly where they are, so nothing else shifts when real rows arrive.
 *
 * Note: deliberately does NOT import tableTdStyle from ./DataTable — that
 * file imports this one, and while a circular import would likely still
 * resolve fine here (the value is only read at render time, never at module
 * top-level), it's simplest to just keep the few cell properties this needs
 * self-contained.
 */

// A handful of varied bar widths so rows don't look like a uniform grid —
// cycled deterministically per column/row rather than randomized, so the
// skeleton doesn't re-shuffle itself on every re-render.
const WIDTH_STEPS = [88, 62, 78, 95, 70, 84];

function widthFor(rowIndex, colIndex) {
    return WIDTH_STEPS[(rowIndex + colIndex) % WIDTH_STEPS.length];
}

export function SkeletonBar({ widthPct, align = 'left' }) {
    return (
        <div
            className="animate-pulse"
            style={{
                height      : 14,
                width       : `${widthPct}%`,
                marginLeft  : align === 'right' ? 'auto' : align === 'center' ? 'auto' : 0,
                marginRight : align === 'center' ? 'auto' : undefined,
                borderRadius: 'var(--radius-sm, 4px)',
                background  : 'var(--color-border-soft)',
            }}
        />
    );
}

function SkeletonActionsCell() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-1)' }}>
            <div className="animate-pulse" style={{ width: 22, height: 22, borderRadius: 'var(--radius-md)', background: 'var(--color-border-soft)' }} />
            <div className="animate-pulse" style={{ width: 22, height: 22, borderRadius: 'var(--radius-md)', background: 'var(--color-border-soft)' }} />
        </div>
    );
}

export default function TableSkeletonRows({ columns = [], rowCount = 10 }) {
    const rowIndexes = Array.from({ length: Math.max(1, rowCount) }, (_, i) => i);

    return (
        <tbody>
            {rowIndexes.map((rowIndex) => (
                <tr
                    key={rowIndex}
                    style={{
                        height      : 'var(--height-table-row)',
                        borderBottom: '1px solid var(--color-border-soft)',
                    }}
                >
                    {columns.map((col, colIndex) => {
                        const isActionsCell = col.key === 'actions' || col.key === '_actions' || col.label === '';
                        const align = isActionsCell ? 'center' : (col.align ?? 'left');
                        return (
                            <td
                                key={col.key}
                                style={{
                                    paddingLeft  : 16,
                                    paddingRight : 16,
                                    fontSize     : 'var(--font-size-small)',
                                    color        : 'var(--color-text)',
                                    verticalAlign: 'middle',
                                    overflow     : 'hidden',
                                    textAlign    : align,
                                    width        : isActionsCell ? '1%' : undefined,
                                }}
                            >
                                {isActionsCell
                                    ? <SkeletonActionsCell />
                                    : <SkeletonBar widthPct={widthFor(rowIndex, colIndex)} align={align} />
                                }
                            </td>
                        );
                    })}
                </tr>
            ))}
        </tbody>
    );
}
