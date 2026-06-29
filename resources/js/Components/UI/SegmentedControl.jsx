import { isValidElement, useId } from 'react';
import { motion, LayoutGroup } from 'framer-motion';

/**
 * SegmentedControl — pill-style tab switcher with Framer Motion sliding indicator.
 *
 * The active background is a shared `layoutId` motion element so it physically
 * slides from one segment to the next instead of fading in-place.
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
 *   --height-input        : total component height — matches Input/search field (40px)
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
 *     tabs={[\
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
    // Unique ID per instance so multiple SegmentedControls on the same page
    // each get their own isolated layout animation group.
    const uid = useId();
    const indicatorId = `seg-indicator-${uid}`;

    return (
        <LayoutGroup id={uid}>
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
                position     : 'relative',
                /* Lock the outer height to match Input / search fields exactly.
                   2 × border(1px) + 2 × padding(3px) = 8px overhead, so the
                   inner buttons get calc(--height-input - 8px) = 32px.        */
                height       : 'var(--height-input)',
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
                            'whitespace-nowrap select-none',
                            'cursor-pointer',
                            'focus-visible:outline-none',
                            // Only colour transitions — no background transition
                            // since Framer Motion owns the background element.
                            isActive
                                ? 'text-[var(--color-text)]'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                        ].join(' ')}
                        style={{
                            height      : 'calc(var(--height-input) - 8px)', /* 40px − 2×border(1px) − 2×padding(3px) = 32px */
                            paddingLeft : 'var(--space-2)',
                            paddingRight: 'var(--space-2)',
                            fontSize    : 'var(--font-size-small)',
                            fontFamily  : 'var(--font-body)',
                            fontWeight  : 'var(--font-weight-semibold)',
                            borderRadius: 'calc(var(--radius-md) - 2px)',
                            border      : '1px solid transparent',
                            lineHeight  : 1,
                            gap         : '6px',
                            // Sit above the sliding indicator so clicks register
                            position    : 'relative',
                            zIndex      : 1,
                            // Smooth label colour change
                            transition  : 'color 150ms ease',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.boxShadow = 'var(--ring-focus)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {/* Sliding background indicator — lives inside each button
                            so it naturally inherits the button's size, but only
                            renders on the active one. layoutId makes Framer Motion
                            animate it as a single element moving across buttons.  */}
                        {isActive && (
                            <motion.span
                                layoutId={indicatorId}
                                aria-hidden="true"
                                initial={false}
                                transition={{
                                    type     : 'spring',
                                    stiffness: 400,
                                    damping  : 35,
                                    mass     : 0.8,
                                }}
                                style={{
                                    position    : 'absolute',
                                    inset       : 0,
                                    borderRadius: 'calc(var(--radius-md) - 2px)',
                                    background  : 'var(--color-card)',
                                    border      : 'var(--border-container)',
                                    boxShadow   : '0 1px 3px rgba(0,0,0,0.08)',
                                    zIndex      : 0,
                                }}
                            />
                        )}

                        {/* Content wrapper — position:relative + zIndex:1 ensures
                            the icon, label, and count badge always sit above the
                            absolutely-positioned sliding indicator. Without this,
                            plain text nodes have no stacking context and disappear
                            behind the motion.span when it is active.              */}
                        <span
                            className="inline-flex items-center shrink-0"
                            style={{ position: 'relative', zIndex: 1, gap: '6px', lineHeight: 1 }}
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
                                        transition  : 'background-color 150ms ease, color 150ms ease',
                                    }}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </span>
                    </button>
                );
            })}
        </div>
        </LayoutGroup>
    );
}
