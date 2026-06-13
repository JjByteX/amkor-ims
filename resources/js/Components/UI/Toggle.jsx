/**
 * Toggle — iOS-style switch using CSS only, matches brand tokens.
 *
 * Props:
 *   label    : string   — shown to the right of the switch
 *   checked  : bool
 *   onChange : fn(e)    — same signature as a checkbox onChange
 *   disabled : bool
 *   id       : string
 *   size     : 'sm' | 'md' (default md)
 */
export default function Toggle({
    label    = '',
    checked  = false,
    onChange,
    disabled = false,
    id,
    size     = 'md',
    className = '',
    ...rest
}) {
    const toggleId = id ?? (label ? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    const track = {
        sm: { width: 32, height: 18, pad: 2, knob: 14 },
        md: { width: 42, height: 24, pad: 3, knob: 18 },
    }[size] ?? { width: 42, height: 24, pad: 3, knob: 18 };

    return (
        <label
            htmlFor={toggleId}
            style={{
                display   : 'inline-flex',
                alignItems: 'center',
                gap       : 10,
                cursor    : disabled ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                opacity   : disabled ? 0.5 : 1,
            }}
            className={`font-body text-sm text-[var(--color-text)] ${className}`}
        >
            {/* Hidden native checkbox — keeps it accessible */}
            <input
                id={toggleId}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                {...rest}
            />

            {/* Track */}
            <span
                aria-hidden="true"
                style={{
                    position    : 'relative',
                    display     : 'inline-block',
                    flexShrink  : 0,
                    width       : track.width,
                    height      : track.height,
                    borderRadius: track.height,
                    background  : checked
                        ? 'var(--color-primary)'
                        : 'color-mix(in srgb, var(--color-text-muted) 30%, var(--color-bg))',
                    transition  : 'background 0.2s ease',
                    boxShadow   : checked
                        ? '0 0 0 1px var(--color-primary)'
                        : '0 0 0 1px var(--color-border)',
                }}
            >
                {/* Knob */}
                <span style={{
                    position     : 'absolute',
                    top          : track.pad,
                    left         : checked ? track.width - track.knob - track.pad : track.pad,
                    width        : track.knob,
                    height       : track.knob,
                    borderRadius : '50%',
                    background   : '#fff',
                    boxShadow    : '0 1px 3px rgba(0,0,0,0.25)',
                    transition   : 'left 0.18s cubic-bezier(.4,0,.2,1)',
                }} />
            </span>

            {label && <span>{label}</span>}
        </label>
    );
}
