import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// jsPDF's built-in helvetica font only supports Latin characters.
// Bengali, Arabic, Devanagari etc. all render as garbage with text-based PDF.
// Fix: render the result card as an image (same as imageExport) and embed
// that image into the PDF — this way the browser handles all font rendering
// and every script/language works perfectly.

const BG_COLORS = {
  'bg-white': '#ffffff', 'bg-gray-50': '#f9fafb', 'bg-gray-100': '#f3f4f6',
  'bg-teal-50': '#f0fdfa', 'bg-teal-600': '#0d9488',
  'bg-green-50': '#f0fdf4', 'bg-green-500': '#22c55e',
  'bg-red-50': '#fef2f2', 'bg-red-400': '#f87171',
  'bg-amber-50': '#fffbeb',
};
const TEXT_COLORS = {
  'text-white': '#ffffff', 'text-gray-400': '#9ca3af', 'text-gray-500': '#6b7280',
  'text-gray-800': '#1f2937', 'text-gray-900': '#111827',
  'text-teal-100': '#ccfbf1', 'text-teal-200': '#99f6e4', 'text-teal-600': '#0d9488',
  'text-teal-700': '#0f766e', 'text-green-700': '#15803d', 'text-red-600': '#dc2626',
  'text-amber-700': '#b45309',
};
const BORDER_COLORS = {
  'border-gray-100': '#f3f4f6', 'border-gray-200': '#e5e7eb',
  'border-teal-200': '#99f6e4', 'border-green-200': '#bbf7d0',
  'border-red-200': '#fecaca', 'border-amber-200': '#fde68a',
};

function applyInlineColors(root) {
  root.querySelectorAll('*').forEach(el => {
    el.classList.forEach(cls => {
      if (BG_COLORS[cls])     el.style.backgroundColor = BG_COLORS[cls];
      if (TEXT_COLORS[cls])   el.style.color            = TEXT_COLORS[cls];
      if (BORDER_COLORS[cls]) el.style.borderColor      = BORDER_COLORS[cls];
    });
    if (el.classList.contains('bg-white/20'))
      el.style.backgroundColor = 'rgba(255,255,255,0.2)';
  });
}

