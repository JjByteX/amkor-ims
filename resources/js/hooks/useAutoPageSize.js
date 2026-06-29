import { useState, useRef, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { rememberPageSize } from '../lib/tablePageSize';

const LOG = true; // set false to silence
const log = (...a) => LOG && console.log('[APS]', ...a);

export default function useAutoPageSize({
    onPageSizeChange,
    hasToolbar      = true,
    hasPagination   = true,
    debounceMs      = 300,
    navLockMs       = 2000,
    minRows         = 3,
    maxRows         = 100,
    initialPageSize = null,
} = {}) {
    const containerRef   = useRef(null);
    const debounceTimer  = useRef(null);
    const navLockTimer   = useRef(null);
    const navLocked      = useRef(false);
    const lastFiredSize  = useRef(initialPageSize ?? null);
    // The page size we've decided to correct to but haven't had confirmed by
    // the server yet — null when no correction is in flight/pending.
    const pendingSize    = useRef(null);

    // Strip query string — different filters on the same page are still the
    // same route for page-size-remembering purposes.
    const { url: currentUrl } = usePage();
    const pathname = currentUrl.split('?')[0];

    log('render — initialPageSize:', initialPageSize, '| lastFiredSize:', lastFiredSize.current, '| navLocked:', navLocked.current);

    // Sync lastFiredSize when the server confirms the per_page we requested.
    // IMPORTANT: only sync downward (or to equal). If initialPageSize is LARGER
    // than lastFiredSize it means the server used its default (we didn't send
    // per_page in that request). Syncing upward would make the hook think a large
    // per_page is "current" and re-fire onPageSizeChange to correct it, which
    // resets the page back to 1.
    useEffect(() => {
        if (initialPageSize != null) {
            if (initialPageSize <= (lastFiredSize.current ?? Infinity)) {
                log('syncing lastFiredSize', lastFiredSize.current, '→', initialPageSize);
                lastFiredSize.current = initialPageSize;
            } else {
                log('skipping upward sync', lastFiredSize.current, '→', initialPageSize, '(server used default)');
            }
            // If the server just confirmed the size we fired and were waiting
            // on, the correction is complete — clear the "correcting" signal.
            if (pendingSize.current != null && initialPageSize === pendingSize.current) {
                log('✅ correction confirmed by server:', initialPageSize);
                pendingSize.current = null;
                setCorrecting(false);
            }
        }
    }, [initialPageSize]);

    const [autoPageSize, setAutoPageSize] = useState(initialPageSize ?? 20);
    // True from the instant a measurement mismatch is detected until the
    // server confirms the corrected per_page — i.e. exactly the window
    // during which the rendered rows are "wrong" or about to be replaced.
    // DataTable uses this to swap in skeleton rows instead of showing real
    // rows that are about to be reorganized.
    const [correcting, setCorrecting] = useState(false);

    const callbackRef = useRef(onPageSizeChange);
    useEffect(() => { callbackRef.current = onPageSizeChange; }, [onPageSizeChange]);

    function getCssVar(name, fallback) {
        const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        const n   = parseInt(raw, 10);
        return isNaN(n) ? fallback : n;
    }

    const compute = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;

        const availableH    = el.getBoundingClientRect().height;
        const rowH          = getCssVar('--height-table-row',    52);
        const headerH       = getCssVar('--height-table-header', 44);
        const paginationH   = hasPagination ? 32 : 0;
        const paginationGap = hasPagination ? getCssVar('--table-pagination-gap', 8) : 0;

        let toolbarH = 0;
        if (hasToolbar) {
            const card    = el.querySelector('[data-aps-card]');
            const toolbar = card?.querySelector('[data-aps-toolbar]');
            toolbarH = toolbar
                ? toolbar.getBoundingClientRect().height
                : getCssVar('--height-table-toolbar', 56);
        }

        const usable  = availableH - paginationH - paginationGap - headerH - toolbarH - 2;
        const rows    = Math.floor(usable / rowH);
        const clamped = Math.max(minRows, Math.min(maxRows, rows));

        log('compute — availH:', availableH, 'usable:', usable, 'rowH:', rowH, 'clamped:', clamped,
            '| lastFired:', lastFiredSize.current, '| navLocked:', navLocked.current);

        setAutoPageSize(clamped);

        // Tables that only use the *measurement* (e.g. a fixed client-side
        // pageSize, no onPageSizeChange) have nothing to correct — bail out
        // before touching any of the correction-tracking state below, or
        // `correcting` would flip true on first measurement and never have
        // anything to clear it (no fetch is ever fired to confirm it).
        if (!callbackRef.current) {
            return;
        }

        if (navLocked.current) {
            log('compute — SUPPRESSED (nav locked)');
            return;
        }

        if (clamped !== lastFiredSize.current) {
            log('compute — scheduling fire:', clamped, '(was', lastFiredSize.current + ')');
            // Flip the "correcting" signal on now, immediately — the rows on
            // screen are already known to be the wrong count, well before
            // the debounce timer below even starts the actual refetch.
            pendingSize.current = clamped;
            setCorrecting(true);
            clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => {
                if (navLocked.current) {
                    log('debounce fire SUPPRESSED (nav locked at fire time)');
                    return;
                }
                if (clamped !== lastFiredSize.current) {
                    log('🔥 FIRING onPageSizeChange:', clamped);
                    lastFiredSize.current = clamped;
                    rememberPageSize(pathname, clamped);
                    callbackRef.current?.(clamped);
                    // `correcting` stays true — we're now waiting on the
                    // network response. The initialPageSize sync effect
                    // above clears it once the server confirms `clamped`.
                } else {
                    log('debounce fire skipped — lastFiredSize already', lastFiredSize.current);
                    if (pendingSize.current === clamped) {
                        pendingSize.current = null;
                        setCorrecting(false);
                    }
                }
            }, debounceMs);
        } else {
            log('compute — no change (clamped === lastFired =', clamped + ')');
            // This measurement matches what the server already rendered, so
            // it's a trustworthy "this many rows fits the viewport" value —
            // safe to remember (for this route specifically) for next time.
            rememberPageSize(pathname, clamped);
            // If a correction had been pending and the measurement settled
            // back to the already-confirmed value before the debounce fired
            // (e.g. window resized back), abandon it.
            if (pendingSize.current != null) {
                clearTimeout(debounceTimer.current);
                pendingSize.current = null;
                setCorrecting(false);
            }
        }
    }, [hasToolbar, hasPagination, debounceMs, minRows, maxRows, pathname]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        log('attaching ResizeObserver');
        const observer = new ResizeObserver(compute);
        observer.observe(el);
        return () => {
            log('detaching ResizeObserver');
            observer.disconnect();
            clearTimeout(debounceTimer.current);
            clearTimeout(navLockTimer.current);
        };
    }, [compute]);

    const lockNavigation = useCallback(() => {
        log('🔒 lockNavigation called — cancelling debounce, setting lock for', navLockMs, 'ms');
        clearTimeout(debounceTimer.current);
        clearTimeout(navLockTimer.current);
        navLocked.current = true;
        // Abandon any pending correction — the user's explicit page-change
        // click takes priority. compute() re-evaluates from scratch (and
        // reschedules if still needed) once the lock releases below.
        if (pendingSize.current != null) {
            pendingSize.current = null;
            setCorrecting(false);
        }
        navLockTimer.current = setTimeout(() => {
            log('🔓 nav lock released — re-measuring');
            navLocked.current = false;
            compute();
        }, navLockMs);
    }, [navLockMs, compute]);

    return { containerRef, autoPageSize, lockNavigation, correcting };
}
