/**
 * Smart answer matching engine for CQ (written) questions
 */

export function normalizeAnswer(raw) {
  if (raw === null || raw === undefined) return '';
  let s = String(raw).trim().toLowerCase();
  // Normalize whitespace
  s = s.replace(/\s+/g, ' ');
  // Remove trailing/leading punctuation
  s = s.replace(/^[.,;:!?]+|[.,;:!?]+$/g, '');
  // Fraction to decimal
  if (/^\d+\/\d+$/.test(s)) {
    const [n, d] = s.split('/').map(Number);
    if (d !== 0) s = String(n / d);
  }
  // Float normalization: "50.0" → "50"
  const asFloat = parseFloat(s);
  if (!isNaN(asFloat) && String(asFloat) === s.replace(/\.?0+$/, '')) {
    s = String(asFloat);
  }
  return s;
}

export function isAnswerCorrect(studentAnswer, acceptedAnswers) {
  if (!acceptedAnswers || acceptedAnswers.length === 0) return false;
  const norm = normalizeAnswer(studentAnswer);
  if (!norm) return false;
  return acceptedAnswers.some((a) => normalizeAnswer(a) === norm);
}

export function parseAcceptedAnswers(raw) {
  // Teacher enters comma-separated variants: "dhaka, Dhaka, ঢাকা"
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
