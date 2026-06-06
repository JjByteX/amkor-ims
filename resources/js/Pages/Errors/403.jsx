import { Link } from '@inertiajs/react';
import { ShieldOff } from 'lucide-react';
import Button from '../../Components/UI/Button';

/**
 * 403 Forbidden — shown when a role attempts to access an unauthorised route.
 * No AppShell — rendered as a standalone page (no sidebar/header needed for error states).
 */
export default function Forbidden() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
            <div className="flex flex-col items-center gap-6 text-center max-w-sm">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <ShieldOff size={32} className="text-[var(--color-error)]" />
                </div>

                {/* Copy */}
                <div>
                    <h1 className="font-heading font-semibold text-[var(--color-text)]"
                        style={{ fontSize: 'var(--font-size-heading)' }}>
                        Access Denied
                    </h1>
                    <p className="font-body text-[13px] text-gray-400 mt-2">
                        You don't have permission to view this page.
                        If you believe this is an error, contact your administrator.
                    </p>
                </div>

                {/* Action */}
                <Link href={route('dashboard')}>
                    <Button variant="primary" size="default">
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
