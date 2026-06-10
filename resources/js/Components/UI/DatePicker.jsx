import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

/**
 * DatePicker — typeable text input on the left + calendar icon on the right.
 *
 * Accepted typed formats: MM/DD/YYYY · M/D/YYYY · YYYY-MM-DD · "Jan 5 2024" etc.
 * Commit on Enter or blur. Invalid text reverts to last valid value.
 * Calendar icon opens the mouse-driven popup.
 *
 * onChange fires { target: { value: 'YYYY-MM-DD' } } — identical to a native
 * input event so all existing Inertia useForm handlers work unchanged.
 */

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function parseISO(str) {
    if (!str || typeof str !== 'string') return null;
    const [y, m, d] = str.split('-').map(Number);
    if (!y || !m || !d) return null;
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return dt;
}
function toISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
function fmtDisplay(date) {
    if (!date) return '';
    return `${MONTHS[date.getMonth()].slice(0,3)} ${date.getDate()}, ${date.getFullYear()}`;
}
function isSameDay(a, b) {
    return a && b
        && a.getFullYear() === b.getFullYear()
        && a.getMonth()    === b.getMonth()
        && a.getDate()     === b.getDate();
}
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDow(y, m)    { return new Date(y, m, 1).getDay(); }

function parseTyped(str) {
    if (!str || !str.trim()) return null;
    const s = str.trim();
    // YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
        const [y, m, d] = s.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) return dt;
    }
    // MM/DD/YYYY or MM-DD-YYYY
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(s)) {
        const parts = s.split(/[\/\-]/).map(Number);
        let [m, d, y] = parts;
        if (y < 100) y += 2000;
        const dt = new Date(y, m - 1, d);
        if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) return dt;
    }
    // "Jan 5, 2024" / "January 5 2024" / "5 Jan 2024"
    const monthNames = MONTHS.map(n => n.toLowerCase());
    const monthAbbr  = monthNames.map(n => n.slice(0, 3));
    const mMatch = s.match(
        /^(\d{1,2})\s+([a-zA-Z]+)[,\s]+(\d{4})$|^([a-zA-Z]+)[,\s]+(\d{1,2})[,\s]+(\d{4})$/
    );
    if (mMatch) {
        let mName, day, year;
        if (mMatch[1]) { day = Number(mMatch[1]); mName = mMatch[2].toLowerCase(); year = Number(mMatch[3]); }
        else           { mName = mMatch[4].toLowerCase(); day = Number(mMatch[5]); year = Number(mMatch[6]); }
        let mIdx = monthNames.indexOf(mName);
        if (mIdx === -1) mIdx = monthAbbr.indexOf(mName.slice(0, 3));
        if (mIdx !== -1) {
            const dt = new Date(year, mIdx, day);
            if (dt.getFullYear() === year && dt.getMonth() === mIdx && dt.getDate() === day) return dt;
        }
    }
    return null;
}

