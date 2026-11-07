import exifr from 'exifr';
import { get, set, del, keys } from 'idb-keyval';
import { uid, toISO, hslToHex } from './util';

// ---- Limits shown to the user on the very first screen ----
export const LIMITS = {
  maxPhotos: 60,      // total photos per magazine
  maxFileMB: 25,      // per original file
  maxEdge: 1800,      // photos are shrunk (on this device) to this many pixels on the long edge
  quality: 0.86,
};
export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

const loadImg = (url) => new Promise((res, rej) => {
  const i = new Image();
  i.onload = () => res(i);
  i.onerror = () => rej(new Error('This file could not be read as a picture'));
  i.src = url;
});

export async function processFile(file) {
  const looksHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (looksHeic) throw new Error('HEIC format is not supported by this browser – on iPhone pick the photo from Photos (it converts automatically) or use Most Compatible in Camera settings');
  if (!file.type.startsWith('image/') || (file.type && !ACCEPTED.includes(file.type))) throw new Error('Not a supported picture type (use JPG, PNG or WebP)');
  if (file.size > LIMITS.maxFileMB * 1024 * 1024) throw new Error(`Larger than ${LIMITS.maxFileMB} MB`);

  let date = null;
  try {
    const ex = await exifr.parse(file, { pick: ['DateTimeOriginal', 'CreateDate'] });
    const d = ex && (ex.DateTimeOriginal || ex.CreateDate);
    if (d instanceof Date && !isNaN(d)) date = toISO(d);
  } catch { /* no EXIF – fine */ }
  if (!date && file.lastModified && /^(IMG|PXL|DSC|PHOTO|\d{8})/i.test(file.name)) date = null; // don't trust file dates

  const src = URL.createObjectURL(file);
  try {
    const img = await loadImg(src);
    const scale = Math.min(1, LIMITS.maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', LIMITS.quality));
    c.width = c.height = 0; // free memory (important on phones)
    if (!blob) throw new Error('Could not compress this picture');
    return { id: uid() + uid(), w, h, date, name: file.name, blob };
  } finally {
    URL.revokeObjectURL(src);
  }
}

// ---- storage: blobs live in this browser's IndexedDB, never on a server ----
export const savePhoto = (id, blob) => set('photo:' + id, blob);
export const loadPhoto = (id) => get('photo:' + id);
export async function pruneOrphans(keepIds) {
  const keep = new Set(keepIds);
  for (const k of await keys()) {
    if (typeof k === 'string' && k.startsWith('photo:') && !keep.has(k.slice(6))) await del(k);
  }
}
export const blobToDataURL = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
export const dataURLToBlob = async (u) => (await fetch(u)).blob();

// ---- build a palette from the dominant colours of a picture ----
export async function paletteFromImage(url) {
  const img = await loadImg(url);
  const c = document.createElement('canvas');
  c.width = c.height = 48;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, 48, 48);
  const { data } = ctx.getImageData(0, 0, 48, 48);
  const buckets = new Array(12).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    const l = (mx + mn) / 2;
    if (d < 0.12 || l < 0.12 || l > 0.9) continue;
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    buckets[Math.floor(h / 30)] += s;
  }
  const order = buckets.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
  const h1 = order[0][0] > 0 ? order[0][1] * 30 + 15 : 210;
  let h2 = order[1][0] > 0 ? order[1][1] * 30 + 15 : (h1 + 40) % 360;
  if (Math.abs(h2 - h1) < 25) h2 = (h1 + 150) % 360;
  return {
    bg: hslToHex(h1, 45, 96), ink: hslToHex(h1, 35, 12), accent: hslToHex(h1, 58, 36),
    accent2: hslToHex(h2, 75, 62), soft: hslToHex(h1, 45, 88),
  };
}
