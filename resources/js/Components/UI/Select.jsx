import { ChevronDown } from 'lucide-react';

/**
 * Select — same dimensions as Input. 8px radius. Exact font sizes via CSS vars.
 */
export default function Select({
    label       = '',
    options     = [],
    value,
    onChange,
    error       = null,
    disabled    = false,
    placeholder = 'Select...',
    id,
    required    = false,
    className   = '',
    onFocus,
    onBlur,
    ...rest
}) {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const normalised = options.map((o) =>
        typeof o === 'string' ? { value: o, label: o } : o
    );

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label
                    htmlFor={selectId}
                    style={{
                        fontSize   : 'var(--font-size-small)',
                        fontFamily : 'var(--font-body)',
                        fontWeight : 'var(--font-weight-semibold)',
                        color      : 'var(--color-text)',
                        lineHeight  : 1.25,
                    }}
                >
                    {label}
                    {required && (
                        <span style={{ color: 'var(--color-error)', marginLeft: 2 }}>*</span>
                    )}
                </label>
            )}

            <div className="relative">
                <select
                    id={selectId}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    className="w-full appearance-none outline-none transition-colors duration-150 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    style={{
                        height       : 'var(--height-input)',
                        borderRadius : 'var(--radius-md)',
                        border       : error ? '1.5px solid var(--color-error)' : 'var(--border-container)',
                        paddingLeft  : 'var(--space-2)',
                        paddingRight : 'calc(var(--space-2) + 20px)',
                        fontSize     : 'var(--font-size-body)',
                        fontFamily   : 'var(--font-body)',
                        fontWeight   : 500,
                        background   : 'var(--color-card)',
                        color        : 'var(--color-text)',
                        opacity      : disabled ? 0.5 : 1,
                        cursor       : disabled ? 'not-allowed' : 'pointer',
                        boxShadow    : 'none',
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = error ? 'var(--color-error)' : 'var(--color-primary)';
                        e.currentTarget.style.boxShadow = 'var(--ring-focus)';
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.border = error
                            ? '1.5px solid var(--color-error)'
                            : 'var(--border-container)';
                        e.currentTarget.style.boxShadow = 'none';
                        onBlur?.(e);
                    }}
                    {...rest}
                >
                    {placeholder && !normalised.some(o => o.value === '') && (
                        <option value="" disabled>{placeholder}</option>
                    )}
                    {normalised.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center"
                    style={{ paddingRight: 'var(--space-1)', color: 'var(--color-text-muted)' }}>
                    <ChevronDown size={16} />
                </span>
            </div>

            {error && (
                <p style={{ fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)', color: 'var(--color-error)', marginTop: 2 }}>
                    {error}
                </p>
            )}
        </div>
    );
}
