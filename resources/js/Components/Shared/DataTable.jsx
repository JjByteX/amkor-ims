import { useReducer, useMemo, useState, useLayoutEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { PANEL_CLOSE_MS } from './DetailPanel';

/**
 * DataTable — generic data grid.
 *
 * HEIGHT MODEL
 * ────────────
 * When used as the last (or only) major element on a page the table should
 * fill all remaining vertical space without causing the page itself to
 * scroll.  This works through a flex chain:
 *
 *   AppShell <main>          flex flex-col  (overflow-hidden)
 *     └─ Page content div    flex flex-col  flex-1
 *          └─ DataTable      flex flex-col  flex-1  ← this component
 *               └─ table wrapper   flex-1   overflow-y-auto
 *
 * TABLE FREEZE ON PANEL OPEN
 * ──────────────────────────
 * When panelOpen flips to true, the table's current pixel width is measured
 * and locked as minWidth on the scroll wrapper. This freezes the columns
 * exactly where they are — the panel slides in and the card's overflow:hidden
 * clips the right side naturally. No columns move. No reflow.
 * When panelOpen flips back to false, minWidth is released so the table
 * returns to filling its container normally.
 *
 * The toolbar/search row is NOT frozen — it compresses with the card.
 *
 * SORTING
 * ───────
 * All columns are sortable by default (client-side).
 * Opt a column out with { sortable: false }.
 * Columns with key === 'actions' or label === '' are automatically
 * unsortable and display "Actions" as their header label.
 * Clicking a header cycles: none → asc → desc → none.
 * Use sortKey: 'raw_field' on render-only columns to sort by raw value.
 *
 * PAGINATION
 * ──────────
 * Left  : "Showing N of N records"
 * Right : ‹ Page N of N ›
 *
 * Props:
 *   columns         : Array<{ key, label, render?, width?, sortable?, sortKey? }>
 *   rows            : Array<object>
 *   loading         : bool
 *   empty           : ReactNode | string
 *   pageSize        : number               (default: 20; 0 = disable pagination)
 *   keyField        : string               (default: 'id')
 *   onRowClick      : fn(row)
 *   pagination      : object               (Laravel paginator meta)
 *   onPageChange    : fn(page)
 *   toolbar         : ReactNode
 *   className       : string
 *   panelOpen       : bool                 (freezes table width when true)
 *   panelColsToHide : number               (accepted but unused)
 */

// ── Sort state machine ────────────────────────────────────────────────────────
const sortInitial = { key: null, dir: 'asc' };

function sortReducer(state, clickedKey) {
    if (state.key !== clickedKey) return { key: clickedKey, dir: 'asc' };
    if (state.dir === 'asc')     return { key: clickedKey, dir: 'desc' };
    return sortInitial;
}

// ── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ active, dir }) {
    if (active) {
        return dir === 'asc'
            ? <ChevronUp   size={12} style={{ flexShrink: 0, color: 'var(--color-primary)' }} />
            : <ChevronDown size={12} style={{ flexShrink: 0, color: 'var(--color-primary)' }} />;
    }
    return (
        <ChevronsUpDown
            size={12}
            style={{ flexShrink: 0, color: 'var(--color-text-muted)', opacity: 0.45 }}
        />
    );
}

// ── Exported table style primitives ───────────────────────────────────────────
// Use these in any page that renders a custom table so styles stay in sync
// with DataTable automatically. Import: { tableThStyle, tableTdStyle }
//
// For alignment variants compose inline:
//   <th style={{ ...tableThStyle, textAlign: 'center' }}>
//   <td style={{ ...tableTdStyle, textAlign: 'right' }}>

export const tableThStyle = {
    paddingLeft  : 16,
    paddingRight : 16,
    paddingTop   : 0,
    paddingBottom: 0,
    height       : 'var(--height-table-header)',
    fontSize     : '12px',
    fontWeight   : 600,
    fontFamily   : 'var(--font-body)',
    color        : 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0,
    whiteSpace   : 'nowrap',
    textAlign    : 'left',
    // background is set on <thead> via className, not per-th
};

export const tableTdStyle = {
    paddingLeft  : 16,
    paddingRight : 16,
    fontSize     : 'var(--font-size-small)',
    color        : 'var(--color-text)',
    verticalAlign: 'middle',
    textAlign    : 'left',
    overflow     : 'hidden',
    // row height comes from <tr style={{ height: 'var(--height-table-row)' }}>
};

