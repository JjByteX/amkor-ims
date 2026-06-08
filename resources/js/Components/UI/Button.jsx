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
    onFocus,
    onBlur,
    children,
    className = '',
    style     = {},
    ...rest
}) {
    const isDisabled = disabled || loading;
    const hasContent = children !== undefined && children !== null && children !== false && children !== '';

    const base = [
        'inline-flex items-center justify-center',
        'box-border',
        'font-bold',
        'border',
        'cursor-pointer',
        'transition-colors duration-150',
        'select-none whitespace-nowrap',
        'shrink-0',
        'focus-visible:outline-none',
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
    ].join(' ');

    const hasIcon = loading || !!icon;

    const sizes = {
        default : hasContent ? 'px-4' : 'px-0',
        sm      : hasContent ? 'px-3.5' : 'px-0',
    };

    const variants = {
        primary   : 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] hover:border-[var(--color-primary-dark)]',
        secondary : 'bg-white dark:bg-transparent border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white',
        ghost     : 'bg-transparent border-transparent text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/10',
        danger    : 'bg-[var(--color-error)] border-[var(--color-error)] text-white hover:opacity-90',
    };

    const height   = size === 'sm' ? 'var(--height-btn-sm)' : 'var(--height-btn)';
    const fontSize = size === 'sm' ? 'var(--font-size-small)' : 'var(--font-size-small)';
    const minWidth = hasContent ? (size === 'sm' ? 72 : 88) : height;

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
                minWidth,
                fontSize,
                fontFamily   : 'var(--font-body)',
                borderRadius : 'var(--radius-md)',
                lineHeight   : 1,
                boxShadow    : 'none',
                gap          : '8px',
                maxWidth     : '100%',
                // Extra horizontal breathing room when an icon is present so the
                // icon doesn't sit flush against the button edge (Tailwind classes
                // may not be compiled for dynamically-added values).
                ...(hasContent && hasIcon ? { paddingLeft: '20px', paddingRight: '20px' } : {}),
                '--tw-ring-color': 'var(--color-primary)',
                ...style,
            }}
            onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid var(--color-primary)';
                e.currentTarget.style.outlineOffset = '2px';
                e.currentTarget.style.boxShadow = 'none';
                onFocus?.(e);
            }}
            onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.boxShadow = style.boxShadow ?? 'none';
                onBlur?.(e);
            }}
            {...rest}
        >
            {iconNode}
            {children}
        </button>
    );
}