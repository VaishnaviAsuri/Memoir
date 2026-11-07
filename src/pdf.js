import { jsPDF } from 'jspdf';
import { toJpeg, getFontEmbedCSS } from 'html-to-image';
import { PW, PH } from './Magazine';

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Turns each on-screen page into a high-resolution picture and stacks them into an A4 PDF.
// Everything happens in this browser tab; nothing is uploaded.
export async function exportPdf(nodes, { scale = 2, onProgress }) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const fontEmbedCSS = await getFontEmbedCSS(nodes[0]);
  const opts = { quality: 0.92, pixelRatio: scale, width: PW, height: PH, style: { transform: 'none' }, fontEmbedCSS };
  for (let i = 0; i < nodes.length; i++) {
    if (isSafari) await toJpeg(nodes[i], opts); // Safari needs a warm-up render before images appear
    const data = await toJpeg(nodes[i], opts);
    if (i > 0) pdf.addPage();
    pdf.addImage(data, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    onProgress?.(i + 1, nodes.length);
    await new Promise((r) => setTimeout(r, 0));
  }
  return pdf.output('blob');
}

export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
