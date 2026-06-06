import Sidebar from './Sidebar';
import { ToastProvider } from '../UI/Toast';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useToast } from '../UI/Toast';

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
 * Spacing & height model:
 *   - The root div is h-screen / overflow-hidden — the viewport is the
 *     single scroll container for the whole shell.
 *   - <main> fills the remaining height (flex-1) and does NOT scroll itself
 *     (overflow-hidden).  It uses flex-col so its children can stretch.
 *   - padding: --space-page (40px) on all four sides gives the outer gutter.
 *   - The page content div inside <main> must also be flex-col so that the
 *     last child (the DataTable wrapper) can flex-grow to fill leftover space.
 *   - DataTable's scroll container sets overflow-y: auto; the page never
 *     overflows — only the table body scrolls.
 *   - The 40px bottom padding on <main> creates the same breathing room at
 *     the bottom as the horizontal gutters, so the table never sits flush
 *     against the viewport edge.
 *
 * Note: The top bar (dark mode, notifications, profile, logout) has been
 * moved into the Sidebar's pinned account row. Header.jsx is no longer used.
 */
export default function AppShell({ children }) {
    return (
        <ToastProvider>
            <FlashToastBridge />
            <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
                <Sidebar />

                <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                    {/*
                      overflow-hidden here — the page itself must never scroll.
                      flex flex-col lets child page wrappers stretch with flex-1.
                    */}
                    <main
                        id="main-content"
                        className="flex flex-col flex-1 overflow-hidden"
                        style={{ padding: 'var(--space-page)' }}
                    >
                        {children}
                    </main>
                </div>
            </div>
        </ToastProvider>
    );
}

/**
 * FlashToastBridge — reads Inertia flash props and shows toasts automatically.
 * Must live inside ToastProvider.
 */
function FlashToastBridge() {
    const { flash } = usePage().props;
    const { toast } = useToast();

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error)   toast.error(flash.error);
        if (flash?.warning) toast.warning(flash.warning);
        if (flash?.info)    toast.info(flash.info);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flash]);

    return null;
}
