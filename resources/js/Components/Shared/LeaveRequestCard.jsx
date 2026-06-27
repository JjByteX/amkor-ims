import { router } from '@inertiajs/react';
import Badge from '../UI/Badge';
import Button from '../UI/Button';

/**
 * LeaveRequestCard
 *
 * Displays a single leave request as a card with a left-border status accent.
 * Used in the employee self-service view of /hr/leave.
 *
 * Props:
 *   request       : object  (formatted leave request from controller)
 *   onCancel      : fn(id)  (called when employee cancels — triggers PATCH)
 *   cancelling    : bool    (loading state for cancel button)
 *   showEmployee  : bool    (show employee name — for HR compact list, default false)
 */

const STATUS_VARIANT = {
    draft     : 'neutral',
    pending   : 'warning',
    approved  : 'success',
    rejected  : 'error',
    cancelled : 'neutral',
};

const BORDER_COLOR = {
    draft     : 'var(--color-border)',
    pending   : 'var(--color-warning)',
    approved  : 'var(--color-success)',
    rejected  : 'var(--color-error)',
    cancelled : 'var(--color-border)',
};

function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

export default function LeaveRequestCard({
    request,
    onCancel,
    cancelling   = false,
    showEmployee = false,
}) {
    const status       = request.status ?? 'pending';
    const borderColor  = BORDER_COLOR[status] ?? 'var(--color-border)';
    const badgeVariant = STATUS_VARIANT[status] ?? 'neutral';

    const dateRange = request.date_from === request.date_to
        ? fmt(request.date_from)
        : `${fmt(request.date_from)} – ${fmt(request.date_to)}`;

    const duration = Number(request.days_requested) === 0.5
        ? '½ day'
        : `${request.days_requested} day${request.days_requested !== 1 ? 's' : ''}`;

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
                    <p
                        className="font-heading font-semibold text-[var(--color-text)]"
                        style={{ fontSize: 'var(--font-size-body)', margin: 0 }}
                    >
                        {request.leave_type_label}
                    </p>
                    <p
                        className="font-body"
                        style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', marginTop: 2 }}
                    >
                        {dateRange} · {duration}
                        {request.session && request.session !== 'full_day'
                            ? ` · ${request.session_label}`
                            : ''}
                    </p>
                </div>
                <Badge variant={badgeVariant}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
            </div>

            {/* Filed date */}
            <p
                className="font-body"
                style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)', margin: 0 }}
            >
                Filed {fmt(request.created_at)}
            </p>

            {/* Remarks */}
            {request.remarks && (
                <p
                    className="font-body"
                    style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', margin: 0 }}
                >
                    {request.remarks}
                </p>
            )}

            {/* Approved / rejected info */}
            {status === 'approved' && request.approved_by_name && (
                <p
                    className="font-body"
                    style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)', margin: 0 }}
                >
                    Approved by {request.approved_by_name}
                    {request.approved_at ? ` on ${fmt(request.approved_at)}` : ''}
                </p>
            )}

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

            {/* Cancel action — pending only, own requests */}
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
