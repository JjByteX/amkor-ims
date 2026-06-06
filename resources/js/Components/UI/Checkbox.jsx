/**
 * Checkbox — brand-green when checked.
 *
 * Corner radius on the checkbox itself is driven by the browser's native
 * accent-color rendering, but the 4px (h-4/w-4 native) matches our
 * --radius-md intent at small scale.  The label hover background uses
 * --radius-md explicitly.
 *
 * Props:
 *   label    : string
 *   checked  : bool
 *   onChange : fn(e)
 *   disabled : bool
 *   id       : string
 *   className: string
 */
export default function Checkbox({
    label    = '',
    checked  = false,
    onChange,
    disabled = false,
    id,
    className = '',
    ...rest
}) {
    const checkboxId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
        <label
            htmlFor={checkboxId}
            className={[
                'inline-flex items-center gap-2',
                'cursor-pointer select-none',
                'font-body text-sm text-[var(--color-text)]',
                disabled ? 'opacity-50 cursor-not-allowed' : '',
                className,
            ].join(' ')}
        >
            <input
                id={checkboxId}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className={[
                    'h-4 w-4',
                    'border border-gray-300 dark:border-gray-600',
                    'accent-[var(--color-primary)]',
                    'cursor-pointer',
                    'transition-colors duration-150',
                ].join(' ')}
                style={{ borderRadius: 'var(--radius-md)' }}
                {...rest}
            />
            {label && <span>{label}</span>}
        </label>
    );
}
