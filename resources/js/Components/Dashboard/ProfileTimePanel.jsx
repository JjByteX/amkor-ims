import { useState, useCallback } from 'react';
import { usePage, Link } from '@inertiajs/react';
import {
    Shield, Clock, CheckCircle2, LogIn, LogOut,
    History, MonitorSmartphone, ArrowRightLeft,
    CalendarClock, Landmark, ReceiptText, Files, PlaneTakeoff,
    FileCheck2, WalletCards, CreditCard, Building2, ShieldCheck,
    MapPinned, Megaphone,
} from 'lucide-react';

/* ── Attention label → icon map ───────────────────────────────────────────── */
const ATTENTION_ICONS = {
    'Late records today'            : CalendarClock,
    'Pending payables'              : Landmark,
    'Open receivables'              : ReceiptText,
    'Bills pending'                 : Files,
    'Bills overdue'                 : Files,
    'Bookings awaiting confirmation': PlaneTakeoff,
    'Visa in process'               : FileCheck2,
    'Vouchers pending'              : WalletCards,
    'Card payments pending'         : CreditCard,
    'IATA pending'                  : Building2,
    'Cashbond reloads pending'      : ShieldCheck,
    'Ormoc pending'                 : MapPinned,
    'For approval'                  : Megaphone,
};
import Card from '../UI/Card';

/**
 * ProfileTimePanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Left-column dashboard card. Contains:
 *   1. Avatar + user name, role, branch
 *   2. Attendance — single button (Clock In → Clock Out → done chip)
 *   3. Alert badges for this role's attention items
 *   4. Login history — last N login/logout/clock events (from backend)
 *
 * Props:
 *   attentionItems  array  — from Dashboard.jsx
 *   loginActivity   array  — from Dashboard.jsx (passed from controller)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TODAY = new Date().toISOString().slice(0, 10);

function initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

function fmtTime(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

function fmtRelative(iso) {
    if (!iso) return '';
    const d   = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);

    if (diff < 60)          return 'just now';
    if (diff < 3600)        return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)       return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 2)   return 'yesterday';
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function loadRecord(uid) {
    try { return JSON.parse(localStorage.getItem(`amkor_tr_${uid}_${TODAY}`)) ?? {}; }
    catch { return {}; }
}

function saveRecord(uid, r) {
    try { localStorage.setItem(`amkor_tr_${uid}_${TODAY}`, JSON.stringify(r)); }
    catch {}
}

/* Activity type config */
const ACTIVITY_TYPE = {
    login   : { icon: LogIn,            color: 'var(--color-success)', label: 'Logged in'   },
    logout  : { icon: LogOut,           color: 'var(--color-text-muted)', label: 'Logged out'  },
    time_in : { icon: Clock,            color: 'var(--color-primary)', label: 'Clocked in'  },
    time_out: { icon: ArrowRightLeft,   color: 'var(--color-warning)', label: 'Clocked out' },
};

