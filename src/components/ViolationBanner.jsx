import { AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ViolationBanner({ count, message, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [count]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium max-w-sm">
        <AlertTriangle size={16} className="flex-shrink-0" />
        <span>{message || `Violation detected! (${count} total)`}</span>
        <button
          onClick={() => { setVisible(false); onDismiss?.(); }}
          className="ml-1 p-0.5 hover:bg-red-500 rounded"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
