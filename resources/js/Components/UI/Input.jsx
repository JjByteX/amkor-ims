import { isValidElement } from 'react';

/**
 * Input — 40px height, 8px radius, exact 13px label, exact 16px input text.
 * icon prop: accepts either a Lucide component reference (icon={Mail})
 *            or a pre-rendered JSX element (icon={<Mail size={16} />}).
 *            Both patterns work identically.
 *
 * Border uses var(--color-border) so it automatically matches cards,
 * sidebar, and table containers in both light and dark mode.
 */
export default function Input({
    label       = '',
    type        = 'text',
    value,
    onChange,
    error       = null,
    placeholder = '',
    disabled    = false,
    icon        = null,
    id,
    required    = false,
    className   = '',
    onFocus,
    onBlur,
    ...rest
}) {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    // Normalise icon: accept both a component reference and a pre-rendered element
    let iconNode = null;
    if (icon) {
        if (isValidElement(icon)) {
            iconNode = icon;
        } else {
            const Icon = icon;
            iconNode = <Icon size={16} />;
        }
    }

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
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
                {iconNode && (
                    <span
                        className="absolute inset-y-0 left-0 flex items-center pointer-events-none"
                        style={{ paddingLeft: 'var(--space-1)', color: 'var(--color-text-muted)' }}
                    >
                        {iconNode}
                    </span>
                )}
                <input
                    id={inputId}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    className="w-full outline-none transition-colors duration-150 focus:ring-0 focus:ring-offset-0"
                    style={{
                        height      : 'var(--height-input)',
                        borderRadius: 'var(--radius-md)',
                        /* Use the same --border-container token as cards/sidebar/table */
                        border      : error
                            ? `1.5px solid var(--color-error)`
                            : 'var(--border-container)',
                        paddingLeft : iconNode ? 'calc(var(--space-2) + 18px + 8px)' : 'var(--space-2)',
                        paddingRight: 'var(--space-2)',
                        fontSize    : 'var(--font-size-body)',
                        fontFamily  : 'var(--font-body)',
                        fontWeight  : 500,
                        background  : 'var(--color-card)',
                        color       : 'var(--color-text)',
                        opacity     : disabled ? 0.5 : 1,
                        cursor      : disabled ? 'not-allowed' : 'text',
                        boxShadow   : 'none',
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
                />
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
