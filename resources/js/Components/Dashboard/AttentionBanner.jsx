import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

/**
 * AttentionBanner
 * ─────────────────────────────────────────────────────────────────────────────
 * Displays attention-required items from dashboardSections.
 * Groups by section and renders compact inline badges.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TONE_ICON = {
  warning: AlertTriangle,
  danger:  AlertCircle,
  info:    Info,
};

const TONE_CLASS = {
  warning: 'attn-warning',
  danger:  'attn-danger',
  info:    'attn-info',
};

export default function AttentionBanner({ sections = [], watchSections = [] }) {
  // Collect all attention items from the sections we care about
  const items = sections
    .filter((s) => watchSections.length === 0 || watchSections.includes(s.key))
    .flatMap((s) =>
      (s.attention ?? [])
        .filter((a) => a.value > 0)
        .map((a) => ({ ...a, sectionLabel: s.label }))
    );

  if (items.length === 0) return null;

  return (
    <div className="attn-banner">
      {items.map((item, i) => {
        const tone = item.tone ?? 'warning';
        const Icon = TONE_ICON[tone] ?? AlertTriangle;
        const cls  = TONE_CLASS[tone] ?? 'attn-warning';

        const inner = (
          <span key={i} className={`attn-item ${cls}`}>
            <Icon size={13} strokeWidth={2} />
            <span className="attn-item-value">{item.value}</span>
            <span className="attn-item-label">{item.label}</span>
          </span>
        );

        return item.href
          ? <a key={i} href={item.href} className="attn-link">{inner}</a>
          : inner;
      })}
    </div>
  );
}
