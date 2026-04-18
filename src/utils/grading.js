/**
 * Grading systems for ExamDesk
 */

export const BD_GRADES = [
  { grade: 'A+', label: 'A+', min: 80, max: 100, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { grade: 'A',  label: 'A',  min: 70, max: 79,  color: 'text-teal-600',    bg: 'bg-teal-50 border-teal-200' },
  { grade: 'A-', label: 'A-', min: 60, max: 69,  color: 'text-cyan-600',    bg: 'bg-cyan-50 border-cyan-200' },
  { grade: 'B',  label: 'B',  min: 50, max: 59,  color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
  { grade: 'C',  label: 'C',  min: 40, max: 49,  color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200' },
  { grade: 'D',  label: 'D',  min: 33, max: 39,  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
  { grade: 'F',  label: 'F',  min: 0,  max: 32,  color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
];

export const INTL_GRADES = [
  { grade: 'A', label: 'A', min: 90, max: 100, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { grade: 'B', label: 'B', min: 75, max: 89,  color: 'text-teal-600',    bg: 'bg-teal-50 border-teal-200' },
  { grade: 'C', label: 'C', min: 60, max: 74,  color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
  { grade: 'D', label: 'D', min: 45, max: 59,  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
  { grade: 'F', label: 'F', min: 0,  max: 44,  color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
];

export function calculateGrade(percentage, system = 'bd') {
  const table = system === 'bd' ? BD_GRADES : INTL_GRADES;
  const pct = Math.max(0, Math.min(100, percentage));
  return table.find(g => pct >= g.min && pct <= g.max) || table[table.length - 1];
}

export function getPerformanceLabel(pct) {
  if (pct >= 90) return { label: 'Excellent', icon: 'Star', color: 'text-yellow-500' };
  if (pct >= 75) return { label: 'Very Good', icon: 'ThumbsUp', color: 'text-teal-600' };
  if (pct >= 60) return { label: 'Good', icon: 'CheckCircle', color: 'text-blue-600' };
  if (pct >= 45) return { label: 'Average', icon: 'Minus', color: 'text-amber-600' };
  return { label: 'Needs Improvement', icon: 'AlertCircle', color: 'text-red-500' };
}
