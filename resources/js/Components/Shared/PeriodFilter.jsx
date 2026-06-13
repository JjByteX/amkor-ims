import { useMemo } from 'react';
import SegmentedControl from '../UI/SegmentedControl';
import DatePicker from '../UI/DatePicker';
import MonthPicker from '../UI/MonthPicker';
import Select from '../UI/Select';

/**
 * PeriodFilter — universal day/week/month/year filter control.
 *
 * Centralizes the "view by day/week/month/year" pattern so any Index page
 * (Airline Rates, Sales Summary, etc.) can drop this in once instead of
 * re-implementing period pickers per page.
 *
 * Emits a normalized { period, date_from, date_to } object via onChange —
 * controllers only ever need to filter on date_from/date_to, regardless of
 * which granularity the user picked. This keeps backend filtering generic.
 *
 * Props:
 *   value     : { period: 'day'|'week'|'month'|'year', anchor: string }
 *               anchor is the reference date/value for the selected period:
 *                 day   → 'YYYY-MM-DD'
 *                 week  → 'YYYY-MM-DD' (any date within the target week)
 *                 month → 'YYYY-MM'
 *                 year  → 'YYYY'
 *   onChange  : (next: { period, anchor, date_from, date_to }) => void
 *   yearsBack : how many years to offer in the year dropdown (default 5)
 */
export default function PeriodFilter({ value, onChange, yearsBack = 5 }) {
    const period = value?.period ?? 'day';
    const anchor = value?.anchor ?? defaultAnchor(period);

    const tabs = [
        { key: 'day',   label: 'Day' },
        { key: 'week',  label: 'Week' },
        { key: 'month', label: 'Month' },
        { key: 'year',  label: 'Year' },
    ];

    const yearOptions = useMemo(() => {
        const current = new Date().getFullYear();
        return Array.from({ length: yearsBack + 1 }, (_, i) => {
            const y = current - i;
            return { value: String(y), label: String(y) };
        });
    }, [yearsBack]);

    function emit(nextPeriod, nextAnchor) {
        const { date_from, date_to } = rangeFor(nextPeriod, nextAnchor);
        onChange?.({ period: nextPeriod, anchor: nextAnchor, date_from, date_to });
    }

    function handlePeriodChange(nextPeriod) {
        emit(nextPeriod, defaultAnchor(nextPeriod));
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <SegmentedControl tabs={tabs} activeKey={period} onChange={handlePeriodChange} />

            {period === 'day' && (
                <DatePicker
                    value={anchor}
                    onChange={(e) => emit('day', e.target.value)}
                />
            )}

            {period === 'week' && (
                <DatePicker
                    value={anchor}
                    onChange={(e) => emit('week', e.target.value)}
                />
            )}

            {period === 'month' && (
                <MonthPicker
                    value={anchor}
                    onChange={(e) => emit('month', e.target.value)}
                />
            )}

            {period === 'year' && (
                <Select
                    options={yearOptions}
                    value={anchor}
                    onChange={(e) => emit('year', e.target.value)}
                />
            )}
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function pad(n) {
    return String(n).padStart(2, '0');
}

function toISO(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function defaultAnchor(period) {
    const now = new Date();
    switch (period) {
        case 'month':
            return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
        case 'year':
            return String(now.getFullYear());
        case 'day':
        case 'week':
        default:
            return toISO(now);
    }
}

/**
 * Compute an inclusive [date_from, date_to] range for the given period/anchor.
 * Week runs Monday–Sunday, containing the anchor date.
 */
function rangeFor(period, anchor) {
    if (period === 'day') {
        return { date_from: anchor, date_to: anchor };
    }

    if (period === 'week') {
        const d = new Date(`${anchor}T00:00:00`);
        const dow = d.getDay(); // 0 = Sunday
        const mondayOffset = dow === 0 ? -6 : 1 - dow;
        const monday = new Date(d);
        monday.setDate(d.getDate() + mondayOffset);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { date_from: toISO(monday), date_to: toISO(sunday) };
    }

    if (period === 'month') {
        const [y, m] = anchor.split('-').map(Number);
        const first = new Date(y, m - 1, 1);
        const last = new Date(y, m, 0);
        return { date_from: toISO(first), date_to: toISO(last) };
    }

    if (period === 'year') {
        const y = Number(anchor);
        return { date_from: `${y}-01-01`, date_to: `${y}-12-31` };
    }

    return { date_from: anchor, date_to: anchor };
}
