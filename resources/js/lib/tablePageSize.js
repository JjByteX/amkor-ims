/**
 * tablePageSize — per-route "remembered" row count for auto-sizing tables.
 *
 * useAutoPageSize() measures a table's available height and works out how
 * many rows fit, then asks the page to refetch with that per_page. That
 * measurement can only happen once the destination page's table has actually
 * mounted — so navigating to a *different* table page always starts out on
 * the server's default per_page, briefly renders too many (or too few) rows,
 * then silently re-navigates with the corrected per_page once the hook
 * catches up. That's the flash/"waits ~1s" problem.
 *
 * IMPORTANT: different list pages have different toolbar heights (more
 * filter fields = taller toolbar = fewer rows fit), so the right row count
 * for /reservation is not the right row count for /visa. Every CONFIRMED
 * measurement (i.e. one useAutoPageSize itself trusts enough to act on) is
 * remembered here per-route, in localStorage, keyed by pathname. Sidebar nav
 * links read back the value for whatever specific page they point to and
 * send it along as `?per_page=` on the very first request, so that page
 * already renders at the right size instead of correcting itself after the
 * fact.
 *
 * This is purely a "best known guess" used to seed that first request for a
 * route. If a page's real measurement ends up different (the window was
 * resized since it was last remembered, the toolbar grew a filter, etc.)
 * useAutoPageSize's own self-correction still runs exactly as before —
 * nothing here changes that, it just means that one visit gets a fresh
 * correction and the corrected value is remembered for next time.
 */

const STORAGE_KEY = 'amkor_table_page_sizes';

// undefined = not read yet this session, otherwise the parsed map
// (e.g. { "/visa": 13, "/reservation": 11 }).
let cache;

function load() {
    if (cache !== undefined) return cache;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        cache = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch {
        cache = {}; // localStorage unavailable or value corrupted
    }
    return cache;
}

// Strips query string/hash and any trailing slash so "/visa?page=2" and
// "/visa/" both key the same as "/visa".
function normalizeKey(pathname) {
    if (!pathname || typeof pathname !== 'string') return null;
    const path = pathname.split('?')[0].split('#')[0];
    if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
    return path || null;
}

export function getStoredPageSize(pathname) {
    const key = normalizeKey(pathname);
    if (!key) return null;
    const n = load()[key];
    return Number.isFinite(n) && n > 0 ? n : null;
}

export function rememberPageSize(pathname, n) {
    const key = normalizeKey(pathname);
    if (!key || !Number.isFinite(n) || n <= 0) return;
    const map = load();
    if (map[key] === n) return;
    map[key] = n;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
        /* non-fatal — value still lives in `cache` for this session */
    }
}
