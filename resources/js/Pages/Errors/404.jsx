import { Link } from '@inertiajs/react';
import { MapPinOff } from 'lucide-react';
import Button from '../../Components/UI/Button';

/**
 * 404 Not Found — shown when a route does not exist.
 * No AppShell — rendered as a standalone page (no sidebar/header needed for error states).
 */
export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
            <div className="flex flex-col items-center gap-6 text-center max-w-sm">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                    <MapPinOff size={32} className="text-[var(--color-warning)]" />
                </div>

                {/* Copy */}
                <div>
                    <h1 className="font-heading font-semibold text-[var(--color-text)]"
                        style={{ fontSize: 'var(--font-size-heading)' }}>
                        Page Not Found
                    </h1>
                    <p className="font-body text-[13px] text-gray-400 mt-2">
                        The page you're looking for doesn't exist or may have been moved.
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
