import { isValidElement } from 'react';

/**
 * SegmentedControl — pill-style tab switcher.
 *
 * Design tokens used (all sourced from app.css — never hard-coded):
 *   --color-card          : track background
 *   --color-primary       : active indicator background
 *   --color-text          : active label colour
 *   --color-text-muted    : inactive label colour
 *   --color-border        : track border
 *   --font-body           : label typeface
 *   --font-size-small     : label size (13px)
 *   --font-weight-semibold: label weight
 *   --radius-md           : pill corner radius (8px)
 *   --space-1             : internal padding unit (8px)
 *   --height-btn-sm       : segment height (34px)
 *
 * Props:
 *   tabs      : { key, label, icon?, count? }[]   — tab definitions
 *   activeKey : string                             — currently active tab key
 *   onChange  : (key: string) => void             — callback on tab change
 *   className : string                             — extra classes on wrapper
 *   style     : object                             — extra inline styles on wrapper
 *
 * Usage:
 *   <SegmentedControl
 *     tabs={[
 *       { key: 'corporate', label: 'Corporate Accounts', icon: Building2, count: 5 },
 *       { key: 'sub_agent', label: 'Sub-Agents',         icon: Users              },
 *     ]}
 *     activeKey={activeTab}
 *     onChange={(key) => switchTab(key)}
 *   />
 *
 * icon prop on each tab: accepts either a Lucide component reference (icon: Building2)
 *                        or a pre-rendered JSX element (icon: <Building2 size={14} />).
 */
export default function SegmentedControl({
    tabs      = [],
    activeKey = '',
    onChange,
    className = '',
    style     = {},
}) {
    return (
        <div
            role="tablist"
            aria-label="Segmented control"
            className={['inline-flex items-center shrink-0', className].join(' ')}
            style={{
                background   : 'var(--color-bg)',
                border       : 'var(--border-container)',
                borderRadius : 'var(--radius-md)',
                padding      : '3px',
                gap          : '2px',
                ...style,
            }}
        >
            {tabs.map((tab) => {
                const isActive = tab.key === activeKey;

                // Normalise icon: accept component ref or pre-rendered element
                let iconNode = null;
                if (tab.icon) {
                    if (isValidElement(tab.icon)) {
                        iconNode = tab.icon;
                    } else {
                        const Icon = tab.icon;
                        iconNode = <Icon size={14} className="shrink-0" />;
                    }
                }

                return (
                    <button
                        key={tab.key}
                        role="tab"
                        aria-selected={isActive}
                        type="button"
                        onClick={() => onChange?.(tab.key)}
                        className={[
                            'inline-flex items-center justify-center',
                            'transition-colors duration-150',
                            'whitespace-nowrap select-none',
                            'cursor-pointer',
                            'focus-visible:outline-none',
                            isActive
                                ? 'bg-[var(--color-card)] text-[var(--color-text)] shadow-sm'
                                : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                        ].join(' ')}
                        style={{
                            height      : 'var(--height-btn-sm)',
                            paddingLeft : 'var(--space-2)',
                            paddingRight: 'var(--space-2)',
                            fontSize    : 'var(--font-size-small)',
                            fontFamily  : 'var(--font-body)',
                            fontWeight  : 'var(--font-weight-semibold)',
                            borderRadius: 'calc(var(--radius-md) - 2px)',
                            border      : isActive ? 'var(--border-container)' : '1px solid transparent',
                            lineHeight  : 1,
                            gap         : '6px',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.boxShadow = 'var(--ring-focus)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {iconNode}
                        {tab.label}
                        {tab.count != null && (
                            <span
                                className={[
                                    'inline-flex items-center justify-center',
                                    'min-w-[18px] px-1',
                                    isActive
                                        ? 'bg-[var(--color-primary)] text-white'
                                        : 'bg-[var(--color-border-soft)] dark:bg-[var(--color-border)] text-[var(--color-text-muted)]',
                                ].join(' ')}
                                style={{
                                    height      : 18,
                                    fontSize    : 11,
                                    fontWeight  : 'var(--font-weight-bold)',
                                    fontFamily  : 'var(--font-body)',
                                    borderRadius: 'var(--radius-md)',
                                    lineHeight  : 1,
                                }}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
