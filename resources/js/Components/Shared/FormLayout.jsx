import { cloneElement, isValidElement } from 'react';
import Button from '../UI/Button';

/**
 * FormLayout — universal wrapper for all create/edit form pages.
 *
 * Props:
 *   columns  : 1 | 2 | 3   (default 1)
 *   split    : string       CSS gridTemplateColumns, e.g. '2fr 3fr' or '5fr 7fr 5fr'
 *   maxWidth : string       card-grid max-width (default auto by col count)
 *   className: string
 *
 * Layout model:
 *   ┌──────────────────────── full width ─────────────────────────────┐
 *   │  Ormoc Branch  ›  New Booking                                    │  ← inline breadcrumb row
 *   └─────────────────────────────────────────────────────────────────┘
 *   ┌──────────── centered container (maxWidth, margin auto) ─────────┐
 *   │  [ Card A ]   [ Card B ]   [ Card C? ]                          │
 *   │                                  [ Cancel ]  [ Done ]           │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Single-card rule: even when columns={2} or columns={3} is declared,
 * if only one FormCard child is present the grid is skipped and the card
 * renders full-width inside the centered container (no left-drift).
 *
 * PageHeader behaviour:
 *   • actions  → stripped automatically (buttons live in FormActions only)
 *   • inlineTitle={true} injected so title renders inline with breadcrumb
 */

// One consistent card width regardless of column count.
// 1 card → compact; 2 cards → comfortable; 3 cards → fits without squeezing.
const CARD_WIDTH   = 420;   // px — width of each individual card
const CARD_GAP     = 16;    // px — gap between cards (--space-2 = 16px)
const CARD_PADDING = 0;     // no outer horizontal padding needed

function defaultMaxWidth(cardCount) {
    return `${cardCount * CARD_WIDTH + (cardCount - 1) * CARD_GAP + CARD_PADDING * 2}px`;
}

export function FormLayout({ children, columns, split, maxWidth, className = '' }) {
    const childArray = Array.isArray(children) ? children.flat() : [children];

    const cols = split
        ? split.trim().split(/\s+/).length
        : columns === 3 ? 3
        : columns === 2 ? 2
        : 1;

    // Always equal columns — every card gets the same CARD_WIDTH regardless of split
    const gridCols = `repeat(${cols}, minmax(0, 1fr))`;

    // Clone PageHeader: strip actions, inject inlineTitle
    const rawHeader = childArray[0];
    const header = isValidElement(rawHeader)
        ? cloneElement(rawHeader, { actions: null, inlineTitle: true })
        : rawHeader;

    // Everything after the header
    const rest = childArray.slice(1);

    // Separate last child (FormActions) from cards
    const cards   = rest.slice(0, rest.length - 1);
    const actions = rest[rest.length - 1];

    // Max-width derived from actual card count — each card stays CARD_WIDTH px wide
    const centerMaxW = maxWidth ?? defaultMaxWidth(cards.length > 0 ? cards.length : 1);

    // Centered inner container — shared by single-col, multi-col, and single-card cases
    const centeredContent = (
        <div style={{
            maxWidth: centerMaxW,
            width: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
        }}>
            {/* Grid only when multiple cards — single card skips grid to stay centered */}
            {cards.length > 1 ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: gridCols,
                    gap: 'var(--space-2)',
                    alignItems: 'stretch',
                }}>
                    {cards}
                </div>
            ) : (
                cards
            )}
            {actions}
        </div>
    );

    return (
        <div className={`flex flex-col ${className}`} style={{ width: '100%', gap: 'var(--space-2)' }}>
            {header}
            {centeredContent}
        </div>
    );
}

/**
 * FormCard — titled card section inside a form.
 */
export function FormCard({ title, children, className = '', style = {}, fullWidth = false, colSpan }) {
    const spanStyle = fullWidth
        ? { gridColumn: '1 / -1' }
        : colSpan
            ? { gridColumn: `span ${colSpan}` }
            : {};

    return (
        <div
            className={`bg-[var(--color-card)] ${className}`}
            style={{ border: 'var(--border-container)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 'var(--space-card)', ...spanStyle, ...style }}
        >
            {title && (
                <div
                    className="font-heading font-semibold"
                    style={{ fontSize: 'var(--font-size-small)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '14px' }}
                >
                    {title}
                </div>
            )}
            <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                {children}
            </div>
        </div>
    );
}

/**
 * FormRow — 2 fields side-by-side within a card.
 */
export function FormRow({ children }) {
    return (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
            {children}
        </div>
    );
}

/**
 * FormActions — Cancel / Done button row, lives inside the centered container.
 */
export function FormActions({ children }) {
    return (
        <div className="flex justify-end" style={{ gap: 'var(--space-1)', paddingBottom: 'var(--space-3)' }}>
            {children}
        </div>
    );
}

/**
 * FormCancelButton — universal Cancel button.
 * Uses the shared 'cancel' Button variant (solid card fill, outlined border).
 */
export function FormCancelButton({ onClick, ...rest }) {
    return (
        <Button
            type="button"
            variant="cancel"
            onClick={onClick}
            {...rest}
        >
            Cancel
        </Button>
    );
}

/**
 * FormSubmitButton — universal create/save submit button. Label is always "Done".
 * No icon. Pass loading={processing} from the form.
 */
export function FormSubmitButton({ loading, ...rest }) {
    return (
        <Button type="submit" variant="primary" loading={loading} {...rest}>
            Done
        </Button>
    );
}

/**
 * FormEditButton — universal edit submit button. Label is always "Edit".
 * No icon. Pass loading={processing} from the form.
 */
export function FormEditButton({ loading, ...rest }) {
    return (
        <Button type="submit" variant="primary" loading={loading} {...rest}>
            Edit
        </Button>
    );
}