function buildResultHTML(data) {
  const {
    examTitle = '', schoolName = '', teacherName = '',
    studentName = '', rollNo = '', score = 0, totalMarks = 0,
    percentage = 0, grade = '', timeTaken = '', submittedAt = '',
    violations = 0, questions = [], answers = [],
  } = data;

  const pct = Math.round(percentage);
  const r = 72, cx = 90, cy = 90, stroke = 14;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;

  const donutSVG = `
    <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="${stroke}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#0d9488" stroke-width="${stroke}"
        stroke-dasharray="${dash} ${circumference}" stroke-dashoffset="${circumference / 4}"
        stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="26" font-weight="700"
        font-family="sans-serif" fill="#111827">${pct}%</text>
      <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="12"
        font-family="sans-serif" fill="#9ca3af">Score</text>
    </svg>`;

  const qRows = questions.map((q, i) => {
    const ans = answers[i];
    const correct = ans?.correct;
    const studentAns = ans?.studentAnswer;
    let answerText = q.type === 'mcq'
      ? (Array.isArray(studentAns) && studentAns.length > 0
          ? studentAns.map(idx => q.options?.[idx]).filter(Boolean).join(', ')
          : 'None')
      : (studentAns || '(no answer)');
    const bg = correct ? '#f0fdf4' : '#fef2f2';
    const border = correct ? '#bbf7d0' : '#fecaca';
    const dot = correct ? '#22c55e' : '#f87171';
    return `
      <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;
                  background:${bg};border:1px solid ${border};border-radius:12px;margin-bottom:8px;">
        <div style="width:20px;height:20px;border-radius:50%;background:${dot};color:#fff;
                    font-size:11px;font-weight:700;display:flex;align-items:center;
                    justify-content:center;flex-shrink:0;margin-top:2px;">
          ${correct ? '✓' : '✗'}
        </div>
        <div style="flex:1;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#1f2937;">Q${i + 1}. ${q.text}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">
            <span style="font-weight:600;">Your answer:</span> ${answerText}
          </p>
          ${!correct && q.type === 'mcq' ? `
          <p style="margin:2px 0 0;font-size:12px;color:#15803d;">
            <span style="font-weight:600;">Correct:</span>
            ${(q.correct_indices || []).map(idx => q.options?.[idx]).filter(Boolean).join(', ')}
          </p>` : ''}
        </div>
        <span style="font-size:12px;font-weight:700;color:#6b7280;flex-shrink:0;">
          ${ans?.marksAwarded || 0}/${q.marks}
        </span>
      </div>`;
  }).join('');

  const statBox = (label, value) => `
    <div style="flex:1;background:#f9fafb;border-radius:12px;padding:10px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;font-weight:600;">${label}</p>
      <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#111827;">${value}</p>
    </div>`;

  const perfLabel = pct >= 90 ? 'Excellent' : pct >= 75 ? 'Very Good' : pct >= 60 ? 'Good' : pct >= 40 ? 'Pass' : 'Fail';

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                background:#f3f4f6;padding:24px;width:600px;">
      <div style="background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <div style="background:#0d9488;padding:28px 32px 24px;color:#fff;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:28px;height:28px;background:rgba(255,255,255,0.2);border-radius:8px;
                          display:flex;align-items:center;justify-content:center;font-size:14px;">✓</div>
              <span style="font-weight:800;font-size:17px;">ExamDesk</span>
            </div>
            ${schoolName ? `<span style="font-size:13px;color:#ccfbf1;">${schoolName}</span>` : ''}
          </div>
          <h1 style="margin:0;font-size:20px;font-weight:800;">${examTitle}</h1>
          ${teacherName ? `<p style="margin:4px 0 0;font-size:13px;color:#99f6e4;">by ${teacherName}</p>` : ''}
        </div>
        <div style="padding:28px 32px;">
          <div style="text-align:center;margin-bottom:24px;">
            <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:.08em;text-transform:uppercase;">Student</p>
            <h2 style="margin:6px 0 0;font-size:30px;font-weight:800;color:#111827;">${studentName}</h2>
            ${rollNo ? `<p style="margin:4px 0 0;font-size:13px;color:#9ca3af;">Roll: ${rollNo}</p>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:20px;">
            ${donutSVG}
            <div style="text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:800;color:#111827;">
                ${score} <span style="color:#d1d5db;">/</span> ${totalMarks}
              </p>
              <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">marks</p>
            </div>
            <div style="display:inline-flex;align-items:center;gap:6px;background:#fffbeb;
                        border:1px solid #fde68a;border-radius:999px;padding:6px 18px;">
              <span>⭐</span>
              <span style="font-size:15px;font-weight:700;color:#b45309;">${grade} — ${perfLabel}</span>
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-bottom:24px;">
            ${statBox('Time Taken', timeTaken || '—')}
            ${statBox('Submitted', submittedAt?.split(',')[0] || '—')}
            ${statBox('Violations', violations ?? 0)}
          </div>
          <h3 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111827;">Question Breakdown</h3>
          ${qRows}
        </div>
        <div style="padding:14px 32px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Generated by <span style="font-weight:700;color:#0d9488;">ExamDesk</span> — Free forever.
          </p>
        </div>
      </div>
    </div>`;
}

export async function exportResultPDF(data) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
  container.innerHTML = buildResultHTML(data);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 2,
      backgroundColor: '#f3f4f6',
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgW = canvas.width;
    const imgH = canvas.height;

    // A4 = 210mm wide. Scale image to fit width, add pages for height.
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = pageW / (imgW / 2); // divide by scale factor
    const renderedH = (imgH / 2) * ratio;

    if (renderedH <= pageH) {
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, renderedH);
    } else {
      // Tall result (many questions) — split across pages
      const pageImgH = pageH / ratio;
      let srcY = 0;
      let firstPage = true;
      while (srcY < imgH / 2) {
        if (!firstPage) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -(srcY * ratio), pageW, renderedH);
        srcY += pageImgH;
        firstPage = false;
      }
    }

    const safeName = data.studentName ? data.studentName.replace(/\s+/g, '_') : 'Student';
    pdf.save(`ExamDesk_Result_${safeName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
