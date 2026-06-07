import { isValidElement } from 'react';
import Card from '../UI/Card';

/**
 * StatCard - shared KPI card for list/table pages.
 */
export default function StatCard({
    icon,
    label,
    value,
    tone = 'default',
    color,
    sub,
    className = '',
}) {
    const tones = {
        default: 'var(--color-text)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        primary: 'var(--color-primary)',
    };

    let iconNode = null;
    if (icon) {
        if (isValidElement(icon)) {
            iconNode = icon;
        } else {
            const Icon = icon;
            iconNode = <Icon size={18} />;
        }
    }

    const toneColor = color ?? tones[tone] ?? tone;

    return (
        <Card compact className={className} style={{ minHeight: 86 }}>
            <div className="flex h-full items-center gap-3">
                {iconNode && (
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center"
                        style={{
                            borderRadius: 'var(--radius-md)',
                            background: 'color-mix(in srgb, var(--color-primary) 9%, var(--color-card))',
                            color: toneColor === 'var(--color-text)' ? 'var(--color-primary)' : toneColor,
                            border: '1px solid color-mix(in srgb, var(--color-primary) 14%, var(--color-border))',
                        }}
                    >
                        {iconNode}
                    </div>
                )}

                <div className="min-w-0">
                    <div
                        className="font-body font-bold uppercase"
                        style={{
                            fontSize: 11,
                            color: 'var(--color-text-muted)',
                            lineHeight: 1.2,
                            letterSpacing: 0,
                        }}
                    >
                        {label}
                    </div>
                    <div
                        className="truncate font-heading font-bold"
                        style={{
                            marginTop: 5,
                        fontSize: 21,
                            lineHeight: 1.1,
                            color: toneColor,
                        }}
                    >
                        {value}
                    </div>
                    {sub && (
                        <div
                            className="truncate font-body"
                            style={{
                                marginTop: 3,
                                fontSize: 'var(--font-size-small)',
                                color: 'var(--color-text-muted)',
                            }}
                        >
                            {sub}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
