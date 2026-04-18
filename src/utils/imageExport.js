import html2canvas from 'html2canvas';

// html2canvas doesn't reliably render Tailwind CSS utility classes (it misses
// background colours, border colours, and text colours that come from class names).
// The fix: use the onclone callback to walk the cloned DOM and stamp every
// Tailwind colour class as an equivalent inline style before the screenshot is taken.

const BG_COLORS = {
  'bg-white':       '#ffffff',
  'bg-gray-50':     '#f9fafb',
  'bg-gray-100':    '#f3f4f6',
  'bg-teal-50':     '#f0fdfa',
  'bg-teal-600':    '#0d9488',
  'bg-green-50':    '#f0fdf4',
  'bg-green-500':   '#22c55e',
  'bg-red-50':      '#fef2f2',
  'bg-red-400':     '#f87171',
  'bg-amber-50':    '#fffbeb',
  'bg-amber-500':   '#f59e0b',
  'bg-blue-50':     '#eff6ff',
  'bg-violet-50':   '#f5f3ff',
  'bg-indigo-50':   '#eef2ff',
};

const TEXT_COLORS = {
  'text-white':       '#ffffff',
  'text-gray-400':    '#9ca3af',
  'text-gray-500':    '#6b7280',
  'text-gray-800':    '#1f2937',
  'text-gray-900':    '#111827',
  'text-teal-100':    '#ccfbf1',
  'text-teal-200':    '#99f6e4',
  'text-teal-600':    '#0d9488',
  'text-teal-700':    '#0f766e',
  'text-green-700':   '#15803d',
  'text-red-600':     '#dc2626',
  'text-amber-700':   '#b45309',
  'text-blue-700':    '#1d4ed8',
};

const BORDER_COLORS = {
  'border-gray-100':   '#f3f4f6',
  'border-gray-200':   '#e5e7eb',
  'border-teal-200':   '#99f6e4',
  'border-green-200':  '#bbf7d0',
  'border-red-200':    '#fecaca',
  'border-amber-200':  '#fde68a',
};

function applyInlineColors(root) {
  const all = root.querySelectorAll('*');
  all.forEach(el => {
    const classes = Array.from(el.classList);

    classes.forEach(cls => {
      if (BG_COLORS[cls])     el.style.backgroundColor = BG_COLORS[cls];
      if (TEXT_COLORS[cls])   el.style.color            = TEXT_COLORS[cls];
      if (BORDER_COLORS[cls]) el.style.borderColor      = BORDER_COLORS[cls];
    });

    // white/20 overlay used on teal header icons — make it explicit
    if (classes.includes('bg-white/20')) {
      el.style.backgroundColor = 'rgba(255,255,255,0.2)';
    }
  });
}

export async function exportResultImage(elementId, filename = 'ExamDesk_Result') {
  const el = document.getElementById(elementId);
  if (!el) return;

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      onclone: (_clonedDoc, clonedEl) => {
        applyInlineColors(clonedEl);
      },
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('Image export failed:', err);
    throw err;
  }
}
