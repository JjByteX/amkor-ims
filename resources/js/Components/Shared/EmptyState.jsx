import { FileX } from 'lucide-react';

/**
 * EmptyState — centered placeholder shown when a list/table is empty.
 *
 * Props:
 *   icon        : ReactNode   (Lucide icon — defaults to FileX)
 *   title       : string
 *   description : string      (optional secondary line)
 *   action      : ReactNode   (optional CTA button)
 *   className   : string
 */
export default function EmptyState({
    icon,
    title       = 'No records found',
    description,
    action,
    className   = '',
}) {
    return (
        <div className={`flex flex-col items-center justify-center gap-3 py-12 px-4 text-center ${className}`}>
            <div className="text-gray-300 dark:text-gray-600">
                {icon ?? <FileX size={40} strokeWidth={1.5} />}
            </div>
            <div>
                <p className="font-heading font-semibold text-[var(--color-text)] text-base">
                    {title}
                </p>
                {description && (
                    <p className="font-body text-[13px] text-gray-400 mt-1">
                        {description}
                    </p>
                )}
            </div>
            {action && <div className="mt-1">{action}</div>}
        </div>
    );
}
