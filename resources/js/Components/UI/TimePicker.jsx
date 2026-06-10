import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

/**
 * TimePicker — fully custom time selector. No native <input type="time">.
 * Works identically in Chrome, Firefox, Safari.
 *
 * Drop-in for <Input type="time" />:
 *   <TimePicker
 *     label="Time In"
 *     value={data.time_in}            // 'HH:MM' (24-hr) or ''
 *     onChange={(e) => setData('time_in', e.target.value)}
 *     error={errors.time_in}
 *   />
 *
 * onChange fires { target: { value: 'HH:MM' } } in 24-hour format.
 * Displays in 12-hour AM/PM format to the user.
 */

const HOURS   = Array.from({ length: 12 }, (_, i) => i + 1);   // 1–12
const MINUTES = Array.from({ length: 60 }, (_, i) => i);        // 0–59

function parse24(str) {
    if (!str || typeof str !== 'string') return null;
    const [h, m] = str.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return { h, m };
}
function to24(hour12, minute, ampm) {
    let h = hour12 % 12;
    if (ampm === 'PM') h += 12;
    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
function fmtDisplay(parsed) {
    if (!parsed) return '';
    const h = parsed.h % 12 || 12;
    const m = String(parsed.m).padStart(2, '0');
    const ampm = parsed.h < 12 ? 'AM' : 'PM';
    return `${h}:${m} ${ampm}`;
}

// ── Popup ─────────────────────────────────────────────────────────────────────
function TimePopup({ anchorRef, value, onChange, onClose }) {
    const parsed = value;
    const initH  = parsed ? (parsed.h % 12 || 12) : 12;
    const initM  = parsed ? parsed.m : 0;
    const initAP = parsed ? (parsed.h < 12 ? 'AM' : 'PM') : 'AM';

    const [selH,  setSelH ] = useState(initH);
    const [selM,  setSelM ] = useState(initM);
    const [ampm,  setAmpm ] = useState(initAP);
    const [pos, setPos] = useState(null);
    const ref = useRef(null);
    const hourRef   = useRef(null);
    const minuteRef = useRef(null);

    useEffect(() => {
        if (!anchorRef.current) return;
        const rect  = anchorRef.current.getBoundingClientRect();
        const pW    = Math.max(rect.width, 220);
        const spill = rect.left + pW - window.innerWidth;
        const left  = spill > 0
            ? Math.max(8, rect.right + window.scrollX - pW)
            : rect.left + window.scrollX;
        setPos({ top: rect.bottom + window.scrollY + 6, left, width: rect.width });
    }, [anchorRef]);

    useEffect(() => {
        function onDown(e) {
            if (ref.current && !ref.current.contains(e.target) && anchorRef.current && !anchorRef.current.contains(e.target))
                onClose();
        }
        function onKey(e) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [anchorRef, onClose]);

    // Scroll active items into view
    useEffect(() => {
        if (hourRef.current) {
            const el = hourRef.current.querySelector('[data-active="true"]');
            if (el) el.scrollIntoView({ block: 'center' });
        }
    }, []);
    useEffect(() => {
        if (minuteRef.current) {
            const el = minuteRef.current.querySelector('[data-active="true"]');
            if (el) el.scrollIntoView({ block: 'center' });
        }
    }, []);

    function confirm() {
        onChange?.({ target: { value: to24(selH, selM, ampm) } });
        onClose();
    }

    const popW = Math.max(pos?.width ?? 0, 220);
    const o = {
        bg: 'var(--color-card)', border: 'var(--border-container)', radius: 'var(--radius-md)',
        radiusLg: 'var(--radius-lg)', primary: 'var(--color-primary)', text: 'var(--color-text)',
        muted: 'var(--color-text-muted)', hover: 'var(--color-hover)',
        fSmall: 'var(--font-size-small)', fBody: 'var(--font-body)',
    };

    const colStyle = {
        flex: 1, overflowY: 'auto', maxHeight: 180,
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE
    };
    const itemStyle = (active) => ({
        padding: '7px 4px', textAlign: 'center', cursor: 'pointer', borderRadius: o.radius,
        fontSize: o.fSmall, fontFamily: o.fBody, fontWeight: active ? 600 : 400,
        background: active ? o.primary : 'none',
        color: active ? '#fff' : o.text,
        userSelect: 'none',
    });

    return createPortal(
        <div ref={ref} style={{
            position: 'absolute', top: pos?.top ?? 0, left: pos?.left ?? 0, width: popW, visibility: pos ? 'visible' : 'hidden', zIndex: 99999,
            background: o.bg, border: o.border, borderRadius: o.radiusLg,
            boxShadow: '0 16px 48px -12px rgba(15,23,42,0.22), 0 4px 16px -4px rgba(15,23,42,0.10)',
            overflow: 'hidden', fontFamily: o.fBody,
        }}>
            {/* Column headers */}
            <div style={{ display:'flex', borderBottom:o.border, padding:'6px 8px' }}>
                {['Hour','Min',''].map((h, i) => (
                    <div key={i} style={{ flex:1, textAlign:'center', fontSize:10, fontWeight:600, color:o.muted, fontFamily:o.fBody, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</div>
                ))}
            </div>

            {/* Scroll columns */}
            <div style={{ display:'flex', gap:4, padding:'4px 8px' }}>
                {/* Hours */}
                <div ref={hourRef} style={colStyle}>
                    {HOURS.map(h => (
                        <div key={h} data-active={h === selH} onClick={() => setSelH(h)}
                            style={itemStyle(h === selH)}
                            onMouseEnter={e => { if (h !== selH) e.currentTarget.style.background = o.hover; }}
                            onMouseLeave={e => { if (h !== selH) e.currentTarget.style.background = 'none'; }}
                        >{String(h).padStart(2,'0')}</div>
                    ))}
                </div>

                {/* Minutes */}
                <div ref={minuteRef} style={colStyle}>
                    {MINUTES.map(m => (
                        <div key={m} data-active={m === selM} onClick={() => setSelM(m)}
                            style={itemStyle(m === selM)}
                            onMouseEnter={e => { if (m !== selM) e.currentTarget.style.background = o.hover; }}
                            onMouseLeave={e => { if (m !== selM) e.currentTarget.style.background = 'none'; }}
                        >{String(m).padStart(2,'0')}</div>
                    ))}
                </div>

                {/* AM / PM */}
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4, justifyContent:'center' }}>
                    {['AM','PM'].map(ap => (
                        <div key={ap} onClick={() => setAmpm(ap)}
                            style={{ ...itemStyle(ap === ampm), padding:'10px 4px' }}
                            onMouseEnter={e => { if (ap !== ampm) e.currentTarget.style.background = o.hover; }}
                            onMouseLeave={e => { if (ap !== ampm) e.currentTarget.style.background = 'none'; }}
                        >{ap}</div>
                    ))}
                </div>
            </div>

            {/* Confirm */}
            <div style={{ padding:'8px 12px', borderTop:o.border, display:'flex', justifyContent:'flex-end', gap:8 }}>
                <button onClick={onClose} style={{
                    fontSize:o.fSmall, fontFamily:o.fBody, fontWeight:500, color:o.muted,
                    background:'none', border:'none', cursor:'pointer', padding:'4px 10px', borderRadius:o.radius,
                }}
                onMouseEnter={e => e.currentTarget.style.background = o.hover}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >Cancel</button>
                <button onClick={confirm} style={{
                    fontSize:o.fSmall, fontFamily:o.fBody, fontWeight:600, color:'#fff',
                    background:o.primary, border:'none', cursor:'pointer', padding:'4px 14px', borderRadius:o.radius,
                }}>Set</button>
            </div>
        </div>,
        document.body
    );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function TimePicker({
    label       = '',
    value       = '',
    onChange,
    error       = null,
    placeholder = '--:-- --',
    disabled    = false,
    required    = false,
    className   = '',
    id,
}) {
    const [open,    setOpen   ] = useState(false);
    const [focused, setFocused] = useState(false);
    const anchorRef = useRef(null);

    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const parsed  = parse24(value);
    const display = fmtDisplay(parsed);
    const isActive = open || focused;

    const handleClose = useCallback(() => setOpen(false), []);
    const handleClear = useCallback((e) => {
        e.stopPropagation();
        onChange?.({ target: { value: '' } });
    }, [onChange]);

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label htmlFor={inputId} style={{
                    fontSize:'var(--font-size-small)', fontFamily:'var(--font-body)',
                    fontWeight:'var(--font-weight-semibold)', color:'var(--color-text)',
                    lineHeight:1.25, cursor:'default',
                }}>
                    {label}
                    {required && <span style={{ color:'var(--color-error)', marginLeft:2 }}>*</span>}
                </label>
            )}

            <div
                ref={anchorRef}
                id={inputId}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => { if (!disabled) setOpen(o => !o); }}
                onKeyDown={e => { if (!disabled && (e.key==='Enter'||e.key===' ')) { e.preventDefault(); setOpen(o=>!o); } }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    height: 'var(--height-input)', borderRadius: 'var(--radius-md)',
                    border: error
                        ? `${isActive?'2px':'1.5px'} solid var(--color-error)`
                        : isActive ? '2px solid var(--color-primary)' : 'var(--border-container)',
                    paddingLeft: 'calc(var(--space-2) + 18px + 8px)',
                    paddingRight: parsed ? 'calc(var(--space-1) + 22px)' : 'var(--space-2)',
                    fontSize: 'var(--font-size-body)', fontFamily: 'var(--font-body)', fontWeight: 500,
                    background: 'var(--color-card)',
                    color: parsed ? 'var(--color-text)' : 'var(--color-text-muted)',
                    opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', position: 'relative',
                    userSelect: 'none', boxSizing: 'border-box', outline: 'none',
                }}
            >
                <span style={{
                    position:'absolute', left:'var(--space-1)', top:'50%', transform:'translateY(-50%)',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    display:'flex', alignItems:'center', pointerEvents:'none',
                }}>
                    <Clock size={16}/>
                </span>

                <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {display || placeholder}
                </span>

                {parsed && !disabled && (
                    <button onClick={handleClear} tabIndex={-1} aria-label="Clear time" style={{
                        position:'absolute', right:'var(--space-1)', top:'50%', transform:'translateY(-50%)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        width:18, height:18, borderRadius:'50%', border:'none',
                        background:'var(--color-text-muted)', color:'var(--color-card)',
                        fontSize:11, lineHeight:1, cursor:'pointer', opacity:0.55,
                    }}>×</button>
                )}
            </div>

            {open && (
                <TimePopup
                    anchorRef={anchorRef}
                    value={parsed}
                    onChange={onChange}
                    onClose={handleClose}
                />
            )}

            {error && (
                <p style={{ fontSize:'var(--font-size-small)', fontFamily:'var(--font-body)', color:'var(--color-error)', marginTop:2 }}>
                    {error}
                </p>
            )}
        </div>
    );
}
