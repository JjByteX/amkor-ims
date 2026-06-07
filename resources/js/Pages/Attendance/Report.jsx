import { router } from '@inertiajs/react';
import {
    ChevronLeft, ChevronRight, Download, ArrowLeft,
    Users, CheckCircle, XCircle, Clock, AlertTriangle,
} from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import FilterStrip, { FilterField } from '../../Components/Shared/FilterStrip';
import PageStack from '../../Components/Shared/PageStack';
import StatCard from '../../Components/Shared/StatCard';
import StatGrid from '../../Components/Shared/StatGrid';
import Button from '../../Components/UI/Button';
import Select from '../../Components/UI/Select';
import DataTable from '../../Components/Shared/DataTable';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

const fmtMinutes = (min) => {
    if (!min || min === 0) return '—';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

// ── Totals helper ─────────────────────────────────────────────────────────────

function sumCol(summary, col) {
    return summary.reduce((acc, row) => acc + (parseInt(row[col], 10) || 0), 0);
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AttendanceReport({ summary, filters, branches, canExport }) {
    const month    = filters.month;
    const year     = filters.year;
    const branchId = filters.branchId;

    function goMonth(delta) {
        let m = month + delta;
        let y = year;
        if (m > 12) { m = 1; y++; }
        if (m < 1)  { m = 12; y--; }
        router.get(route('attendance.report'), { ...filters, month: m, year: y }, { preserveState: true });
    }

    function applyFilter(overrides = {}) {
        router.get(route('attendance.report'), { ...filters, ...overrides }, { preserveState: true });
    }

    // Grand totals
    const totals = {
        present:   sumCol(summary, 'days_present'),
        absent:    sumCol(summary, 'days_absent'),
        half:      sumCol(summary, 'days_half'),
        leave:     sumCol(summary, 'days_leave'),
        holiday:   sumCol(summary, 'days_holiday'),
        worked:    sumCol(summary, 'total_minutes_worked'),
        late:      sumCol(summary, 'total_minutes_late'),
        undertime: sumCol(summary, 'total_minutes_undertime'),
    };

    const columns = [
        {
            key: 'employee',
            label: 'Employee',
            render: (row) => (
                <div>
                    <div className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                        {row.user?.name ?? `Employee #${row.employee_id}`}
                    </div>
                    <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.5 }}>
                        {row.branch?.name ?? '—'}
                    </div>
                </div>
            ),
        },
        {
            key: 'days_present',
            label: 'Present',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-success)', fontWeight: 600 }}>
                    {row.days_present ?? 0}
                </span>
            ),
        },
        {
            key: 'days_absent',
            label: 'Absent',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: row.days_absent > 0 ? 'var(--color-error)' : 'var(--color-text)', fontWeight: row.days_absent > 0 ? 600 : 400 }}>
                    {row.days_absent ?? 0}
                </span>
            ),
        },
        {
            key: 'days_half',
            label: 'Half Day',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {row.days_half ?? 0}
                </span>
            ),
        },
        {
            key: 'days_leave',
            label: 'On Leave',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-info)' }}>
                    {row.days_leave ?? 0}
                </span>
            ),
        },
        {
            key: 'total_minutes_worked',
            label: 'Hours Worked',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)' }}>
                    {fmtMinutes(row.total_minutes_worked)}
                </span>
            ),
        },
        {
            key: 'total_minutes_late',
            label: 'Total Late',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: row.total_minutes_late > 0 ? 'var(--color-warning)' : 'var(--color-text)' }}>
                    {fmtMinutes(row.total_minutes_late)}
                </span>
            ),
        },
        {
            key: 'total_minutes_undertime',
            label: 'Undertime',
            render: (row) => (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: row.total_minutes_undertime > 0 ? 'var(--color-warning)' : 'var(--color-text)' }}>
                    {fmtMinutes(row.total_minutes_undertime)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.get(route('attendance.index'), {
                        employee_id: row.employee_id,
                        month,
                        year,
                    })}
                >
                    Details
                </Button>
            ),
        },
    ];

    return (
        <AppShell>
            <PageStack>

                <PageHeader
                    title="Attendance Report"
                    subtitle={`Monthly summary · ${MONTHS[month - 1]} ${year}`}
                    actions={
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                            <Button variant="ghost" icon={ArrowLeft} onClick={() => router.get(route('attendance.index'))}>
                                Back
                            </Button>
                            {canExport && (
                                <Button variant="secondary" icon={Download} onClick={() => {}}>
                                    Export
                                </Button>
                            )}
                        </div>
                    }
                />

                <StatGrid min="150px">
                    <StatCard icon={CheckCircle} label="Present" value={totals.present} tone="success" />
                    <StatCard icon={XCircle} label="Absent" value={totals.absent} tone="error" />
                    <StatCard icon={Users} label="On Leave" value={totals.leave} tone="info" />
                    <StatCard icon={AlertTriangle} label="Total Late" value={fmtMinutes(totals.late)} tone="warning" />
                    <StatCard icon={Clock} label="Hrs Worked" value={fmtMinutes(totals.worked)} tone="primary" />
                </StatGrid>

                {/* Summary table */}
                <DataTable
                    columns={columns}
                    rows={summary}
                    emptyMessage={`No attendance records found for ${MONTHS[month - 1]} ${year}.`}
                    toolbar={
                        <FilterStrip>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => goMonth(-1)} />
                                <span className="font-body font-semibold" style={{ fontSize: 'var(--font-size-small)', minWidth: 130, textAlign: 'center', color: 'var(--color-text)' }}>
                                    {MONTHS[month - 1]} {year}
                                </span>
                                <Button variant="ghost" size="sm" icon={ChevronRight} onClick={() => goMonth(1)} />
                            </div>
                            {branches?.length > 1 && (
                                <FilterField width={190}>
                                    <Select
                                        options={[
                                            { value: '', label: 'All Branches' },
                                            ...branches.map((b) => ({ value: b.id, label: b.name })),
                                        ]}
                                        value={branchId ?? ''}
                                        onChange={(e) => applyFilter({ branch_id: e.target.value || undefined })}
                                    />
                                </FilterField>
                            )}
                        </FilterStrip>
                    }
                />

                {/* Footnote */}
                <div className="font-body" style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.4, textAlign: 'right' }}>
                    Standard hours: 8:00 AM – 5:00 PM · Late threshold: past 8:00 AM · Undertime: before 5:00 PM
                </div>
            </PageStack>
        </AppShell>
    );
}
