/**
 * FormStepper
 * ─────────────────────────────────────────────────────────────────────────────
 * Horizontal step indicator for multi-page forms.
 * Same visual language as ApprovalStepper — same dot anatomy, same colour
 * tokens, same connector line treatment — rotated 90° into a horizontal row.
 *
 * Usage:
 *   <FormStepper
 *     steps={['Booking Basics', 'Trip Details', 'Financials']}
 *     current={currentPage}
 *     onStep={setCurrentPage}
 *   />
 *
 * Props:
 *   steps   — string[]             — one label per page, in order
 *   current — number               — 1-indexed current step
 *   onStep  — (page: number) => void — called when any step is clicked
 */
export default function FormStepper({ steps = [], current, onStep }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
            {steps.map((label, i) => {
                const page      = i + 1;
                const isDone    = current > page;
                const isCurrent = current === page;
                const isLast    = i === steps.length - 1;

                /* ── Colour tokens — mirrors ApprovalStepper exactly ──── */
                const dotColor = isDone
                    ? 'var(--color-success)'
                    : isCurrent
                        ? 'var(--color-primary)'
                        : 'var(--color-border)';

                const dotBg = isDone
                    ? 'color-mix(in srgb, var(--color-success) 12%, var(--color-card))'
                    : isCurrent
                        ? 'color-mix(in srgb, var(--color-primary) 12%, var(--color-card))'
                        : 'var(--color-bg)';

                const lineColor = isDone
                    ? 'color-mix(in srgb, var(--color-success) 30%, var(--color-border))'
                    : 'var(--color-border)';

                const labelColor  = isCurrent ? 'var(--color-text)' : 'var(--color-text-muted)';
                const labelWeight = isCurrent ? 600 : isDone ? 500 : 400;

                return (
                    <div
                        key={page}
                        style={{
                            display    : 'flex',
                            alignItems : 'flex-start',
                            flex       : isLast ? 'none' : 1,
                            minWidth   : 0,
                        }}
                    >
                        {/* ── Step: circle + label ──────────────────────── */}
                        <button
                            type="button"
                            onClick={() => onStep(page)}
                            style={{
                                display       : 'flex',
                                flexDirection : 'column',
                                alignItems    : 'center',
                                gap           : 6,
                                background    : 'none',
                                border        : 'none',
                                padding       : 0,
                                cursor        : 'pointer',
                                flexShrink    : 0,
                            }}
                        >
                            {/* Dot — same 20px sizing as ApprovalStepper */}
                            <div style={{
                                width          : 20,
                                height         : 20,
                                borderRadius   : '50%',
                                background     : dotBg,
                                border         : `1.5px solid ${dotColor}`,
                                display        : 'flex',
                                alignItems     : 'center',
                                justifyContent : 'center',
                                flexShrink     : 0,
                            }}>
                                {isDone ? (
                                    /* Checkmark — identical SVG from ApprovalStepper */
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <path
                                            d="M2 5l2.5 2.5L8 3"
                                            stroke="var(--color-success)"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                ) : isCurrent ? (
                                    /* Active fill dot — mirrors the "isNext" treatment */
                                    <div style={{
                                        width        : 6,
                                        height       : 6,
                                        borderRadius : '50%',
                                        background   : 'var(--color-primary)',
                                    }} />
                                ) : null}
                            </div>

                            {/* Label */}
                            <span style={{
                                fontSize   : 'var(--font-size-small)',
                                fontFamily : 'var(--font-body)',
                                fontWeight : labelWeight,
                                color      : labelColor,
                                whiteSpace : 'nowrap',
                                lineHeight : 1.3,
                            }}>
                                {label}
                            </span>
                        </button>

                        {/* ── Horizontal connector to the next step ─────── */}
                        {!isLast && (
                            <div style={{
                                flex        : 1,
                                height      : 1.5,
                                background  : lineColor,
                                alignSelf   : 'flex-start',
                                marginTop   : 9,   /* vertically centres with 20px dot */
                                marginLeft  : 8,
                                marginRight : 8,
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
