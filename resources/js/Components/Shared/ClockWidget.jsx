// Components/Shared/ClockWidget.jsx
// Extracted from Pages/Attendance/Index.jsx (Phase 4.1).
// Reused in Attendance/Index.jsx "My Attendance" tab (full card)
// and via CompactClockStrip for the persistent header strip.

import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { LogIn, LogOut } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import Modal from '../UI/Modal';

const fmtTime = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12  = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
};

const fmtMinutes = (min) => {
    if (!min) return '—';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

export default function ClockWidget({ todayRecord, currentUser, now }) {
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
    const dateStr = nowDate.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const isClockedIn  = todayRecord?.time_in && !todayRecord?.time_out;
    const isClockedOut = todayRecord?.time_in && todayRecord?.time_out;

    return (
        <>
            <Card>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'space-between' }}>
                    {/* Date/time display */}
                    <div>
                        <div className="font-heading font-semibold" style={{ fontSize: 'var(--font-size-heading)', color: 'var(--color-text)' }}>
                            {timeStr}
                        </div>
                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55 }}>
                            {dateStr}
                        </div>
                        <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.7, marginTop: 2 }}>
                            {currentUser.name}
                        </div>
                    </div>

                    {/* Today's status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {isClockedOut ? (
                            <div style={{ textAlign: 'right' }}>
                                <Badge variant="success">Clocked Out</Badge>
                                <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55, marginTop: 4 }}>
                                    {fmtTime(todayRecord.time_in)} → {fmtTime(todayRecord.time_out)}
                                    {' · '}{fmtMinutes(todayRecord.minutes_worked)}
                                </div>
                                {todayRecord.minutes_overtime > 0 && (
                                    <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 2 }}>
                                        +{todayRecord.minutes_overtime}m overtime
                                    </div>
                                )}
                                {todayRecord.minutes_overbreak > 0 && (
                                    <div style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 2 }}>
                                        {todayRecord.minutes_overbreak}m overbreak
                                    </div>
                                )}
                            </div>
                        ) : isClockedIn ? (
                            <div style={{ textAlign: 'right' }}>
                                <Badge variant="warning">Clocked In</Badge>
                                <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55, marginTop: 4 }}>
                                    Since {fmtTime(todayRecord.time_in)}
                                    {todayRecord.minutes_late > 0 && (
                                        <span style={{ color: 'var(--color-warning)', marginLeft: 6 }}>
                                            {todayRecord.minutes_late}m late
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    icon={LogOut}
                                    loading={processing}
                                    onClick={() => setShowConfirm('out')}
                                    style={{ marginTop: 8 }}
                                >
                                    Clock Out
                                </Button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'right' }}>
                                <div className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text)', opacity: 0.55, marginBottom: 8 }}>
                                    Not yet clocked in today
                                </div>
                                <Button
                                    icon={LogIn}
                                    loading={processing}
                                    onClick={() => setShowConfirm('in')}
                                >
                                    Clock In
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

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
