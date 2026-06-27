/**
 * LeaveBalanceCard
 *
 * Displays a single leave balance metric inside a card.
 *
 * Props:
 *   label  : string              — card title (e.g. "Service Incentive Leave")
 *   value  : number              — remaining balance
 *   total  : number              — total allocation (used for progress bar on 'days' type)
 *   type   : 'days' | 'currency' — rendering mode
 *   note   : string              — optional sub-label (e.g. "5 days total")
 */
export default function LeaveBalanceCard({ label, value, total, type = 'days', note }) {
    const remaining = value ?? 0;

    const pct   = type === 'days' && total > 0
        ? Math.min(100, Math.round((remaining / total) * 100))
        : null;

    const color = type === 'days'
        ? (remaining === 0 ? 'var(--color-error)'
         : remaining <= 2  ? 'var(--color-warning)'
         : 'var(--color-success)')
        : 'var(--color-info)';

    const displayValue = type === 'currency'
        ? '₱ ' + Number(remaining).toLocaleString('en-PH', { minimumFractionDigits: 2 })
        : `${remaining} day${remaining !== 1 ? 's' : ''}`;

    return (
        <div
            style={{
                background: 'var(--color-card)',
                border: 'var(--border-container)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
            }}
        >
            <span
                className="font-body"
                style={{
                    fontSize: 'var(--font-size-small)',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                }}
            >
                {label}
            </span>

            <span
                className="font-heading font-bold"
                style={{ fontSize: 28, color, lineHeight: 1 }}
            >
                {displayValue}
            </span>

            {pct !== null && (
                <div style={{ height: 5, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                        style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: color,
                            borderRadius: 3,
                            transition: 'width 0.3s',
                        }}
                    />
                </div>
            )}

            {note && (
                <span
                    className="font-body"
                    style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}
                >
                    {note}
                </span>
            )}
        </div>
    );
}