export default function DataTable({
    columns      = [],
    rows         = [],
    loading      = false,
    empty        = 'No records found.',
    pageSize     = 20,
    keyField     = 'id',
    onRowClick,
    pagination,
    onPageChange,
    toolbar,
    className    = '',
    emptyMessage,
    emptyTitle,
    emptyDescription,
    emptyIcon,
    panelOpen       = false,
    panelColsToHide = 2, // accepted but unused
    selectedKey,
}) {
    const [sortState, dispatchSort] = useReducer(sortReducer, sortInitial);
    const [page,      setPage     ] = useReducer((_, p) => p, 1);

    const isServerPaginated = !!pagination && !!onPageChange;

    // ── Table freeze ──────────────────────────────────────────────────────────
    // On panel open: measure the scroll wrapper's current width and lock it as
    // minWidth so the table columns don't move as the panel slides in. The card's
    // overflow:hidden clips whatever the panel covers — clean, no reflow.
    //
    // On panel close: hold the freeze for PANEL_CLOSE_MS (the panel exit duration)
    // so the table doesn't start expanding while the card is still animating.
    // Release only after the exit animation is done — the table then snaps to
    // full width instantly with nothing left to drag or animate against.
    const tableScrollRef = useRef(null);
    const [frozenWidth,  setFrozenWidth ] = useState(null);
    const releaseTimer = useRef(null);

    useLayoutEffect(() => {
        if (panelOpen) {
            if (releaseTimer.current) {
                clearTimeout(releaseTimer.current);
                releaseTimer.current = null;
            }
            if (tableScrollRef.current) {
                setFrozenWidth(tableScrollRef.current.getBoundingClientRect().width);
            }
        } else {
            // Wait for the panel slide-out to finish before releasing the freeze.
            releaseTimer.current = setTimeout(() => {
                setFrozenWidth(null);
                releaseTimer.current = null;
            }, PANEL_CLOSE_MS);
        }
        return () => {
            if (releaseTimer.current) clearTimeout(releaseTimer.current);
        };
    }, [panelOpen]);

    // ── Client-side sort ──────────────────────────────────────────────────────
    const sortedRows = useMemo(() => {
        if (!sortState.key) return rows;
        return [...rows].sort((a, b) => {
            const av = a[sortState.key] ?? '';
            const bv = b[sortState.key] ?? '';
            if (typeof av === 'number' && typeof bv === 'number') {
                return sortState.dir === 'asc' ? av - bv : bv - av;
            }
            const da = Date.parse(av), db = Date.parse(bv);
            if (!isNaN(da) && !isNaN(db)) {
                return sortState.dir === 'asc' ? da - db : db - da;
            }
            const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
            return sortState.dir === 'asc' ? cmp : -cmp;
        });
    }, [rows, sortState.key, sortState.dir]);

    // ── Pagination ────────────────────────────────────────────────────────────
    const sourceRows  = sortedRows;
    const paginated   = isServerPaginated
        ? sourceRows
        : (pageSize > 0 ? sourceRows.slice((page - 1) * pageSize, page * pageSize) : sourceRows);
    const totalPages  = isServerPaginated
        ? (pagination.last_page ?? 1)
        : (pageSize > 0 ? Math.max(1, Math.ceil(sourceRows.length / pageSize)) : 1);
    const currentPage = isServerPaginated ? (pagination.current_page ?? 1) : page;

    function handlePageChange(newPage) {
        if (isServerPaginated) onPageChange(newPage);
        else setPage(newPage);
    }

    const showingTo    = isServerPaginated
        ? (pagination.to    ?? sourceRows.length)
        : Math.min(currentPage * pageSize, sourceRows.length);
    const showingTotal = isServerPaginated
        ? (pagination.total ?? sourceRows.length)
        : sourceRows.length;

    const isEmpty = !loading && paginated.length === 0;

    return (
        <div className={`flex flex-col flex-1 min-h-0 ${className}`} style={{ gap: 'var(--table-pagination-gap)' }}>

            <div
                className="flex flex-col flex-1 min-h-0 w-full overflow-hidden bg-[var(--color-card)]"
                style={{
                    borderRadius: 'var(--radius-md)',
                    border      : 'var(--border-container)',
                    boxShadow   : 'var(--shadow-card)',
                }}
            >
                {/* Toolbar — compresses normally with the card, not frozen */}
                {toolbar && (
                    <div
                        className="shrink-0"
                        style={{
                            padding     : 'var(--space-2)',
                            borderBottom: 'var(--border-container)',
                            background  : 'var(--color-card)',
                        }}
                    >
                        {toolbar}
                    </div>
                )}

                {/* Scroll wrapper — minWidth locked when panel is open so the
                    table stays at its pre-open width and the panel clips it */}
                <div
                    ref={tableScrollRef}
                    className="flex-1 min-h-0 overflow-x-auto"
                    style={{
                        overflowY    : isEmpty || loading ? 'hidden' : 'auto',
                        display      : 'flex',
                        flexDirection: 'column',
                        minWidth     : frozenWidth ?? undefined,
                    }}
                >
                    <table
                        className="w-full border-collapse"
                        style={{ flexShrink: 0 }}
                    >
                        <thead className="sticky top-0 z-10" style={{ background: 'var(--color-table-header-bg)' }}>
                            <tr
                                style={{
                                    height      : 'var(--height-table-header)',
                                    borderBottom: 'var(--border-table-header)',
                                }}
                            >
                                {columns.map((col) => {
                                    const isActionsCol = col.key === 'actions' || col.key === '_actions' || col.label === '';
                                    const displayLabel = isActionsCol ? 'Actions' : col.label;
                                    const isSortable   = !isActionsCol && col.sortable !== false;
                                    const effectiveKey = col.sortKey ?? col.key;
                                    const isActive     = isSortable && sortState.key === effectiveKey;

                                    return (
                                        <th
                                            key={col.key}
                                            onClick={isSortable ? () => {
                                                dispatchSort(effectiveKey);
                                                setPage(1);
                                            } : undefined}
                                            className="font-semibold font-body whitespace-nowrap"
                                            style={{
                                                fontSize     : '12px',
                                                width        : isActionsCol ? '1%' : col.width,
                                                color        : isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 0,
                                                cursor       : isSortable ? 'pointer' : 'default',
                                                userSelect   : 'none',
                                                paddingLeft  : 16,
                                                paddingRight : 16,
                                                overflow     : 'hidden',
                                                whiteSpace   : 'nowrap',
                                                textAlign    : isActionsCol ? 'center' : (col.align ?? 'left'),
                                            }}
                                        >
                                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: isActionsCol ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start', width: '100%', gap: 4 }}>
                                                {col.align === 'right' && isSortable && <SortIcon active={isActive} dir={sortState.dir} />}
                                                {displayLabel}
                                                {col.align !== 'right' && isSortable && <SortIcon active={isActive} dir={sortState.dir} />}
                                            </span>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>

                        {!isEmpty && !loading && (
                            <tbody>
                                {paginated.map((row) => {
                                    const rowKey     = row[keyField] ?? JSON.stringify(row);
                                    const isSelected = selectedKey != null && String(rowKey) === String(selectedKey);
                                    return (
                                        <tr
                                            key={rowKey}
                                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                                            className={[
                                                'last:border-b-0',
                                                'font-body text-[var(--color-text)]',
                                                'transition-colors duration-100',
                                                onRowClick ? 'cursor-pointer' : '',
                                            ].join(' ')}
                                            style={{
                                                height      : 'var(--height-table-row)',
                                                borderBottom: '1px solid var(--color-border-soft)',
                                                background  : isSelected ? 'var(--color-row-selected)' : undefined,
                                            }}
                                            onMouseEnter={!isSelected && onRowClick ? (e) => { e.currentTarget.style.background = 'var(--color-hover)'; } : undefined}
                                            onMouseLeave={!isSelected && onRowClick ? (e) => { e.currentTarget.style.background = ''; } : undefined}
                                        >
                                            {columns.map((col) => {
                                                const isActionsCell = col.key === 'actions' || col.key === '_actions' || col.label === '';
                                                return (
                                                    <td
                                                        key={col.key}
                                                        style={{
                                                            fontSize    : 'var(--font-size-small)',
                                                            color       : 'var(--color-text)',
                                                            textAlign   : isActionsCell ? 'center' : (col.align ?? 'left'),
                                                            width       : isActionsCell ? '1%' : undefined,
                                                            whiteSpace  : isActionsCell ? 'nowrap' : undefined,
                                                            paddingLeft : 16,
                                                            paddingRight: 16,
                                                            overflow    : 'hidden',
                                                        }}
                                                    >
                                                        {isActionsCell
                                                            ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-1)' }}>{col.render ? col.render(row) : (row[col.key] ?? '—')}</div>
                                                            : (col.render ? col.render(row) : (row[col.key] ?? '—'))
                                                        }
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        )}
                    </table>

                    {(isEmpty || loading) && (
                        <div
                            style={{
                                flex          : 1,
                                display       : 'flex',
                                alignItems    : 'center',
                                justifyContent: 'center',
                                transform     : 'translateY(-8px)',
                            }}
                        >
                            {loading
                                ? <LoadingSpinner size="md" />
                                : (typeof empty === 'string'
                                    ? <EmptyState title={emptyTitle ?? emptyMessage ?? empty} description={emptyDescription} icon={emptyIcon} />
                                    : empty)
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {pageSize > 0 && (
                <div
                    className="flex items-center justify-between shrink-0"
                    style={{ paddingLeft: 'var(--space-1)', paddingRight: 'var(--space-1)' }}
                >
                    <p
                        className="font-body text-[var(--color-text-muted)]"
                        style={{ fontSize: 'var(--font-size-small)' }}
                    >
                        Showing{' '}
                        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{showingTo}</span>
                        {' '}of{' '}
                        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{showingTotal}</span>
                        {' '}records
                    </p>

                    <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            style={{ borderRadius: 'var(--radius-md)' }}
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span
                            className="font-body text-[var(--color-text-muted)]"
                            style={{ fontSize: 'var(--font-size-small)', paddingLeft: 'var(--space-1)', paddingRight: 'var(--space-1)' }}
                        >
                            Page{' '}
                            <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{currentPage}</span>
                            {' '}of{' '}
                            <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{totalPages}</span>
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            style={{ borderRadius: 'var(--radius-md)' }}
                            aria-label="Next page"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
