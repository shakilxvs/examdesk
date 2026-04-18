import { useEffect, useState } from 'react';

export default function ResultDonut({ percentage, size = 160 }) {
  const [animated, setAnimated] = useState(0);
  const radius = (size - 20) / 2;
  const circ = 2 * Math.PI * radius;
  const cx = size / 2;
  const pct = Math.min(100, Math.max(0, percentage));

  useEffect(() => {
    const start = Date.now();
    const duration = 1200;
    const raf = (fn) => requestAnimationFrame(fn);
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const frame = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnimated(ease(progress) * pct);
      if (progress < 1) raf(frame);
    };
    raf(frame);
  }, [pct]);

  const offset = circ - (animated / 100) * circ;

  const color =
    pct >= 75 ? '#0d9488' :
    pct >= 50 ? '#3b82f6' :
    pct >= 33 ? '#f59e0b' :
    '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx} cy={cx} r={radius}
          fill="none" stroke="#f1f5f9" strokeWidth={12}
        />
        {/* Progress */}
        <circle
          cx={cx} cy={cx} r={radius}
          fill="none" stroke={color} strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-3xl text-gray-900 leading-none">
          {Math.round(animated)}%
        </span>
        <span className="text-xs text-gray-400 font-medium mt-0.5">Score</span>
      </div>
    </div>
  );
}
