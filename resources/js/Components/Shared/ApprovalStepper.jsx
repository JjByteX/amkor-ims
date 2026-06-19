/**
 * ApprovalStepper
 * ─────────────────────────────────────────────────────────────────────────────
 * Vertical stepper for approval chains inside detail panels.
 *
 * Usage:
 *   <ApprovalStepper steps={[
 *     { label: 'Prepared',  done: true,               person: 'Juan dela Cruz', at: record.created_at },
 *     { label: 'Checked',   done: !!record.checked_at, person: record.checker?.name, at: record.checked_at,
 *       action: canCheck && !record.checked_at
 *         ? <Button ...>Mark Checked</Button>
 *         : null },
 *     { label: 'Approved',  done: !!record.approved_at, person: record.approver?.name, at: record.approved_at },
 *     { label: 'Released',  done: !!record.released_at, person: record.releaser?.name, at: record.released_at },
 *   ]} fmtDt={fmtDt} />
 *
 * Props:
 *   steps   — array of step objects (see above)
 *   fmtDt   — datetime formatter fn: (isoString) => string
 */
export default function ApprovalStepper({ steps = [], fmtDt }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {steps.map((step, i) => {
                const isLast    = i === steps.length - 1;
                const isDone    = !!step.done;
                const isNext    = !isDone && steps.slice(0, i).every(s => s.done);
                const isPending = !isDone && !isNext;

                const dotColor = isDone
                    ? 'var(--color-success)'
                    : isNext
                        ? 'var(--color-warning)'
                        : 'var(--color-border)';

                const dotBg = isDone
                    ? 'color-mix(in srgb, var(--color-success) 12%, var(--color-card))'
                    : isNext
                        ? 'color-mix(in srgb, var(--color-warning) 12%, var(--color-card))'
                        : 'var(--color-bg)';

                const labelColor = isDone
                    ? 'var(--color-text)'
                    : isNext
                        ? 'var(--color-text)'
                        : 'var(--color-text-muted)';

                return (
                    <div key={i} style={{ display: 'flex', gap: 12 }}>
                        {/* Left — dot + connector line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 20 }}>
                            {/* Dot */}
                            <div style={{
                                width        : 20,
                                height       : 20,
                                borderRadius : '50%',
                                background   : dotBg,
                                border       : `1.5px solid ${dotColor}`,
                                flexShrink   : 0,
                                display      : 'flex',
                                alignItems   : 'center',
                                justifyContent: 'center',
                                marginTop    : 1,
                            }}>
                                {isDone && (
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <path d="M2 5l2.5 2.5L8 3" stroke="var(--color-success)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                                {isNext && (
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-warning)' }} />
                                )}
                            </div>

                            {/* Connector line — not shown after the last step */}
                            {!isLast && (
                                <div style={{
                                    width     : 1.5,
                                    flex      : 1,
                                    minHeight : 16,
                                    background: isDone
                                        ? 'color-mix(in srgb, var(--color-success) 30%, var(--color-border))'
                                        : 'var(--color-border)',
                                    margin    : '3px 0',
                                }} />
                            )}
                        </div>

                        {/* Right — label, person/date, optional action */}
                        <div style={{
                            paddingBottom: isLast ? 0 : 14,
                            flex         : 1,
                            minWidth     : 0,
                        }}>
                            <span className="font-body" style={{
                                fontSize  : 'var(--font-size-small)',
                                fontWeight: isDone || isNext ? 600 : 400,
                                color     : labelColor,
                                lineHeight: 1.4,
                            }}>
                                {isDone ? step.label : `Awaiting ${step.label}`}
                            </span>

                            {isDone && step.person && (
                                <p className="font-body" style={{
                                    fontSize   : 11,
                                    color      : 'var(--color-text-muted)',
                                    margin     : '2px 0 0',
                                    lineHeight : 1.3,
                                }}>
                                    {step.person}
                                    {step.at ? <> · {fmtDt(step.at)}</> : null}
                                </p>
                            )}

                            {step.action && (
                                <div style={{ marginTop: 6 }}>
                                    {step.action}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
