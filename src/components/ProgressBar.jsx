export default function ProgressBar({ answered, total, label }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="w-full">
      {label !== false && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-500 font-medium">{label || 'Progress'}</span>
          <span className="text-xs font-semibold text-gray-700">{answered}/{total} answered</span>
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
