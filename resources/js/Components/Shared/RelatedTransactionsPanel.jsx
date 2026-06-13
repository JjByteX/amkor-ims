import { Link } from '@inertiajs/react';
import { PanelSection, PanelDivider } from './DetailPanel';
import Badge from '../UI/Badge';

/**
 * RelatedTransactionsPanel — "Other transactions for this client" panel section.
 *
 * Renders a compact list of other Reservation, Visa, and Ormoc records that
 * share the same contact_id as the current record. Each row is a single line:
 * module label, record identifier, status badge, selling price, and a link.
 *
 * Only rendered when there's at least one related record. When none exist
 * (or contact is not linked) the component returns null.
 *
 * Props:
 *   transactions : array of { id, type, label, status, status_label,
 *                              status_variant, selling_price, href }
 *                  passed from the controller via the 'relatedTransactions' prop
 */
export default function RelatedTransactionsPanel({ transactions }) {
    if (!transactions?.length) return null;

    return (
        <>
            <PanelDivider />
            <PanelSection title="Other transactions for this client">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    {transactions.map((tx) => (
                        <Link
                            key={`${tx.type}-${tx.id}`}
                            href={tx.href}
                            style={{
                                display        : 'flex',
                                alignItems     : 'center',
                                gap            : 'var(--space-1)',
                                padding        : '6px 8px',
                                borderRadius   : 'var(--radius-sm)',
                                background     : 'var(--color-surface-raised)',
                                textDecoration : 'none',
                                fontSize       : 'var(--font-size-small)',
                                color          : 'var(--color-text)',
                                transition     : 'background 0.12s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface-raised)'}
                        >
                            {/* Type pill */}
                            <span style={{
                                fontSize      : 10,
                                fontWeight    : 600,
                                textTransform : 'uppercase',
                                letterSpacing : '0.06em',
                                color         : 'var(--color-text-muted)',
                                flexShrink    : 0,
                                minWidth      : 52,
                            }}>
                                {tx.type_label}
                            </span>

                            {/* Record identifier */}
                            <span className="font-body" style={{
                                flex      : 1,
                                overflow  : 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: 500,
                            }}>
                                {tx.label}
                            </span>

                            {/* Status badge */}
                            <Badge variant={tx.status_variant} style={{ flexShrink: 0 }}>
                                {tx.status_label}
                            </Badge>

                            {/* Selling price */}
                            <span className="font-body" style={{
                                flexShrink  : 0,
                                color       : 'var(--color-text-muted)',
                                fontSize    : 'var(--font-size-small)',
                                fontVariantNumeric: 'tabular-nums',
                            }}>
                                {new Intl.NumberFormat('en-PH', {
                                    style   : 'currency',
                                    currency: 'PHP',
                                    maximumFractionDigits: 0,
                                }).format(Number(tx.selling_price ?? 0))}
                            </span>
                        </Link>
                    ))}
                </div>
            </PanelSection>
        </>
    );
}
