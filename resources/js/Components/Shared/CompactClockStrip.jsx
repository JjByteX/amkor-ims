// Components/Shared/CompactClockStrip.jsx
// Phase 4.2 — Persistent one-liner clock status shown on ALL Attendance tabs.
// On "My" tab: sits above the full ClockWidget card.
// On "Team" tab: only this strip is shown (no full card below it).

import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { LogIn, LogOut } from 'lucide-react';
import Button from '../UI/Button';
import Modal from '../UI/Modal';

const fmtTime = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12  = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
};

// Status dot colors: green = clocked in, gray = not clocked in, blue = clocked out
function StatusDot({ color }) {
    return (
        <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
        }} />
    );
}

export default function CompactClockStrip({ todayRecord, currentUser, now }) {
    const [showConfirm, setShowConfirm] = useState(null); // 'in' | 'out' | null
    const { post, processing } = useForm({});

    function handleClock(type) {
        setShowConfirm(null);
        post(route(type === 'in' ? 'attendance.clock-in' : 'attendance.clock-out'), {
            preserveScroll: true,
        });
    }

    const nowDate = new Date(now);
    const timeStr = nowDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

    const isClockedIn  = todayRecord?.time_in && !todayRecord?.time_out;
    const isClockedOut = todayRecord?.time_in && todayRecord?.time_out;

    let dotColor, statusText, actionBtn;

    if (isClockedOut) {
        dotColor   = 'var(--color-info)';
        statusText = `${currentUser.name} · Clocked out at ${fmtTime(todayRecord.time_out)}`;
        actionBtn  = null; // already done
    } else if (isClockedIn) {
        dotColor   = 'var(--color-success)';
        statusText = `${currentUser.name} · Clocked in at ${fmtTime(todayRecord.time_in)}${todayRecord.minutes_late > 0 ? ` · ${todayRecord.minutes_late}m late` : ''}`;
        actionBtn  = (
            <Button
                variant="danger"
                size="sm"
                icon={LogOut}
                loading={processing}
                onClick={() => setShowConfirm('out')}
            >
                Clock Out
            </Button>
        );
    } else {
        dotColor   = 'var(--color-text-muted, #888)';
        statusText = `${currentUser.name} · Not clocked in`;
        actionBtn  = (
            <Button
                size="sm"
                icon={LogIn}
                loading={processing}
                onClick={() => setShowConfirm('in')}
            >
                Clock In
            </Button>
        );
    }

    return (
        <>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '6px 12px',
                background: 'var(--color-card)',
                border: 'var(--border-container)',
                borderRadius: 'var(--radius-md)',
                flexWrap: 'wrap',
            }}>
                <StatusDot color={dotColor} />
                <span className="font-body" style={{
                    fontSize: 'var(--font-size-small)',
                    color: 'var(--color-text)',
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {statusText}
                </span>
                {actionBtn}
            </div>

            <Modal
                open={!!showConfirm}
                onClose={() => setShowConfirm(null)}
                title={showConfirm === 'in' ? 'Confirm Clock In' : 'Confirm Clock Out'}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                        <Button variant="ghost" onClick={() => setShowConfirm(null)}>Cancel</Button>
                        <Button
                            variant={showConfirm === 'in' ? 'primary' : 'danger'}
                            icon={showConfirm === 'in' ? LogIn : LogOut}
                            loading={processing}
                            onClick={() => handleClock(showConfirm)}
                        >
                            {showConfirm === 'in' ? 'Clock In Now' : 'Clock Out Now'}
                        </Button>
                    </div>
                }
            >
                <p className="font-body" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text)' }}>
                    {showConfirm === 'in'
                        ? `Record your time in now (${timeStr})?`
                        : `Record your time out now (${timeStr})?`}
                </p>
            </Modal>
        </>
    );
}