// ── Calendar popup ────────────────────────────────────────────────────────────
function CalendarPopup({ anchorRef, value, onChange, onClose }) {
    const today = new Date();
    const init  = value ?? today;
    const [viewY, setViewY] = useState(init.getFullYear());
    const [viewM, setViewM] = useState(init.getMonth());
    const [mode,  setMode ] = useState('day');
    const [pos,   setPos  ] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        if (!anchorRef.current) return;
        const rect  = anchorRef.current.getBoundingClientRect();
        const pW    = Math.max(rect.width, 280);
        const spill = rect.left + pW - window.innerWidth;
        const left  = spill > 0 ? Math.max(8, rect.right + window.scrollX - pW) : rect.left + window.scrollX;
        setPos({ top: rect.bottom + window.scrollY + 6, left, width: rect.width });
    }, [anchorRef]);

    useEffect(() => {
        function onDown(e) {
            if (ref.current && !ref.current.contains(e.target) && anchorRef.current && !anchorRef.current.contains(e.target)) onClose();
        }
        function onKey(e) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown',   onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [anchorRef, onClose]);

    function prevM() { viewM === 0  ? (setViewM(11), setViewY(y => y - 1)) : setViewM(m => m - 1); }
    function nextM() { viewM === 11 ? (setViewM(0),  setViewY(y => y + 1)) : setViewM(m => m + 1); }
    function pick(day) { onChange?.({ target: { value: toISO(new Date(viewY, viewM, day)) } }); onClose(); }

    const blanks = firstDow(viewY, viewM);
    const total  = daysInMonth(viewY, viewM);
    const cells  = [...Array(blanks).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
    while (cells.length % 7) cells.push(null);
    const years = Array.from({ length: 21 }, (_, i) => viewY - 10 + i);
    const popW  = pos ? Math.max(pos.width, 280) : 280;
    const o = {
        bg:'var(--color-card)', border:'var(--border-container)', radius:'var(--radius-md)',
        radiusLg:'var(--radius-lg)', primary:'var(--color-primary)', text:'var(--color-text)',
        muted:'var(--color-text-muted)', hover:'var(--color-hover)',
        fSmall:'var(--font-size-small)', fBody:'var(--font-body)',
    };

    return createPortal(
        <div ref={ref} style={{ position:'absolute', top:pos?.top??0, left:pos?.left??0, width:popW, visibility:pos?'visible':'hidden', zIndex:99999, background:o.bg, border:o.border, borderRadius:o.radiusLg, boxShadow:'0 16px 48px -12px rgba(15,23,42,0.22),0 4px 16px -4px rgba(15,23,42,0.10)', overflow:'hidden', fontFamily:o.fBody }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 12px 8px', borderBottom:o.border }}>
                <NavBtn o={o} onClick={prevM}><ChevronLeft size={15}/></NavBtn>
                <div style={{ display:'flex', gap:4 }}>
                    <PillBtn active={mode==='month'} o={o} onClick={() => setMode(m => m==='month'?'day':'month')}>{MONTHS[viewM]}</PillBtn>
                    <PillBtn active={mode==='year'}  o={o} onClick={() => setMode(m => m==='year' ?'day':'year' )}>{viewY}</PillBtn>
                </div>
                <NavBtn o={o} onClick={nextM}><ChevronRight size={15}/></NavBtn>
            </div>
            {mode === 'month' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4, padding:12 }}>
                    {MONTHS.map((name, idx) => (
                        <PickerCell key={name} active={idx===viewM} o={o} onClick={() => { setViewM(idx); setMode('day'); }}>{name.slice(0,3)}</PickerCell>
                    ))}
                </div>
            )}
            {mode === 'year' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4, padding:12, maxHeight:200, overflowY:'auto' }}>
                    {years.map(y => (
                        <PickerCell key={y} active={y===viewY} o={o} onClick={() => { setViewY(y); setMode('day'); }}>{y}</PickerCell>
                    ))}
                </div>
            )}
            {mode === 'day' && (
                <div style={{ padding:'8px 12px 12px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
                        {DAYS_SHORT.map(d => (
                            <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:o.muted, padding:'4px 0', fontFamily:o.fBody, textTransform:'uppercase', letterSpacing:'0.04em' }}>{d}</div>
                        ))}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
                        {cells.map((day, i) => {
                            if (!day) return <div key={`b-${i}`}/>;
                            const cd = new Date(viewY, viewM, day);
                            return <DayCell key={day} day={day} isSelected={isSameDay(cd,value)} isToday={isSameDay(cd,today)} o={o} onClick={() => pick(day)}/>;
                        })}
                    </div>
                </div>
            )}
            <div style={{ padding:'8px 12px', borderTop:o.border, display:'flex', justifyContent:'center' }}>
                <button onClick={() => { const t=new Date(); setViewY(t.getFullYear()); setViewM(t.getMonth()); onChange?.({ target:{ value:toISO(t) } }); onClose(); }}
                    style={{ fontSize:o.fSmall, fontFamily:o.fBody, fontWeight:500, color:o.primary, background:'none', border:'none', cursor:'pointer', padding:'4px 10px', borderRadius:o.radius }}
                    onMouseEnter={e => e.currentTarget.style.background=o.hover}
                    onMouseLeave={e => e.currentTarget.style.background='none'}
                >Today</button>
            </div>
        </div>,
        document.body
    );
}

