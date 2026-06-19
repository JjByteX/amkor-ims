/**
 * Textarea — shared multiline input.
 *
 * Styling is driven entirely by design tokens in app.css (--textarea-* and
 * shared tokens), matching the same pattern used by Input.jsx.  Change a
 * token in app.css and every Textarea across all pages updates automatically.
 *
 * Tokens consumed:
 *   --textarea-min-height   minimum height before the user resizes  (default 57px = 2 rows)
 *   --textarea-px           horizontal padding                       (= --space-2)
 *   --textarea-py           vertical padding                         (= --space-1)
 *   --textarea-font-size    (= --font-size-body)
 *   --textarea-line-height  (= --line-height-body)
 *   --textarea-radius       (= --radius-md)
 *   --textarea-border       idle border                              (= --border-container)
 *   --textarea-border-focus active border (2 px primary colour)
 *   --textarea-border-error error border
 *   --textarea-bg           (= --color-card)
 *   --textarea-color        (= --color-text)
 *   --textarea-resize       css resize value                         (default: vertical)
 *
 * Props:
 *   label       : string
 *   value       : string
 *   onChange    : fn(e)
 *   error       : string | null
 *   rows        : number       (default: 2)
 *   disabled    : bool
 *   placeholder : string
 *   id          : string
 *   required    : bool
 *   className   : string
 */
export default function Textarea({
    label       = '',
    value,
    onChange,
    error       = null,
    rows        = 2,
    disabled    = false,
    placeholder = '',
    id,
    required    = false,
    className   = '',
    onFocus,
    onBlur,
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
                        lineHeight : 1.25,
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
                className="w-full outline-none font-body transition-colors duration-150 focus:ring-0 focus:ring-offset-0 placeholder:text-[var(--color-text-muted)]"
                style={{
                    minHeight   : 'var(--textarea-min-height)',
                    paddingLeft : 'var(--textarea-px)',
                    paddingRight: 'var(--textarea-px)',
                    paddingTop  : 'var(--textarea-py)',
                    paddingBottom:'var(--textarea-py)',
                    fontSize    : 'var(--textarea-font-size)',
                    lineHeight  : 'var(--textarea-line-height)',
                    fontFamily  : 'var(--font-body)',
                    fontWeight  : 500,
                    borderRadius: 'var(--textarea-radius)',
                    border      : error
                        ? 'var(--textarea-border-error)'
                        : 'var(--textarea-border)',
                    background  : 'var(--textarea-bg)',
                    color       : 'var(--textarea-color)',
                    resize      : 'var(--textarea-resize)',
                    opacity     : disabled ? 0.5 : 1,
                    cursor      : disabled ? 'not-allowed' : 'text',
                    boxShadow   : 'none',
                }}
                onFocus={(e) => {
                    e.currentTarget.style.border = error
                        ? 'var(--textarea-border-error)'
                        : 'var(--textarea-border-focus)';
                    onFocus?.(e);
                }}
                onBlur={(e) => {
                    e.currentTarget.style.border = error
                        ? 'var(--textarea-border-error)'
                        : 'var(--textarea-border)';
                    onBlur?.(e);
                }}
                {...rest}
            />

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
