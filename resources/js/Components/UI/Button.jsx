import { isValidElement } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button — shared base component.
 * Radius: 8px (--radius-md) on everything per Mandatory UI/UX.
 * icon prop: accepts either a Lucide component reference (icon={Mail})
 *            or a pre-rendered JSX element (icon={<Mail size={16} />}).
 *            Both patterns work identically.
 */
export default function Button({
    variant   = 'primary',
    size      = 'default',
    disabled  = false,
    loading   = false,
    icon      = null,
    type      = 'button',
    onClick,
    children,
    className = '',
    ...rest
}) {
    const isDisabled = disabled || loading;

    const base = [
        'inline-flex items-center justify-center gap-2',
        'font-semibold',
        'border',
        'cursor-pointer',
        'transition-colors duration-150',
        'select-none whitespace-nowrap',
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
    ].join(' ');

    const sizes = {
        default : 'px-4',
        sm      : 'px-3',
    };

    const variants = {
        primary   : 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] hover:border-[var(--color-primary-dark)]',
        secondary : 'bg-transparent border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white',
        ghost     : 'bg-transparent border-transparent text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/10',
        danger    : 'bg-[var(--color-error)] border-[var(--color-error)] text-white hover:opacity-90',
    };

    const height   = size === 'sm' ? 'var(--height-btn-sm)' : 'var(--height-btn)';
    const fontSize = size === 'sm' ? 'var(--font-size-small)' : 'var(--font-size-small)';

    // Normalise icon: accept both a component reference and a pre-rendered element
    let iconNode = null;
    if (loading) {
        iconNode = <Loader2 size={16} className="animate-spin shrink-0" />;
    } else if (icon) {
        if (isValidElement(icon)) {
            // Already a JSX element — use as-is
            iconNode = icon;
        } else {
            // Component reference — instantiate it
            const Icon = icon;
            iconNode = <Icon size={16} className="shrink-0" />;
        }
    }

    return (
        <button
            type={type}
            disabled={isDisabled}
            onClick={onClick}
            className={[base, sizes[size] ?? sizes.default, variants[variant] ?? variants.primary, className].join(' ')}
            style={{
                height,
                fontSize,
                fontFamily   : 'var(--font-body)',
                borderRadius : 'var(--radius-md)',
            }}
            {...rest}
        >
            {iconNode}
            {children}
        </button>
    );
}
