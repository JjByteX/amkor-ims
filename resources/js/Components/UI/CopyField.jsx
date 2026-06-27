import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * CopyField
 *
 * Renders a labelled value with a clipboard copy action.
 * The Copy icon appears on hover; after clicking it shows ✓ for 1.5 s then resets.
 *
 * Props:
 *   label : string  — field label
 *   value : string  — the value to display and copy (renders '—' if falsy)
 */
export default function CopyField({ label, value }) {
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);

    function handleCopy() {
        if (!value) return;
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
                className="font-body"
                style={{
                    fontSize: 'var(--font-size-small)',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                }}
            >
                {label}
            </span>

            <div
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <span
                    className="font-body"
                    style={{
                        fontSize: 'var(--font-size-body)',
                        color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
                        fontFamily: value ? 'var(--font-mono, monospace)' : 'var(--font-body)',
                        letterSpacing: value ? '0.04em' : 0,
                    }}
                >
                    {value || '—'}
                </span>

                {value && (hovered || copied) && (
                    <button
                        type="button"
                        onClick={handleCopy}
                        title={copied ? 'Copied!' : 'Copy to clipboard'}
                        style={{
                            background: 'none', border: 'none', padding: 2,
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            color: copied ? 'var(--color-success)' : 'var(--color-text-muted)',
                            transition: 'color 0.15s',
                            flexShrink: 0,
                        }}
                    >
                        {copied
                            ? <Check size={13} />
                            : <Copy size={13} />}
                    </button>
                )}
            </div>
        </div>
    );
}
