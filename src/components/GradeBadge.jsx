import { Star, ThumbsUp, CheckCircle, Minus, AlertCircle } from 'lucide-react';

const ICONS = { Star, ThumbsUp, CheckCircle, Minus, AlertCircle };

export default function GradeBadge({ grade, pct, size = 'md' }) {
  const perf = getPerf(pct);
  const Icon = ICONS[perf.icon];

  const sizes = {
    sm: { badge: 'px-2 py-0.5 text-xs gap-1', icon: 12 },
    md: { badge: 'px-3 py-1 text-sm gap-1.5', icon: 14 },
    lg: { badge: 'px-4 py-2 text-base gap-2', icon: 18 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${s.badge} ${perf.bg} ${perf.color}`}>
      <Icon size={s.icon} />
      {grade} — {perf.label}
    </span>
  );
}

function getPerf(pct) {
  if (pct >= 90) return { label: 'Excellent',         icon: 'Star',         color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
  if (pct >= 75) return { label: 'Very Good',         icon: 'ThumbsUp',     color: 'text-teal-600',   bg: 'bg-teal-50 border-teal-200' };
  if (pct >= 60) return { label: 'Good',              icon: 'CheckCircle',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' };
  if (pct >= 45) return { label: 'Average',           icon: 'Minus',        color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' };
  return            { label: 'Needs Improvement', icon: 'AlertCircle',  color: 'text-red-600',    bg: 'bg-red-50 border-red-200' };
}
