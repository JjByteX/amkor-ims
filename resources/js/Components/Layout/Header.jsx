import { router, usePage } from '@inertiajs/react';
import { Sun, Moon, Bell, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import Badge from '../UI/Badge';

/** Map role slugs to human-readable labels */
const ROLE_LABELS = {
    general_manager            : 'General Manager',
    chief_operations_officer   : 'Chief Operations Officer',
    general_sales_manager      : 'General Sales Manager',
    accounting_officer         : 'Accounting Officer',
    disbursement_officer       : 'Disbursement Officer',
    admin_auditor              : 'Admin Auditor',
    hr_admin_officer           : 'HR & Admin Officer',
    liaison_officer            : 'Liaison Officer',
    resa_officer               : 'RESA Officer',
    ormoc_branch_officer       : 'Ormoc Branch Officer',
    visa_documentation_officer : 'Visa & Documentation Officer',
    marketing_officer          : 'Marketing Officer',
};

export default function Header() {
    const { auth } = usePage().props;
    const user     = auth?.user;

    /* ── Dark mode ─────────────────────────────────────────────────────────── */
    const [dark, setDark] = useState(() => {
        try {
            const stored = localStorage.getItem('amkor_dark_mode');
            if (stored !== null) return stored === 'true';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch {
            return false;
        }
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        try { localStorage.setItem('amkor_dark_mode', String(dark)); } catch { /* ignore */ }
    }, [dark]);

    /* ── Logout ─────────────────────────────────────────────────────────────── */
    const handleLogout = () => {
        router.post(route('auth.logout'));
    };

    const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? '';

    return (
        <header
            className={[
                'sticky top-0 z-30',
                'flex items-center justify-between',
                'px-6 shrink-0',
                'bg-[var(--color-card)]',
                'border-b border-gray-100 dark:border-gray-700/50',
            ].join(' ')}
            style={{
                height   : 'var(--height-header)',
                boxShadow: '0 4px 6px -6px rgba(0,0,0,0.015),0 3px 4px -4px rgba(0,0,0,0.012),0 2px 2px -2px rgba(0,0,0,0.010),0 1px 1px -1px rgba(0,0,0,0.008)',
            }}
        >
            {/* Left — branch label */}
            <div className="flex items-center gap-3 min-w-0">
                {user?.branch_name && (
                    <span className="text-[13px] font-semibold text-gray-400 font-body truncate">
                        {user.branch_name}
                    </span>
                )}
            </div>

            {/* Right — actions */}
            <div className="flex items-center gap-1 shrink-0">
                {/* User info */}
                {user && (
                    <div className="flex items-center gap-2 mr-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold font-body text-[var(--color-text)] leading-tight">
                                {user.name}
                            </p>
                            <p className="text-[11px] text-gray-400 leading-tight">{roleLabel}</p>
                        </div>
                        {/* Avatar — intentionally full-circle (brand identity only) */}
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold font-heading">
                                {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Dark mode toggle */}
                <button
                    onClick={() => setDark((d) => !d)}
                    title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                    className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-[var(--color-text)] hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    style={{ borderRadius: 'var(--radius-md)' }}
                >
                    {dark ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notifications bell */}
                <button
                    title="Notifications"
                    className="relative flex items-center justify-center w-10 h-10 text-gray-400 hover:text-[var(--color-text)] hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    style={{ borderRadius: 'var(--radius-md)' }}
                >
                    <Bell size={20} />
                    {/* Unread dot — modules will wire real count in Phase 12 */}
                    {/* <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-error)] rounded-full" /> */}
                </button>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    title="Sign out"
                    className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-[var(--color-error)] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    style={{ borderRadius: 'var(--radius-md)' }}
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}
