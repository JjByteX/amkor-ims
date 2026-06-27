import Badge from '../UI/Badge';
import Button from '../UI/Button';

/**
 * OvertimeRequestCard
 *
 * Displays a single OT request as a card with a left-border status accent.
 * Used in the employee self-service view of /overtime.
 *
 * Props:
 *   request       : object  (formatted OT request from OvertimeController::formatRequest)
 *   onCancel      : fn(id)  called when employee cancels a pending request
 *   cancelling    : bool    loading state for cancel button
 *   showEmployee  : bool    show employee name row (HR compact list, default false)
 */

const STATUS_VARIANT = {
    pending   : 'warning',
    approved  : 'success',
    rejected  : 'error',
    cancelled : 'neutral',
};

const BORDER_COLOR = {
    pending   : 'var(--color-warning)',
    approved  : 'var(--color-success)',
    rejected  : 'var(--color-error)',
    cancelled : 'var(--color-border)',
};

function fmtDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
        weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
    });
}

function fmtTime(t) {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function OvertimeRequestCard({
    request,
    onCancel,
    cancelling   = false,
    showEmployee = false,
}) {
    const status      = request.status ?? 'pending';
    const borderColor = BORDER_COLOR[status] ?? 'var(--color-border)';
    const badgeVar    = STATUS_VARIANT[status] ?? 'neutral';

    return (
        <div
            style={{
                background   : 'var(--color-card)',
                border       : 'var(--border-container)',
                borderLeft   : `3px solid ${borderColor}`,
                borderRadius : 'var(--radius-md)',
                padding      : 'var(--space-3)',
                display      : 'flex',
                flexDirection: 'column',
                gap          : 'var(--space-2)',
            }}
        >
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    {showEmployee && request.employee && (
                        <p
                            className="font-body"
                            style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', marginBottom: 2 }}
                        >
                            {request.employee.display_name}
                            {request.employee.branch_name ? ` · ${request.employee.branch_name}` : ''}
                        </p>
                    )}
                    {/* Work date */}
                    <p
                        className="font-heading font-semibold"
                        style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)', margin: 0 }}
                    >
                        {fmtDate(request.work_date)}
                    </p>
                    {/* Time range + duration */}
                    <p
                        className="font-body"
                        style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', marginTop: 2 }}
                    >
                        {fmtTime(request.ot_start_time)} → {fmtTime(request.ot_end_time)}
                        {request.duration_label ? ` · ${request.duration_label}` : ''}
                    </p>
                </div>
                <Badge variant={badgeVar}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
            </div>

            {/* Reason + compensation */}
            <p
                className="font-body"
                style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', margin: 0 }}
            >
                {request.reason_label ?? request.reason}
                {request.compensation_label ? ` · ${request.compensation_label}` : ''}
            </p>

            {/* Remarks */}
            {request.remarks && (
                <p
                    className="font-body"
                    style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', margin: 0 }}
                >
                    {request.remarks}
                </p>
            )}

            {/* Filed date */}
            <p
                className="font-body"
                style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', margin: 0 }}
            >
                Filed {request.created_at ?? '—'}
            </p>

            {/* Approved info */}
            {status === 'approved' && request.approved_by_name && (
                <p
                    className="font-body"
                    style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)', margin: 0 }}
                >
                    Approved by {request.approved_by_name}
                    {request.approved_at ? ` on ${request.approved_at}` : ''}
                </p>
            )}

            {/* Rejected info */}
            {status === 'rejected' && (
                <div>
                    {request.rejected_by_name && (
                        <p
                            className="font-body"
                            style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-error)', margin: 0 }}
                        >
                            Rejected by {request.rejected_by_name}
                        </p>
                    )}
                    {request.rejection_reason && (
                        <p
                            className="font-body"
                            style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', marginTop: 2 }}
                        >
                            Reason: {request.rejection_reason}
                        </p>
                    )}
                </div>
            )}

            {/* Cancel — pending only, own requests */}
            {status === 'pending' && onCancel && (
                <div style={{ marginTop: 'var(--space-1)' }}>
                    <Button
                        size="sm"
                        variant="ghost"
                        loading={cancelling}
                        onClick={() => onCancel(request.id)}
                        style={{ color: 'var(--color-error)' }}
                    >
                        Cancel Request
                    </Button>
                </div>
            )}
        </div>
    );
}
