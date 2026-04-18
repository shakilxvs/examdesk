/**
 * General helper utilities for ExamDesk
 */

export function formatDate(timestamp) {
  if (!timestamp) return '—';
  const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '—';
  const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function getInitials(name) {
  if (!name) return 'T';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(name) {
  const colors = [
    'bg-teal-500', 'bg-indigo-500', 'bg-violet-500',
    'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
    'bg-emerald-500', 'bg-pink-500',
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
}

export const ROOM_COLORS = [
  { label: 'Teal', value: 'teal', bg: 'bg-teal-500', light: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
  { label: 'Indigo', value: 'indigo', bg: 'bg-indigo-500', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  { label: 'Violet', value: 'violet', bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  { label: 'Rose', value: 'rose', bg: 'bg-rose-500', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  { label: 'Amber', value: 'amber', bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  { label: 'Cyan', value: 'cyan', bg: 'bg-cyan-500', light: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
  { label: 'Emerald', value: 'emerald', bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { label: 'Pink', value: 'pink', bg: 'bg-pink-500', light: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
];

export function getRoomColor(value) {
  return ROOM_COLORS.find(c => c.value === value) || ROOM_COLORS[0];
}

export function friendlyFirebaseError(code) {
  const map = {
    'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Incorrect email or password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

export function generatePin(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

export function getExamLink(examId) {
  return `${window.location.origin}/exam/${examId}`;
}
