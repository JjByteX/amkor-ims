import { ExternalLink } from 'lucide-react';
import * as Icons from 'lucide-react';

/**
 * DashboardKpiCard
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a single KPI tile on the dashboard.
 *
 * Props:
 *  label       string  — e.g. "Payable balance"
 *  value       any     — e.g. "PHP 12,000.00" | 42
 *  icon        string  — lucide icon name, PascalCase
 *  tone        string  — "default" | "primary" | "warning" | "danger" | "success"
 *  sub         string? — small sub-label
 *  href        string? — link target
 *  accentColor string  — hex, for "primary" tone
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TONE_CLASSES = {
  default: 'kpi-tone-default',
  primary: 'kpi-tone-primary',
  warning: 'kpi-tone-warning',
  danger:  'kpi-tone-danger',
  success: 'kpi-tone-success',
};

export default function DashboardKpiCard({
  label,
  value,
  icon = 'ClipboardList',
  tone = 'default',
  sub,
  href,
  accentColor,
}) {
  const IconComp = Icons[icon] ?? Icons.ClipboardList;
  const toneClass = TONE_CLASSES[tone] ?? TONE_CLASSES.default;

  const inner = (
    <div
      className={`kpi-card ${toneClass}`}
      style={tone === 'primary' && accentColor ? { '--kpi-accent': accentColor } : undefined}
    >
      <div className="kpi-icon-wrap">
        <IconComp size={20} strokeWidth={1.75} />
      </div>
      <div className="kpi-body">
        <span className="kpi-label">{label}</span>
        <span className="kpi-value">{value ?? '—'}</span>
        {sub && <span className="kpi-sub">{sub}</span>}
      </div>
      {href && (
        <ExternalLink size={12} className="kpi-link-icon" />
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="kpi-card-link">
        {inner}
      </a>
    );
  }
  return inner;
}
