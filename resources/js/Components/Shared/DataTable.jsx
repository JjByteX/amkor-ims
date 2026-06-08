import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

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
 * The outer wrapper of this component is "flex flex-col flex-1" so it
 * stretches to fill whatever space its parent leaves.  The inner table
 * wrapper is also flex-1 with overflow-y-auto so only the rows scroll —
 * the page never overflows.
 *
 * Empty/loading state centering
 * ──────────────────────────────
 * When there are no rows the scroll wrapper switches to flex-col so the
 * sticky-thead table (shrink-0) and the empty state filler div (flex-1)
 * sit as siblings. The filler div uses flex centre + translateY(-8px) to
 * sit slightly above dead-centre — no table height tricks, no scroll.
 *
 * Pagination row is always rendered below the table (shrink-0), outside
 * the scrollable area.
 *
 * Props:
 *   columns    : Array<{ key, label, render?, width? }>
 *   rows       : Array<object>
 *   loading    : bool
 *   empty      : ReactNode | string
 *   pageSize   : number               (default: 20; 0 = disable pagination)
 *   keyField   : string               (default: 'id')
 *   onRowClick : fn(row)
 *   pagination : object               (Laravel paginator meta)
 *   onPageChange: fn(page)
 *   toolbar    : ReactNode             (optional filter/action strip)
 *   className  : string
 */
export default function DataTable({
    columns     = [],
    rows        = [],
    loading     = false,
    empty       = 'No records found.',
    pageSize    = 20,
    keyField    = 'id',
    onRowClick,
    pagination,
    onPageChange,
    toolbar,
    className   = '',
    emptyMessage,
    emptyTitle,
    emptyDescription,
    emptyIcon,
}) {
    const [page, setPage] = useState(1);

    const isServerPaginated = !!pagination && !!onPageChange;

    const paginated = isServerPaginated
        ? rows
        : (pageSize > 0 ? rows.slice((page - 1) * pageSize, page * pageSize) : rows);

    const totalPages = isServerPaginated
        ? pagination.last_page ?? 1
        : (pageSize > 0 ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1);

    const currentPage = isServerPaginated ? (pagination.current_page ?? 1) : page;

    function handlePageChange(newPage) {
        if (isServerPaginated) {
            onPageChange(newPage);
        } else {
            setPage(newPage);
        }
    }

    const showPagination = isServerPaginated
        ? totalPages > 1
        : (pageSize > 0 && rows.length > pageSize);

    const isEmpty = !loading && paginated.length === 0;

    return (
        /*
          flex-1 — stretches to fill leftover height in a flex-col parent.
          min-h-0 — critical: without this, flex children don't shrink below
                    their content size, which would cause the table to push
                    the page taller than the viewport.
        */
        <div className={`flex flex-col flex-1 min-h-0 ${className}`} style={{ gap: 'var(--space-2)' }}>

            <div
                className="flex flex-col flex-1 min-h-0 w-full overflow-hidden bg-[var(--color-card)]"
                style={{
                    borderRadius: 'var(--radius-md)',
                    border: 'var(--border-container)',
                    boxShadow: 'var(--shadow-card)',
                }}
            >
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

                {/*
                  When rows are present: normal overflow-y-auto scroll container.
                  When empty/loading: flex-col so the thead (shrink-0) and the
                  empty-state filler (flex-1) stack without any table height tricks.
                  overflow-hidden prevents any phantom scrollbar.
                */}
                <div
                    className="flex-1 min-h-0 w-full overflow-x-auto"
                    style={{
                        overflowY  : isEmpty || loading ? 'hidden' : 'auto',
                        display    : 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* ── Header-only table — always rendered, sticky ── */}
                    <table className="w-full border-collapse" style={{ flexShrink: 0 }}>
                        <thead className="sticky top-0 z-10" style={{ background: 'var(--color-table-header-bg)' }}>
                            <tr
                                style={{
                                    height      : 'var(--height-table-header)',
                                    borderBottom: 'var(--border-table-header)',
                                }}
                            >
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className="text-left font-semibold font-body whitespace-nowrap"
                                        style={{
                                            fontSize     : '12px',
                                            paddingLeft  : 'var(--space-2)',
                                            paddingRight : 'var(--space-2)',
                                            width        : col.width,
                                            color        : 'var(--color-text-muted)',
                                            textTransform: 'uppercase',
                                            letterSpacing : 0,
                                        }}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Rows — only rendered when there's data */}
                        {!isEmpty && !loading && (
                            <tbody>
                                {paginated.map((row) => (
                                    <tr
                                        key={row[keyField] ?? JSON.stringify(row)}
                                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                                        className={[
                                            'last:border-b-0',
                                            'font-body text-[var(--color-text)]',
                                            'transition-colors duration-100',
                                            onRowClick ? 'cursor-pointer hover:bg-black/[0.025] dark:hover:bg-white/[0.04]' : '',
                                        ].join(' ')}
                                        style={{
                                            height      : 'var(--height-table-row)',
                                            borderBottom: '1px solid var(--color-border-soft)',
                                        }}
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                style={{
                                                    fontSize    : 'var(--font-size-small)',
                                                    paddingLeft : 'var(--space-2)',
                                                    paddingRight: 'var(--space-2)',
                                                    color       : 'var(--color-text)',
                                                }}
                                            >
                                                {col.render
                                                    ? col.render(row)
                                                    : row[col.key] ?? '—'
                                                }
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        )}
                    </table>

                    {/*
                      Empty / loading filler — sibling to the table, not inside it.
                      flex-1 fills all space below the thead so the content is
                      truly centred in the remaining body area.
                      translateY(-8px) nudges slightly above dead-centre (divisible by 8).
                    */}
                    {(isEmpty || loading) && (
                        <div
                            style={{
                                flex           : 1,
                                display        : 'flex',
                                alignItems     : 'center',
                                justifyContent : 'center',
                                transform      : 'translateY(-8px)',
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

            {/* Pagination — always below the scrollable table, never inside it */}
            {showPagination && (
                <div
                    className="flex items-center justify-between shrink-0"
                    style={{ paddingLeft: 'var(--space-1)', paddingRight: 'var(--space-1)' }}
                >
                    <p
                        className="font-body text-[var(--color-text-muted)]"
                        style={{ fontSize: 'var(--font-size-small)' }}
                    >
                        {isServerPaginated
                            ? `Showing ${pagination.from ?? 1}–${pagination.to ?? rows.length} of ${pagination.total ?? rows.length}`
                            : `Showing ${((currentPage - 1) * pageSize) + 1}–${Math.min(currentPage * pageSize, rows.length)} of ${rows.length}`
                        }
                    </p>
                    <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            style={{ borderRadius: 'var(--radius-md)' }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span
                            className="font-body text-[var(--color-text)]"
                            style={{ fontSize: 'var(--font-size-small)', paddingLeft: 'var(--space-1)', paddingRight: 'var(--space-1)' }}
                        >
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            style={{ borderRadius: 'var(--radius-md)' }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}