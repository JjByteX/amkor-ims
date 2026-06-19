import { useRef } from 'react';
import { Calendar } from 'lucide-react';

/**
 * DatePicker — native <input type="date"> on the left + calendar icon on the right.
 *
 * Replaces the previous custom text-entry picker with the browser's built-in
 * date widget (mm/dd/yyyy spinners, arrow-key navigation, native validation).
 *
 * API is identical to the old component:
 *   onChange fires { target: { value: 'YYYY-MM-DD' } } — all Inertia useForm
 *   handlers continue to work unchanged.
 *
 * Width: auto-fit to content (no more full-width stretching inside cards).
 * The calendar icon button opens the native picker programmatically.
 * Dark-mode colours are handled in app.css via the `.date-input-native` class.
 */
export default function DatePicker({
    label       = '',
    value       = '',
    onChange,
    error       = null,
    placeholder = '',   // native date inputs ignore placeholder — kept for API compat
    disabled    = false,
    required    = false,
    className   = '',
    id,
}) {
    const inputId  = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const inputRef = useRef(null);

    /* Clicking the calendar icon opens the native picker */
    function openPicker(e) {
        e.preventDefault();
        if (!disabled && inputRef.current) {
            inputRef.current.showPicker?.();
            inputRef.current.focus();
        }
    }

    const borderColor = error ? 'var(--color-error)' : 'var(--color-border)';

    return (
        <div className={`flex flex-col gap-1 ${className}`} style={{ width: 'fit-content' }}>
            {label && (
                <label
                    htmlFor={inputId}
                    style={{
                        fontSize  : 'var(--font-size-small)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color     : 'var(--color-text)',
                        lineHeight : 1.25,
                        cursor    : 'default',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                    {required && <span style={{ color: 'var(--color-error)', marginLeft: 2 }}>*</span>}
                </label>
            )}

            {/* Wrapper */}
            <div
                style={{
                    position    : 'relative',
                    display     : 'inline-flex',
                    alignItems  : 'center',
                    height      : 'var(--height-input)',
                    borderRadius: 'var(--radius-md)',
                    border      : error ? `1.5px solid var(--color-error)` : 'var(--border-container)',
                    background  : 'var(--color-card)',
                    opacity     : disabled ? 0.5 : 1,
                    boxSizing   : 'border-box',
                    overflow    : 'hidden',
                    /* width is driven by the input inside — stays compact */
                }}
                /* Highlight border on focus-within */
                onFocusCapture={e => {
                    e.currentTarget.style.border = error
                        ? '2px solid var(--color-error)'
                        : '2px solid var(--color-primary)';
                }}
                onBlurCapture={e => {
                    e.currentTarget.style.border = error
                        ? '1.5px solid var(--color-error)'
                        : 'var(--border-container)';
                }}
            >
                {/* ── Native date input ── */}
                <input
                    ref={inputRef}
                    id={inputId}
                    type="date"
                    className="date-input-native"
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    style={{
                        height      : '100%',
                        border      : 'none',
                        outline     : 'none',
                        background  : 'transparent',
                        paddingLeft : 'var(--space-2)',
                        paddingRight: 4,
                        fontSize    : 'var(--font-size-body)',
                        fontFamily  : 'var(--font-body)',
                        fontWeight  : 500,
                        color       : 'var(--color-text)',
                        cursor      : disabled ? 'not-allowed' : 'text',
                        boxShadow   : 'none',
                        /* let the browser size it to the mm/dd/yyyy spinners */
                        width       : 'auto',
                        minWidth    : 0,
                        /* hide the browser's own calendar icon — we supply ours */
                        WebkitAppearance: 'none',
                    }}
                />

                {/* Divider */}
                <span style={{
                    width      : 1,
                    alignSelf  : 'stretch',
                    background : 'var(--border-container,rgba(0,0,0,0.1))',
                    flexShrink : 0,
                    margin     : '6px 0',
                }}/>

                {/* ── Calendar icon button ── */}
                <button
                    type="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-label="Open date picker"
                    disabled={disabled}
                    onClick={openPicker}
                    style={{
                        display        : 'flex',
                        alignItems     : 'center',
                        justifyContent : 'center',
                        width          : 'calc(var(--height-input, 40px) - 2px)',
                        height         : '100%',
                        flexShrink     : 0,
                        border         : 'none',
                        background     : 'transparent',
                        color          : 'var(--color-text-muted)',
                        cursor         : disabled ? 'not-allowed' : 'pointer',
                        outline        : 'none',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--color-hover)';
                        e.currentTarget.style.color      = 'var(--color-primary)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color      = 'var(--color-text-muted)';
                    }}
                >
                    <Calendar size={16}/>
                </button>
            </div>

            {error && (
                <p style={{
                    fontSize  : 'var(--font-size-small)',
                    fontFamily: 'var(--font-body)',
                    color     : 'var(--color-error)',
                    marginTop : 2,
                }}>
                    {error}
                </p>
            )}
        </div>
    );
}
