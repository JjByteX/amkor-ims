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
 * Pagination row is always rendered below the table (shrink-0), outside
 * the scrollable area.
 *
 * Table wrapper shares the same --border-container token as Card
 * so borders are always consistent across the system.
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
    className   = '',
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

    return (
        /*
          flex-1 — stretches to fill leftover height in a flex-col parent.
          min-h-0 — critical: without this, flex children don't shrink below
                    their content size, which would cause the table to push
                    the page taller than the viewport.
        */
        <div className={`flex flex-col flex-1 min-h-0 ${className}`} style={{ gap: 'var(--space-2)' }}>

            {/*
              flex-1 + min-h-0 + overflow-y-auto:
              The table wrapper grows to fill available height and scrolls
              internally.  The page itself stays fixed at 100vh.
            */}
            <div
                className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-auto bg-[var(--color-card)]"
                style={{
                    borderRadius: 'var(--radius-md)',
                    border: 'var(--border-container)',
                    boxShadow: '0 4px 6px -6px rgba(0,0,0,0.015),0 3px 4px -4px rgba(0,0,0,0.012),0 2px 2px -2px rgba(0,0,0,0.010),0 1px 1px -1px rgba(0,0,0,0.008)',
                }}
            >
                <table className="w-full border-collapse">
                    {/* Sticky header — stays visible while rows scroll */}
                    <thead className="sticky top-0 z-10 bg-[var(--color-card)]">
                        <tr
                            className="border-b border-gray-100 dark:border-gray-700"
                            style={{ height: 'var(--height-table-header)' }}
                        >
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="text-left font-semibold font-body text-gray-500 dark:text-gray-400 whitespace-nowrap"
                                    style={{
                                        fontSize   : 'var(--font-size-small)',
                                        paddingLeft: 'var(--space-2)',
                                        paddingRight: 'var(--space-2)',
                                        width      : col.width,
                                    }}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="py-12 text-center">
                                    <LoadingSpinner size="md" />
                                </td>
                            </tr>
                        ) : paginated.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-12 text-center">
                                    {typeof empty === 'string'
                                        ? <EmptyState title={empty} />
                                        : empty
                                    }
                                </td>
                            </tr>
                        ) : (
                            paginated.map((row) => (
                                <tr
                                    key={row[keyField] ?? JSON.stringify(row)}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    className={[
                                        'border-b border-gray-50 dark:border-gray-700/50',
                                        'last:border-b-0',
                                        'font-body text-[var(--color-text)]',
                                        'transition-colors duration-100',
                                        onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30' : '',
                                    ].join(' ')}
                                    style={{ height: 'var(--height-table-row)' }}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            style={{
                                                fontSize    : 'var(--font-size-small)',
                                                paddingLeft : 'var(--space-2)',
                                                paddingRight: 'var(--space-2)',
                                            }}
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : row[col.key] ?? '—'
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination — always below the scrollable table, never inside it */}
            {showPagination && (
                <div
                    className="flex items-center justify-between shrink-0"
                    style={{ paddingLeft: 'var(--space-1)', paddingRight: 'var(--space-1)' }}
                >
                    <p
                        className="font-body text-gray-400"
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
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
