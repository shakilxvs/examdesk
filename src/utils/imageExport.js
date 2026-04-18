import html2canvas from 'html2canvas';

export async function exportResultImage(elementId, filename = 'ExamDesk_Result') {
  const el = document.getElementById(elementId);
  if (!el) return;
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
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
