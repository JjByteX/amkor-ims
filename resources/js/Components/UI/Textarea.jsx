/**
 * Textarea — shared multiline input.
 *
 * Corner radius driven by --radius-md token (8px).
 *
 * Props:
 *   label    : string
 *   value    : string
 *   onChange : fn(e)
 *   error    : string | null
 *   rows     : number       (default: 4)
 *   disabled : bool
 *   placeholder : string
 *   id       : string
 *   required : bool
 *   className: string
 */
export default function Textarea({
    label       = '',
    value,
    onChange,
    error       = null,
    rows        = 4,
    disabled    = false,
    placeholder = '',
    id,
    required    = false,
    className   = '',
    ...rest
}) {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label
                    htmlFor={textareaId}
                    style={{
                        fontSize  : 'var(--font-size-small)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color     : 'var(--color-text)',
                    }}
                >
                    {label}
                    {required && <span style={{ color: 'var(--color-error)', marginLeft: 2 }}>*</span>}
                </label>
            )}

            <textarea
                id={textareaId}
                value={value}
                onChange={onChange}
                rows={rows}
                disabled={disabled}
                placeholder={placeholder}
                required={required}
                className={[
                    'w-full',
                    'border',
                    'px-3 py-2',
                    'font-body',
                    'bg-[var(--color-card)]',
                    'text-[var(--color-text)]',
                    'placeholder:text-gray-400',
                    'transition-colors duration-150',
                    'outline-none',
                    'resize-y',
                    'focus:ring-2 focus:ring-offset-0',
                    error
                        ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-[var(--color-primary)]',
                    disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : '',
                ].join(' ')}
                style={{
                    fontSize    : 'var(--font-size-body)',
                    borderRadius: 'var(--radius-md)',
                    opacity     : disabled ? 0.5 : 1,
                }}
                {...rest}
            />

            {error && (
                <p style={{ fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)', color: 'var(--color-error)', marginTop: 2 }}>
                    {error}
                </p>
            )}
        </div>
    );
}
