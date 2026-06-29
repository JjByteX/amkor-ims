import { useReducer, useMemo, useState, useLayoutEffect, useRef, useEffect, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import useAutoPageSize from '../../hooks/useAutoPageSize';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import TableSkeletonRows, { SkeletonBar } from './TableSkeletonRows';
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
 * AUTO PAGE SIZE
 * ──────────────
 * When autoPageSize=true the table measures its own available height on every
 * resize and computes the optimal page size automatically. It fires
 * onPageSizeChange(n) (debounced) so the parent can refetch with the new
 * per_page. Pass autoPageSize={true} and onPageSizeChange to enable.
 *
 * LOADING / SETTLING
 * ───────────────────
 * Real rows are never shown mid-correction. The table shows skeleton rows
 * (shaped from `columns`, so every table's skeleton matches its own layout)
 * instead of real rows whenever:
 *   - the `loading` prop is explicitly true, OR
 *   - autoPageSize has detected the rendered row count doesn't match the
 *     viewport and is about to (or has just) asked the parent to refetch
 *     with the corrected per_page, OR
 *   - any Inertia visit targeting this same route (search, filters, page
 *     clicks) is currently in flight.
 * This is all tracked internally — no extra wiring needed per page beyond
 * the existing autoPageSize/onPageSizeChange props.
 *
 * Props:
 *   columns           : Array<{ key, label, render?, width?, sortable?, sortKey? }>
 *   rows              : Array<object>
 *   loading           : bool                 (force skeleton rows on, e.g. during an unrelated blocking op)
 *   empty             : ReactNode | string
 *   pageSize          : number               (default: 20; 0 = disable pagination)
 *   keyField          : string               (default: 'id')
 *   onRowClick        : fn(row)
 *   pagination        : object               (Laravel paginator meta)
 *   onPageChange      : fn(page)
 *   toolbar           : ReactNode
 *   className         : string
 *   panelOpen         : bool                 (freezes table width when true)
 *   panelColsToHide   : number               (accepted but unused)
 *   autoPageSize      : bool                 (enable viewport-driven page size)
 *   onPageSizeChange  : fn(n)                (called when computed page size changes)
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
    panelOpen        = false,
    panelColsToHide  = 2, // accepted but unused
    selectedKey,
    autoPageSize     = false,   // enable viewport-driven page size
    onPageSizeChange,           // fn(n) — called when computed page size changes
}) {
    const [sortState, dispatchSort] = useReducer(sortReducer, sortInitial);
    const [page,      setPage     ] = useReducer((_, p) => p, 1);

    const isServerPaginated = !!pagination && !!onPageChange;

    // ── Auto page size (viewport-driven) ──────────────────────────────────────
    // When autoPageSize=true we measure our own outer div and compute how many
    // rows fit. The computed size is used in place of the pageSize prop.
    //
    // lockNavigation() is called before every page change so the ResizeObserver
    // does not mistake "fewer rows on page 2" for a genuine window resize and
    // fire onPageSizeChange (which would reset the page back to 1).
    const { containerRef: apsRef, autoPageSize: computedPageSize, lockNavigation, correcting } = useAutoPageSize({
        onPageSizeChange,
        hasToolbar      : !!toolbar,
        hasPagination   : pageSize > 0,
        // Seed with the per_page the server already returned so the hook does
        // not fire an unnecessary refetch (and forced page: 1) on every mount,
        // including back-navigation. When the first ResizeObserver measurement
        // matches this value, onPageSizeChange is skipped entirely.
        initialPageSize : pagination?.per_page ?? null,
    });
    // If autoPageSize mode is on, use the computed size; otherwise honour the
    // pageSize prop as before.
    const effectivePageSize = autoPageSize ? computedPageSize : pageSize;

    // ── "Is this table's own data currently in flight?" ────────────────────────
    // Separate from `correcting` above: that one is specific to the auto-size
    // self-correction. This one catches everything else that refetches the
    // SAME page in place — search, filters, page clicks — none of which
    // otherwise have any loading indicator today. Scoped to visits whose
    // target matches the current pathname so navigating *away* to a
    // different page (or an unrelated fetch elsewhere, e.g. the detail
    // panel) never lights this up.
    const { url: currentPageUrl } = usePage();
    const currentPathname = currentPageUrl.split('?')[0];
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        function isSameRoute(visit) {
            try {
                return new URL(String(visit?.url), window.location.origin).pathname === currentPathname;
            } catch {
                return false;
            }
        }
        const removeStart  = router.on('start',  (e) => { if (isSameRoute(e.detail.visit)) setIsFetching(true); });
        const removeFinish = router.on('finish', (e) => { if (isSameRoute(e.detail.visit)) setIsFetching(false); });
        return () => {
            removeStart();
            removeFinish();
        };
    }, [currentPathname]);

    // Only autoPageSize tables care about `correcting` (it's always false
    // for the rest — see the hook's own guard). Either signal means: don't
    // trust the rows currently in `paginated` to be final.
    const isSettling   = autoPageSize ? (correcting || isFetching) : isFetching;
    const showSkeleton = loading || isSettling;

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
        : (effectivePageSize > 0 ? sourceRows.slice((page - 1) * effectivePageSize, page * effectivePageSize) : sourceRows);
    const totalPages  = isServerPaginated
        ? (pagination.last_page ?? 1)
        : (effectivePageSize > 0 ? Math.max(1, Math.ceil(sourceRows.length / effectivePageSize)) : 1);
    const currentPage = isServerPaginated ? (pagination.current_page ?? 1) : page;

    function handlePageChange(newPage) {
        console.log('[DataTable] handlePageChange', newPage, '| autoPageSize:', autoPageSize, '| effectivePageSize:', effectivePageSize);
        if (autoPageSize) {
            console.log('[DataTable] calling lockNavigation()');
            lockNavigation();
        }
        if (isServerPaginated) onPageChange(newPage);
        else setPage(newPage);
    }

    const showingTo    = isServerPaginated
        ? (pagination.to    ?? sourceRows.length)
        : Math.min(currentPage * effectivePageSize, sourceRows.length);
    const showingTotal = isServerPaginated
        ? (pagination.total ?? sourceRows.length)
        : sourceRows.length;

    const isEmpty = !showSkeleton && paginated.length === 0;

    return (
        <div ref={apsRef} className={`flex flex-col flex-1 min-h-0 ${className}`} style={{ gap: 'var(--table-pagination-gap)' }}>

            <div
                data-aps-card
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
                        data-aps-toolbar
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
                        overflowY    : isEmpty || showSkeleton ? 'hidden' : 'auto',
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

                        {showSkeleton ? (
                            columns.length > 0 && (
                                <TableSkeletonRows columns={columns} rowCount={effectivePageSize || pageSize || 10} />
                            )
                        ) : !isEmpty && (
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

                    {/* Genuine empty state only — settling/loading now renders
                        skeleton rows above instead of replacing the table. */}
                    {isEmpty && (
                        <div
                            style={{
                                flex          : 1,
                                display       : 'flex',
                                alignItems    : 'center',
                                justifyContent: 'center',
                                transform     : 'translateY(-8px)',
                            }}
                        >
                            {typeof empty === 'string'
                                ? <EmptyState title={emptyTitle ?? emptyMessage ?? empty} description={emptyDescription} icon={emptyIcon} />
                                : empty
                            }
                        </div>
                    )}

                    {/* Fallback for the (practically unreachable) case where
                        we're settling but don't even know the column shape
                        yet — keeps a sane loading state instead of a blank
                        table with empty <tr>s. */}
                    {showSkeleton && columns.length === 0 && (
                        <div
                            style={{
                                flex          : 1,
                                display       : 'flex',
                                alignItems    : 'center',
                                justifyContent: 'center',
                                transform     : 'translateY(-8px)',
                            }}
                        >
                            <LoadingSpinner size="md" />
                        </div>
                    )}
                </div>
            </div>


            {/* Pagination */}
            {effectivePageSize > 0 && (
                <div
                    className="flex items-center justify-between shrink-0"
                    style={{ paddingLeft: 'var(--space-1)', paddingRight: 'var(--space-1)' }}
                >
                    {showSkeleton ? (
                        <div style={{ width: 150 }}>
                            <SkeletonBar widthPct={100} />
                        </div>
                    ) : (
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
                    )}

                    <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
                        <button
                            disabled={showSkeleton || currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            style={{ borderRadius: 'var(--radius-md)' }}
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {showSkeleton ? (
                            <div style={{ width: 90, paddingLeft: 'var(--space-1)', paddingRight: 'var(--space-1)' }}>
                                <SkeletonBar widthPct={100} />
                            </div>
                        ) : (
                            <span
                                className="font-body text-[var(--color-text-muted)]"
                                style={{ fontSize: 'var(--font-size-small)', paddingLeft: 'var(--space-1)', paddingRight: 'var(--space-1)' }}
                            >
                                Page{' '}
                                <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{currentPage}</span>
                                {' '}of{' '}
                                <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{totalPages}</span>
                            </span>
                        )}
                        <button
                            disabled={showSkeleton || currentPage === totalPages}
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