function NavBtn({ o, onClick, children }) {
    return (
        <button onClick={onClick} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:o.radius, border:'none', background:'none', color:o.muted, cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background=o.hover}
            onMouseLeave={e => e.currentTarget.style.background='none'}
        >{children}</button>
    );
}
function PillBtn({ active, o, onClick, children }) {
    return (
        <button onClick={onClick} style={{ padding:'3px 8px', borderRadius:o.radius, border:'none', background:active?o.primary:'none', color:active?'#fff':o.text, fontSize:'var(--font-size-small)', fontFamily:o.fBody, fontWeight:600, cursor:'pointer' }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background=o.hover; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background='none'; }}
        >{children}</button>
    );
}
function PickerCell({ active, o, onClick, children }) {
    return (
        <button onClick={onClick} style={{ padding:'7px 4px', borderRadius:o.radius, border:'none', background:active?o.primary:'none', color:active?'#fff':o.text, fontSize:o.fSmall, fontFamily:o.fBody, fontWeight:active?600:400, cursor:'pointer', textAlign:'center' }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background=o.hover; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background='none'; }}
        >{children}</button>
    );
}
function DayCell({ day, isSelected, isToday, o, onClick }) {
    return (
        <button onClick={onClick} style={{ aspectRatio:'1', borderRadius:o.radius, border:isToday&&!isSelected?`1.5px solid ${o.primary}`:'none', background:isSelected?o.primary:'none', color:isSelected?'#fff':isToday?o.primary:o.text, fontSize:o.fSmall, fontFamily:o.fBody, fontWeight:isSelected||isToday?600:400, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', minWidth:0 }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background=o.hover; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background='none'; }}
        >{day}</button>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function DatePicker({
    label       = '',
    value       = '',
    onChange,
    error       = null,
    placeholder = 'MM/DD/YYYY',
    disabled    = false,
    required    = false,
    className   = '',
    id,
}) {
    const inputId  = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const selected = parseISO(value);

    const [text,    setText   ] = useState(() => fmtDisplay(selected));
    const [open,    setOpen   ] = useState(false);
    const [focused, setFocused] = useState(false);

    const anchorRef = useRef(null);
    const inputRef  = useRef(null);

    // Sync display text when value prop changes externally
    useEffect(() => {
        setText(fmtDisplay(parseISO(value)));
    }, [value]);

    const handleClose = useCallback(() => setOpen(false), []);

    function commitText(raw) {
        const trimmed = raw.trim();
        if (!trimmed) {
            onChange?.({ target: { value: '' } });
            setText('');
            return;
        }
        const parsed = parseTyped(trimmed);
        if (parsed) {
            onChange?.({ target: { value: toISO(parsed) } });
            setText(fmtDisplay(parsed));
        } else {
            // Revert to last valid
            setText(fmtDisplay(parseISO(value)));
        }
    }

    function handleTextKeyDown(e) {
        if (e.key === 'Enter')  { e.preventDefault(); commitText(text); inputRef.current?.blur(); }
        if (e.key === 'Escape') { setText(fmtDisplay(parseISO(value))); inputRef.current?.blur(); setOpen(false); }
        e.stopPropagation();
    }

    const isActive = open || focused;
    const borderStyle = error
        ? `${isActive ? '2px' : '1.5px'} solid var(--color-error)`
        : isActive
            ? '2px solid var(--color-primary)'
            : 'var(--border-container)';

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label htmlFor={inputId} style={{ fontSize:'var(--font-size-small)', fontFamily:'var(--font-body)', fontWeight:'var(--font-weight-semibold)', color:'var(--color-text)', lineHeight:1.25, cursor:'default' }}>
                    {label}{required && <span style={{ color:'var(--color-error)', marginLeft:2 }}>*</span>}
                </label>
            )}

            {/* Wrapper — anchor for popup positioning */}
            <div ref={anchorRef} style={{ position:'relative', display:'flex', alignItems:'center', height:'var(--height-input)', borderRadius:'var(--radius-md)', border:borderStyle, background:'var(--color-card)', opacity:disabled?0.5:1, boxSizing:'border-box', overflow:'hidden' }}>

                {/* ── Typeable text input (left) ── */}
                <input
                    ref={inputRef}
                    id={inputId}
                    type="text"
                    value={text}
                    placeholder={placeholder}
                    disabled={disabled}
                    onChange={e => setText(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => { setFocused(false); commitText(text); }}
                    onKeyDown={handleTextKeyDown}
                    autoComplete="off"
                    spellCheck={false}
                    style={{ flex:1, height:'100%', border:'none', outline:'none', background:'transparent', paddingLeft:'var(--space-2)', paddingRight:4, fontSize:'var(--font-size-body)', fontFamily:'var(--font-body)', fontWeight:500, color:'var(--color-text)', cursor:disabled?'not-allowed':'text', minWidth:0, boxShadow:'none' }}
                />

                {/* Divider */}
                <span style={{ width:1, alignSelf:'stretch', background:'var(--border-container,rgba(0,0,0,0.1))', flexShrink:0, margin:'6px 0' }}/>

                {/* ── Calendar icon button (right) ── */}
                <button
                    type="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-label="Open calendar"
                    aria-expanded={open}
                    disabled={disabled}
                    onClick={e => { e.preventDefault(); setOpen(o => !o); }}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'calc(var(--height-input,40px) - 2px)', height:'100%', flexShrink:0, border:'none', background:open?'var(--color-hover)':'transparent', color:open?'var(--color-primary)':'var(--color-text-muted)', cursor:disabled?'not-allowed':'pointer', outline:'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background='var(--color-hover)'; e.currentTarget.style.color='var(--color-primary)'; }}
                    onMouseLeave={e => { if (!open) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--color-text-muted)'; } }}
                >
                    <Calendar size={16}/>
                </button>
            </div>

            {open && (
                <CalendarPopup anchorRef={anchorRef} value={selected} onChange={e => { onChange?.(e); }} onClose={handleClose}/>
            )}

            {error && (
                <p style={{ fontSize:'var(--font-size-small)', fontFamily:'var(--font-body)', color:'var(--color-error)', marginTop:2 }}>{error}</p>
            )}
        </div>
    );
}
