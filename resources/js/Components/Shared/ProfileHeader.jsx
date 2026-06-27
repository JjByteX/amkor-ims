import Badge from '../UI/Badge';

// ── ProfileHeader ────────────────────────────────────────────────────────────
// Employee identity strip for the top of the full Employee Profile page
// (Phase 3.4 wires this into EmployeeRecords/Show.jsx — not done here).

const STATUS_VARIANT = {
    probationary: 'warning',
    regular:      'success',
    resigned:     'neutral',
    terminated:   'error',
};

function tenureString(dateHired) {
    if (!dateHired) return null;

    const hired = new Date(dateHired);
    const now   = new Date();
    if (Number.isNaN(hired.getTime())) return null;

    let years  = now.getFullYear() - hired.getFullYear();
    let months = now.getMonth() - hired.getMonth();
    if (now.getDate() < hired.getDate()) months -= 1;
    if (months < 0) { years -= 1; months += 12; }
    years = Math.max(0, years);
    months = Math.max(0, months);

    if (years === 0) return `${months} mo${months !== 1 ? 's' : ''}`;
    if (months === 0) return `${years} yr${years !== 1 ? 's' : ''}`;
    return `${years} yr${years !== 1 ? 's' : ''} ${months} mo${months !== 1 ? 's' : ''}`;
}

function fmtDate(d) {
    return d
        ? new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
        : '—';
}

export default function ProfileHeader({ employee, statuses = {} }) {
    const initial = (employee.display_name ?? employee.full_name ?? '?').charAt(0).toUpperCase();
    const tenure  = tenureString(employee.date_hired);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                background: 'var(--color-card)',
                border: 'var(--border-container)',
                borderRadius: 'var(--radius-md)',
            }}
        >
            {/* Avatar — same style as the sidebar account avatar, scaled up */}
            <div
                className="rounded-full flex items-center justify-center shrink-0"
                style={{ width: 64, height: 64, background: 'var(--color-primary)' }}
            >
                <span className="text-white font-heading font-bold" style={{ fontSize: 24 }}>
                    {initial}
                </span>
            </div>

            <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span
                        className="font-heading font-semibold"
                        style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-text)' }}
                    >
                        {employee.display_name ?? employee.full_name}
                    </span>
                    <Badge variant={STATUS_VARIANT[employee.employment_status] ?? 'neutral'}>
                        {statuses[employee.employment_status] ?? employee.employment_status}
                    </Badge>
                    {employee.is_agent && <Badge variant="info">Agent</Badge>}
                </div>

                <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.65, marginTop: 4 }}>
                    {[employee.position, employee.branch?.name].filter(Boolean).join(' · ')}
                </div>

                <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5, marginTop: 2 }}>
                    Hired {fmtDate(employee.date_hired)}
                    {tenure && ` · ${tenure}`}
                </div>
            </div>
        </div>
    );
}
