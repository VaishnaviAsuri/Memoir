export const MAX_DAYS = 21;
export const uid = () => Math.random().toString(36).slice(2, 10);
export const slug = (s) => (s || 'magazine').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'magazine';
export const parseISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
export const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function eachDay(start, end) {
  if (!start) return [];
  const s = parseISO(start);
  const e = end ? parseISO(end) : s;
  const out = [];
  for (let d = new Date(s); d <= e && out.length < MAX_DAYS; d.setDate(d.getDate() + 1)) out.push(toISO(d));
  return out;
}
export const fmtDate = (iso, o = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? parseISO(iso).toLocaleDateString(undefined, o) : '';
export function fmtRange(a, b) {
  if (!a) return '';
  if (!b || a === b) return fmtDate(a, { day: 'numeric', month: 'long', year: 'numeric' });
  const o = { day: 'numeric', month: 'short' };
  return `${fmtDate(a, o)} – ${fmtDate(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

// --- colour helpers (WCAG contrast) ---
function rgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum(hex) {
  const [r, g, b] = rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
export function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
export const autoInk = (bg) => (contrast('#161616', bg) > contrast('#ffffff', bg) ? '#161616' : '#ffffff');

export function mixHex(a, b, t) {
  const x = rgb(a), y = rgb(b);
  return '#' + x.map((v, i) => Math.round(v * (1 - t) + y[i] * t).toString(16).padStart(2, '0')).join('');
}
