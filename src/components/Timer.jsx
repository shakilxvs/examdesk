import { Clock } from 'lucide-react';

export default function Timer({ formatted, pct }) {
  const isAmber = pct <= 20 && pct > 10;
  const isRed   = pct <= 10;

  const color = isRed
    ? 'bg-red-50 border-red-200 text-red-600'
    : isAmber
      ? 'bg-amber-50 border-amber-200 text-amber-600'
      : 'bg-teal-50 border-teal-200 text-teal-700';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-semibold text-sm transition-colors ${color} ${isRed ? 'animate-pulse' : ''}`}>
      <Clock size={14} />
      {formatted}
    </div>
  );
}