export default function ProfileTimePanel({ attentionItems = [], loginActivity = [] }) {
    const { auth } = usePage().props;
    const user     = auth?.user;
    const uid      = user?.id ?? 'guest';

    const roleLabel = (user?.role ?? '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    /* ── Attendance record ────────────────────────────────────────────────── */
    const [rec, setRec] = useState(() => loadRecord(uid));

    const handleRecord = useCallback(() => {
        if (!rec.timeIn) {
            const next = { ...rec, timeIn: new Date().toISOString() };
            setRec(next); saveRecord(uid, next);
        } else if (!rec.timeOut) {
            const next = { ...rec, timeOut: new Date().toISOString() };
            setRec(next); saveRecord(uid, next);
        }
    }, [rec, uid]);

    const state = !rec.timeIn ? 'idle' : !rec.timeOut ? 'in' : 'done';

    const BTN = {
        idle: {
            bg: 'var(--color-primary)', color: '#fff', border: 'none',
            label: 'Clock In', Icon: LogIn,
        },
        in: {
            bg: 'var(--color-card)',
            color: 'var(--color-success)',
            border: '1.5px solid var(--color-border)',
            label: 'Clock Out', Icon: LogOut,
        },
    };
    const btn = BTN[state];

    return (
        <Card style={{
            display      : 'flex',
            flexDirection: 'column',
            gap          : 16,
            padding      : 'var(--dash-card-pad, 20px)',
            height       : '100%',
            boxSizing    : 'border-box',
        }}>

            {/* ── Avatar + name / role / branch ──────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 46, height: 46, borderRadius: '50%',
                    background: 'var(--color-primary)', color: '#fff',
                    fontFamily: 'var(--font-heading)', fontWeight: 700,
                    fontSize: 16, letterSpacing: '0.02em', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {initials(user?.name)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{
                        fontFamily: 'var(--font-heading)', fontWeight: 700,
                        fontSize: 14, color: 'var(--color-text)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {user?.name ?? 'User'}
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        <Shield size={11} strokeWidth={2} />
                        {roleLabel}
                    </p>
                    {user?.branch_name && (
                        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
                            {user.branch_name}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Attendance ──────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {state === 'done' ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        height: 'var(--dash-timebtn-h, 44px)', borderRadius: 'var(--radius-md)',
                        background: 'var(--color-primary)',
                        border: 'none',
                        fontSize: 13, fontWeight: 600, color: '#ffffff',
                    }}>
                        <CheckCircle2 size={16} strokeWidth={2.2} />
                        Attendance recorded
                    </div>
                ) : (
                    <button
                        onClick={handleRecord}
                        style={{
                            height: 'var(--dash-timebtn-h, 44px)', width: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            borderRadius: 'var(--radius-md)', border: btn.border,
                            cursor: 'pointer', fontSize: 14, fontWeight: 600,
                            fontFamily: 'var(--font-body)', background: btn.bg, color: btn.color,
                            transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                        <btn.Icon size={16} strokeWidth={2.2} />
                        {btn.label}
                    </button>
                )}

                {/* Time detail row — shown once clocked in */}
                {(rec.timeIn || rec.timeOut) && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '7px 12px', borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg)', fontSize: 12,
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-muted)' }}>
                            <Clock size={11} />
                            In:&nbsp;<strong style={{ color: 'var(--color-text)' }}>{fmtTime(rec.timeIn) ?? '—'}</strong>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-muted)' }}>
                            Out:&nbsp;<strong style={{ color: rec.timeOut ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                                {fmtTime(rec.timeOut) ?? '—'}
                            </strong>
                        </span>
                    </div>
                )}
            </div>

            {attentionItems.length > 0 && (
                <>
                    <div style={{ height: 1, background: 'var(--color-border-soft)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {attentionItems.slice(0, 6).map((item, i) => {
                                const ItemIcon = ATTENTION_ICONS[item.label] ?? Megaphone;
                                const badge  = (
                                    <div
                                        key={i}
                                        style={{
                                            display        : 'flex',
                                            alignItems     : 'center',
                                            justifyContent : 'space-between',
                                            padding        : 'var(--badge-py, 4px) var(--space-1, 8px)',
                                            borderRadius   : 'var(--radius-md)',
                                            fontSize       : 13,
                                        }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontWeight: 400 }}>
                                            <ItemIcon size={15} strokeWidth={1.75} />
                                            {item.label}
                                        </span>
                                        <span style={{
                                            background  : 'var(--color-border)',
                                            color       : 'var(--color-text)',
                                            borderRadius: 99,
                                            fontSize    : 'var(--badge-font-size, 11px)',
                                            fontWeight  : 700,
                                            padding     : 'var(--badge-py, 2px) var(--badge-px, 7px)',
                                            lineHeight  : 1.5,
                                        }}>
                                            {item.value}
                                        </span>
                                    </div>
                                );
                                return item.href
                                    ? <Link key={i} href={item.href} className="block no-underline">{badge}</Link>
                                    : badge;
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* ── Login history ──────────────────────────────────────── */}
            <>
                <div style={{ height: 1, background: 'var(--color-border-soft)', marginTop: 'auto' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.07em', color: 'var(--color-text-muted)',
                        display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                        <History size={10} strokeWidth={2.5} />
                        Login history
                    </p>

                    {loginActivity.length === 0 ? (
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            No activity recorded yet.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {loginActivity.slice(0, 6).map((item, i) => {
                                const cfg  = ACTIVITY_TYPE[item.type] ?? ACTIVITY_TYPE.login;
                                const Icon = cfg.icon;
                                const isFirst = i === 0;
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            display    : 'flex',
                                            alignItems : 'center',
                                            gap        : 9,
                                            padding    : '6px 8px',
                                            borderRadius: 'var(--radius-md)',
                                            background : isFirst
                                                ? 'color-mix(in srgb, var(--color-primary) 6%, var(--color-card))'
                                                : 'transparent',
                                            transition : 'background 0.1s',
                                        }}
                                    >
                                        {/* Icon dot */}
                                        <div style={{
                                            width        : 26,
                                            height       : 26,
                                            borderRadius : '50%',
                                            background   : `color-mix(in srgb, ${cfg.color} 12%, var(--color-card))`,
                                            border       : `1px solid color-mix(in srgb, ${cfg.color} 22%, transparent)`,
                                            color        : cfg.color,
                                            display      : 'flex',
                                            alignItems   : 'center',
                                            justifyContent: 'center',
                                            flexShrink   : 0,
                                        }}>
                                            <Icon size={12} strokeWidth={2.2} />
                                        </div>

                                        {/* Label + time */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                fontSize  : 12,
                                                fontWeight: isFirst ? 600 : 500,
                                                color     : isFirst ? 'var(--color-text)' : 'var(--color-text-muted)',
                                                lineHeight: 1.3,
                                            }}>
                                                {item.label ?? cfg.label}
                                            </p>
                                        </div>

                                        {/* Relative time */}
                                        <span style={{
                                            fontSize   : 11,
                                            color      : 'var(--color-text-muted)',
                                            flexShrink : 0,
                                            fontVariantNumeric: 'tabular-nums',
                                        }}>
                                            {fmtRelative(item.at)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </>
        </Card>
    );
}