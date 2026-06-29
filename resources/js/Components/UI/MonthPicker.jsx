import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

/**
 * MonthPicker — click-only field, icon on the right opens popup.
 * Popup: click the year to open a year grid (like DatePicker), then pick a month.
 *
 * onChange fires { target: { value: 'YYYY-MM' } }
 */

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

function parseYM(str) {
    if (!str || typeof str !== 'string') return null;
    const [y, m] = str.split('-').map(Number);
    if (!y || !m) return null;
    return { year: y, month: m - 1 };
}
function toYM(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}
function fmtDisplay(parsed) {
    if (!parsed) return '';
    return `${MONTHS[parsed.month]} ${parsed.year}`;
}

// ── Popup ─────────────────────────────────────────────────────────────────────
function MonthPopup({ anchorRef, value, onChange, onClose }) {
    const nowYear = new Date().getFullYear();
    const [viewY, setViewY] = useState(value?.year ?? nowYear);
    const [mode,  setMode ] = useState('month'); // 'month' | 'year'
    const [pos,   setPos  ] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        if (!anchorRef.current) return;
        const rect  = anchorRef.current.getBoundingClientRect();
        const pW    = Math.max(rect.width, 260);
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
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [anchorRef, onClose]);

    function pick(monthIdx) { onChange?.({ target: { value: toYM(viewY, monthIdx) } }); onClose(); }

    const years = Array.from({ length: 21 }, (_, i) => viewY - 10 + i);
    const popW  = Math.max(pos?.width ?? 0, 260);
    const o = {
        bg:'var(--color-card)', border:'var(--border-container)', radius:'var(--radius-md)',
        radiusLg:'var(--radius-lg)', primary:'var(--color-primary)', text:'var(--color-text)',
        muted:'var(--color-text-muted)', hover:'var(--color-hover)',
        fSmall:'var(--font-size-small)', fBody:'var(--font-body)',
    };

    return createPortal(
        <div ref={ref} style={{ position:'absolute', top:pos?.top??0, left:pos?.left??0, width:popW, visibility:pos?'visible':'hidden', zIndex:99999, background:o.bg, border:o.border, borderRadius:o.radiusLg, boxShadow:'0 16px 48px -12px rgba(15,23,42,0.22),0 4px 16px -4px rgba(15,23,42,0.10)', overflow:'hidden', fontFamily:o.fBody }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderBottom:o.border }}>
                <button onClick={() => setViewY(y => y - 1)} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:o.radius, border:'none', background:'none', color:o.muted, cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background=o.hover}
                    onMouseLeave={e => e.currentTarget.style.background='none'}
                ><ChevronLeft size={15}/></button>

                {/* Clickable year — toggles year grid */}
                <button
                    onClick={() => setMode(m => m === 'year' ? 'month' : 'year')}
                    style={{ padding:'3px 10px', borderRadius:o.radius, border:'none', background:mode==='year'?o.primary:'none', color:mode==='year'?'#fff':o.text, fontSize:'var(--font-size-body)', fontFamily:o.fBody, fontWeight:600, cursor:'pointer' }}
                    onMouseEnter={e => { if (mode !== 'year') e.currentTarget.style.background=o.hover; }}
                    onMouseLeave={e => { if (mode !== 'year') e.currentTarget.style.background='none'; }}
                >{viewY}</button>

                <button onClick={() => setViewY(y => y + 1)} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:o.radius, border:'none', background:'none', color:o.muted, cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background=o.hover}
                    onMouseLeave={e => e.currentTarget.style.background='none'}
                ><ChevronRight size={15}/></button>
            </div>

            {/* Year grid */}
            {mode === 'year' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4, padding:12, maxHeight:200, overflowY:'auto' }}>
                    {years.map(y => {
                        const active = y === viewY;
                        return (
                            <button key={y} onClick={() => { setViewY(y); setMode('month'); }}
                                style={{ padding:'7px 4px', borderRadius:o.radius, border:'none', background:active?o.primary:'none', color:active?'#fff':o.text, fontSize:o.fSmall, fontFamily:o.fBody, fontWeight:active?600:400, cursor:'pointer', textAlign:'center' }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background=o.hover; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background='none'; }}
                            >{y}</button>
                        );
                    })}
                </div>
            )}

            {/* Month grid */}
            {mode === 'month' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4, padding:12 }}>
                    {MONTHS.map((name, idx) => {
                        const active = value && value.year === viewY && value.month === idx;
                        return (
                            <button key={name} onClick={() => pick(idx)}
                                style={{ padding:'8px 4px', borderRadius:o.radius, border:'none', background:active?o.primary:'none', color:active?'#fff':o.text, fontSize:o.fSmall, fontFamily:o.fBody, fontWeight:active?600:400, cursor:'pointer', textAlign:'center' }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background=o.hover; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background='none'; }}
                            >{name.slice(0,3)}</button>
                        );
                    })}
                </div>
            )}

            {/* Footer */}
            <div style={{ padding:'6px 12px', borderTop:o.border, display:'flex', justifyContent:'center' }}>
                <button onClick={() => { const now=new Date(); setViewY(now.getFullYear()); onChange?.({ target:{ value:toYM(now.getFullYear(),now.getMonth()) } }); onClose(); }}
                    style={{ fontSize:o.fSmall, fontFamily:o.fBody, fontWeight:500, color:o.primary, background:'none', border:'none', cursor:'pointer', padding:'4px 10px', borderRadius:o.radius }}
                    onMouseEnter={e => e.currentTarget.style.background=o.hover}
                    onMouseLeave={e => e.currentTarget.style.background='none'}
                >This Month</button>
            </div>
        </div>,
        document.body
    );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function MonthPicker({
    label       = '',
    value       = '',
    onChange,
    error       = null,
    placeholder = 'Select month',
    disabled    = false,
    required    = false,
    clearable   = false,
    className   = '',
    id,
}) {
    const [open,    setOpen   ] = useState(false);
    const [focused, setFocused] = useState(false);
    const anchorRef = useRef(null);

    const inputId  = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const parsed   = parseYM(value);
    const display  = fmtDisplay(parsed);
    const isActive = open || focused;

    const handleClose = useCallback(() => setOpen(false), []);
    const handleClear = useCallback((e) => {
        e.stopPropagation();
        onChange?.({ target: { value: '' } });
    }, [onChange]);

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

            {/* Wrapper — icon right, display text left */}
            <div
                ref={anchorRef}
                id={inputId}
                style={{
                    position:'relative', display:'flex', alignItems:'center',
                    height:'var(--height-input)', borderRadius:'var(--radius-md)',
                    border: borderStyle,
                    background:'var(--color-card)',
                    opacity:disabled ? 0.5 : 1,
                    boxSizing:'border-box', overflow:'hidden',
                    cursor: disabled ? 'not-allowed' : 'default',
                }}
            >
                {/* Display text — clicking opens popup */}
                <span
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-haspopup="true"
                    aria-expanded={open}
                    onClick={() => { if (!disabled) setOpen(o => !o); }}
                    onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(o => !o); } }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{ flex:1, paddingLeft:'var(--space-2)', paddingRight:parsed ? 'calc(var(--space-1) + 22px)' : 4, fontSize:'var(--font-size-body)', fontFamily:'var(--font-body)', fontWeight:500, color:parsed?'var(--color-text)':'var(--color-text-muted)', userSelect:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:disabled?'not-allowed':'pointer', outline:'none' }}
                >
                    {display || placeholder}
                </span>

                {/* Clear button */}
                {clearable && parsed && !disabled && (
                    <button onClick={handleClear} tabIndex={-1} aria-label="Clear month"
                        style={{ position:'absolute', right:'calc(var(--height-input, 40px) + 2px)', top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center', justifyContent:'center', width:18, height:18, borderRadius:'50%', border:'none', background:'var(--color-text-muted)', color:'var(--color-card)', fontSize:11, lineHeight:1, cursor:'pointer', opacity:0.55 }}
                    >×</button>
                )}

                {/* Divider */}
                <span style={{ width:1, alignSelf:'stretch', background:'var(--border-container,rgba(0,0,0,0.1))', flexShrink:0, margin:'6px 0' }}/>

                {/* Calendar icon button — right */}
                <button
                    type="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-label="Open month picker"
                    disabled={disabled}
                    onClick={e => { e.preventDefault(); if (!disabled) setOpen(o => !o); }}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'calc(var(--height-input,40px) - 2px)', height:'100%', flexShrink:0, border:'none', background:open?'var(--color-hover)':'transparent', color:open?'var(--color-primary)':'var(--color-text-muted)', cursor:disabled?'not-allowed':'pointer', outline:'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background='var(--color-hover)'; e.currentTarget.style.color='var(--color-primary)'; }}
                    onMouseLeave={e => { if (!open) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--color-text-muted)'; } }}
                >
                    <CalendarDays size={16}/>
                </button>
            </div>

            {open && (
                <MonthPopup anchorRef={anchorRef} value={parsed} onChange={onChange} onClose={handleClose}/>
            )}

            {error && (
                <p style={{ fontSize:'var(--font-size-small)', fontFamily:'var(--font-body)', color:'var(--color-error)', marginTop:2 }}>{error}</p>
            )}
        </div>
    );
}
