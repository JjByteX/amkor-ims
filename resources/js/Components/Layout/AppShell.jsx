import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import { ToastProvider, useToast } from '../UI/Toast';
import { usePage } from '@inertiajs/react';

/**
 * AppShell — root persistent layout.
 *
 * Usage in every authenticated page:
 *
 *   const Page = () => <div>content</div>;
 *   Page.layout = (page) => <AppShell>{page}</AppShell>;
 *   export default Page;
 *
 * Inertia persists this component across navigations — Sidebar never
 * re-mounts. Only the inner <main> content swaps.
 *
 * DARK MODE — CIRCLE REVEAL (View Transitions API)
 * ─────────────────────────────────────────────────
 * Uses the browser-native View Transitions API so the animation runs on
 * real DOM content — text, icons, sidebar, everything — not a fake overlay.
 *
 * How it works:
 *   1. A ::view-transition-new(root) keyframe is injected that clips the
 *      incoming state to a circle expanding from the bottom-left corner.
 *   2. document.startViewTransition() snapshots the current page, flips the
 *      dark class on <html>, then plays the clip-path animation between the
 *      two real snapshots. Both layers contain real rendered content.
 *   3. The style tag is removed after the transition completes.
 *
 * Browsers without View Transitions API get an instant theme switch with no
 * animation — no errors, no fallback needed.
 *
 * Spacing & height model:
 *   - The root div is h-screen / overflow-hidden — the viewport is the
 *     single scroll container for the whole shell.
 *   - <main> fills the remaining height (flex-1) and does NOT scroll itself
 *     (overflow-hidden). It uses flex-col so its children can stretch.
 *   - padding: --space-page (40px) on all four sides gives the outer gutter.
 */

const CIRCLE_DURATION_MS = 600;

function applyDark(dark) {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('amkor_dark_mode', String(dark)); } catch { /* ignore */ }
}

function AppShellInner({ children }) {
    const { flash } = usePage().props;
    const { toast } = useToast();

    // ── Dark mode — source of truth ───────────────────────────────────────────
    const [dark, setDark] = useState(() => {
        try {
            const stored = localStorage.getItem('amkor_dark_mode');
            if (stored !== null) return stored === 'true';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch { return false; }
    });

    // Sync class on mount
    useEffect(() => { applyDark(dark); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Theme toggle with View Transitions circle reveal ──────────────────────
    const handleToggleDark = useCallback(() => {
        const incoming = !dark;

        // Inject the clip-path keyframe scoped to this transition.
        // The circle originates at bottom-left (0px, 100vh) and expands to
        // cover the full diagonal of the viewport.
        const maxR = Math.ceil(Math.hypot(window.innerWidth, window.innerHeight));
        const style = document.createElement('style');
        style.id = '__theme-transition';
        style.textContent = `
            ::view-transition-old(root) {
                animation: none;
                z-index: 1;
            }
            ::view-transition-new(root) {
                animation: theme-circle-expand ${CIRCLE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
                z-index: 2;
            }
            @keyframes theme-circle-expand {
                from { clip-path: circle(0px at 0px 100vh); }
                to   { clip-path: circle(${maxR}px at 0px 100vh); }
            }
        `;
        document.head.appendChild(style);

        const cleanup = () => {
            document.getElementById('__theme-transition')?.remove();
        };

        if (!document.startViewTransition) {
            // Fallback: instant switch for unsupported browsers
            cleanup();
            applyDark(incoming);
            setDark(incoming);
            return;
        }

        const transition = document.startViewTransition(() => {
            applyDark(incoming);
            setDark(incoming);
        });

        transition.finished.then(cleanup).catch(cleanup);
    }, [dark]);

    // ── Flash toasts ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error)   toast.error(flash.error);
        if (flash?.warning) toast.warning(flash.warning);
        if (flash?.info)    toast.info(flash.info);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flash]);

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
            <Sidebar dark={dark} onToggleDark={handleToggleDark} />
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                <main
                    id="main-content"
                    className="flex flex-col flex-1 overflow-hidden"
                    style={{ padding: 'var(--space-page)' }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function AppShell({ children }) {
    return (
        <ToastProvider>
            <AppShellInner>{children}</AppShellInner>
        </ToastProvider>
    );
}
