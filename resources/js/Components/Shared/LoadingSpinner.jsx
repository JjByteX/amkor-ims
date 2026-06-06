import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner — animated spinner.
 *
 * Props:
 *   size     : 'sm' | 'md' | 'lg'   (default: 'md')
 *   className: string
 */
export default function LoadingSpinner({ size = 'md', className = '' }) {
    const sizes = { sm: 16, md: 24, lg: 40 };
    const px    = sizes[size] ?? sizes.md;

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <Loader2
                size={px}
                className="animate-spin text-[var(--color-primary)]"
            />
        </div>
    );
}
