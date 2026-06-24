import { isValidElement } from 'react';
import DatePicker from './DatePicker';
import MonthPicker from './MonthPicker';
import TimePicker from './TimePicker';
import { fieldConstraints } from './fieldConstraints';

/**
 * Input — 40px height, 8px radius, exact 13px label, exact 16px input text.
 *
 * icon      : left icon — Lucide component ref or pre-rendered JSX element
 * rightIcon : right icon — same format; used for password toggle etc.
 *             When rightIcon is a button/interactive element, pass it as JSX
 *             (pointer-events are enabled on the right slot).
 *
 * Special types intercepted (no native browser picker used anywhere):
 *   type="date"  → DatePicker  (custom calendar popup)
 *   type="month" → MonthPicker (custom month/year popup)
 *   type="time"  → TimePicker  (custom HH:MM scroll picker)
 *
 * Field limits (maxLength, inputMode) are applied automatically via
 * fieldConstraints(label, type) — no per-page changes needed.
 * Explicit maxLength/inputMode props always override the auto-derived values.
 */
export default function Input({
    label       = '',
    type        = 'text',
    value,
    onChange,
    error       = null,
    placeholder = undefined,
    disabled    = false,
    icon        = null,
    rightIcon   = null,
    id,
    required    = false,
    className   = '',
    onFocus,
    onBlur,
    ...rest
}) {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    // Delegate date inputs to the custom DatePicker — never use the native browser calendar
    if (type === 'date') {
        return (
            <DatePicker
                label={label}
                value={value}
                onChange={onChange}
                error={error}
                placeholder={placeholder || 'Select date'}
                disabled={disabled}
                required={required}
                className={className}
                id={inputId}
            />
        );
    }

    // Delegate month inputs to the custom MonthPicker
    if (type === 'month') {
        return (
            <MonthPicker
                label={label}
                value={value}
                onChange={onChange}
                error={error}
                placeholder={placeholder || 'Select month'}
                disabled={disabled}
                required={required}
                className={className}
                id={inputId}
            />
        );
    }

    // Delegate time inputs to the custom TimePicker
    if (type === 'time') {
        return (
            <TimePicker
                label={label}
                value={value}
                onChange={onChange}
                error={error}
                placeholder={placeholder || '--:-- --'}
                disabled={disabled}
                required={required}
                className={className}
                id={inputId}
            />
        );
    }

    // Derive field constraints from label + type; explicit props take priority
    const constraints      = fieldConstraints(label, type);
    const maxLength        = rest.maxLength  ?? constraints.maxLength;
    const inputMode        = rest.inputMode  ?? constraints.inputMode;
    const finalPlaceholder = placeholder ?? constraints.placeholder ?? '';
    // Remove from rest so they don't get double-applied
    const { maxLength: _ml, inputMode: _im, ...restClean } = rest;

    // Normalise left icon
    let iconNode = null;
    if (icon) {
        if (isValidElement(icon)) {
            iconNode = icon;
        } else {
            const Icon = icon;
            iconNode = <Icon size={16} />;
        }
    }

    // Normalise right icon
    let rightIconNode = null;
    if (rightIcon) {
        if (isValidElement(rightIcon)) {
            rightIconNode = rightIcon;
        } else {
            const RIcon = rightIcon;
            rightIconNode = <RIcon size={16} />;
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
                    placeholder={finalPlaceholder}
                    disabled={disabled}
                    required={required}
                    maxLength={maxLength}
                    inputMode={inputMode}
                    className="w-full outline-none transition-colors duration-150 focus:ring-0 focus:ring-offset-0"
                    style={{
                        height      : 'var(--height-input)',
                        borderRadius: 'var(--radius-md)',
                        border      : error
                            ? '1.5px solid var(--color-error)'
                            : 'var(--border-container)',
                        paddingLeft : iconNode ? 'calc(var(--space-2) + 18px + 8px)' : 'var(--space-2)',
                        paddingRight: rightIconNode ? 'calc(var(--space-2) + 18px + 8px)' : 'var(--space-2)',
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
                        e.currentTarget.style.border = error
                            ? '2px solid var(--color-error)'
                            : '2px solid var(--color-primary)';
                        e.currentTarget.style.boxShadow = 'none';
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.border = error
                            ? '1.5px solid var(--color-error)'
                            : 'var(--border-container)';
                        e.currentTarget.style.boxShadow = 'none';
                        onBlur?.(e);
                    }}
                    {...restClean}
                />
                {rightIconNode && (
                    <span
                        className="absolute inset-y-0 right-0 flex items-center"
                        style={{ paddingRight: 'var(--space-1)', color: 'var(--color-text-muted)' }}
                    >
                        {rightIconNode}
                    </span>
                )}
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
