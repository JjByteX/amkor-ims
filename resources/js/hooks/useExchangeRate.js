import { useState, useEffect, useRef } from 'react';

/**
 * useExchangeRate
 * ───────────────
 * Fetches the live USD → PHP exchange rate from ExchangeRate-API.
 *
 * Used by the booking form (Form.jsx, Phase 5) to pre-fill the
 * Exchange Rate field when a tour package is selected, so the
 * selling_price autofill converts USD tour costs to PHP accurately.
 *
 * API USED
 * ────────
 * https://api.exchangerate-api.com/v4/latest/USD
 * Free tier — no API key required, updated daily.
 * Returns: { "rates": { "PHP": 56.12, ... }, ... }
 *
 * FAILURE HANDLING
 * ────────────────
 * If the fetch fails for any reason (network error, rate limit, bad
 * response), `rate` stays null and `error` is set to a human-readable
 * message. The booking form shows a visible warning in this state so
 * staff know to enter the rate manually — we never silently fall back
 * to a stale hardcoded value.
 *
 * CACHING
 * ───────
 * The rate is cached in module-level memory for CACHE_TTL_MS (1 hour).
 * Multiple components mounting in the same session (e.g. opening the
 * booking form twice) will reuse the cached rate without a second fetch.
 * The cache is intentionally not persisted across page reloads — a fresh
 * fetch on each new session is desirable given daily rate updates.
 *
 * USAGE
 * ─────
 * const { rate, loading, error } = useExchangeRate();
 *
 * rate    — number | null   (e.g. 56.12)
 * loading — bool            (true while the fetch is in-flight)
 * error   — string | null   (human-readable message if fetch failed)
 *
 * The rate is in PHP per 1 USD.
 * To convert: phpAmount = usdAmount * rate
 */

const CACHE_TTL_MS  = 60 * 60 * 1000; // 1 hour
const API_URL       = 'https://api.exchangerate-api.com/v4/latest/USD';

// Module-level cache — shared across all hook instances in the same session.
let cachedRate      = null;
let cacheTimestamp  = null;

function isCacheValid() {
    return (
        cachedRate !== null &&
        cacheTimestamp !== null &&
        Date.now() - cacheTimestamp < CACHE_TTL_MS
    );
}

export default function useExchangeRate() {
    const [rate,    setRate]    = useState(() => isCacheValid() ? cachedRate : null);
    const [loading, setLoading] = useState(() => !isCacheValid());
    const [error,   setError]   = useState(null);

    // Abort controller ref so we can cancel the fetch if the component unmounts
    // before it completes (avoids the setState-on-unmounted-component warning).
    const abortRef = useRef(null);

    useEffect(() => {
        // Cache hit — nothing to do.
        if (isCacheValid()) {
            setRate(cachedRate);
            setLoading(false);
            return;
        }

        let cancelled = false;
        abortRef.current = new AbortController();

        setLoading(true);
        setError(null);

        (async () => {
            try {
                const res = await fetch(API_URL, {
                    signal: abortRef.current.signal,
                });

                if (!res.ok) {
                    throw new Error(`Exchange rate service returned ${res.status}.`);
                }

                const data = await res.json();
                const phpRate = data?.rates?.PHP;

                if (!phpRate || typeof phpRate !== 'number') {
                    throw new Error('PHP rate not found in exchange rate response.');
                }

                // Round to 4 decimal places — enough precision for currency
                // conversion without floating-point noise.
                const rounded = Math.round(phpRate * 10000) / 10000;

                // Update module-level cache
                cachedRate     = rounded;
                cacheTimestamp = Date.now();

                if (!cancelled) {
                    setRate(rounded);
                    setLoading(false);
                }
            } catch (err) {
                if (cancelled || err.name === 'AbortError') return;

                // Surface a clear, actionable message — not a raw JS error.
                const message = err.message?.includes('fetch')
                    ? 'Could not reach the exchange rate service. Please enter the rate manually.'
                    : err.message ?? 'Exchange rate unavailable. Please enter the rate manually.';

                setError(message);
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            abortRef.current?.abort();
        };
    }, []); // Intentionally empty — fetch once per mount (cache handles repeats).

    return { rate, loading, error };
}
