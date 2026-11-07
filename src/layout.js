import { fmtDate, fmtRange } from './util';
import { EVENT_TYPES } from './themes';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Grid layouts for N photos on a page. Each is a CSS grid-template-areas recipe.
export const LAYOUTS = {
  1: [{ hero: true, areas: ['a'], cols: '1fr', rows: '1fr' }, { areas: ['a'], cols: '1fr', rows: '1fr' }],
  2: [
    { areas: ['a', 'b'], cols: '1fr', rows: '1.35fr 1fr' },
    { areas: ['a b'], cols: '1.3fr 1fr', rows: '1fr' },
    { areas: ['a a b', 'a a b'], cols: '1fr 1fr 1fr', rows: '1fr 1fr' },
  ],
  3: [
    { areas: ['a a', 'b c'], cols: '1fr 1fr', rows: '1.5fr 1fr' },
    { areas: ['a b', 'a c'], cols: '1.4fr 1fr', rows: '1fr 1fr' },
    { areas: ['a b c'], cols: '1fr 1fr 1fr', rows: '1fr' },
  ],
  4: [
    { areas: ['a a', 'b c', 'd d'], cols: '1fr 1fr', rows: '1.2fr 1fr 1fr' },
    { areas: ['a b', 'c d'], cols: '1fr 1fr', rows: '1fr 1fr' },
    { areas: ['a b b', 'a c d'], cols: '1fr 1fr 1fr', rows: '1.2fr 1fr' },
  ],
  5: [
    { areas: ['a a b', 'c d b', 'c e e'], cols: '1fr 1fr 1fr', rows: '1fr 1fr 1fr' },
    { areas: ['a a', 'b c', 'd e'], cols: '1fr 1fr', rows: '1.3fr 1fr 1fr' },
  ],
  6: [
    { areas: ['a a b', 'a a c', 'd e f'], cols: '1fr 1fr 1fr', rows: '1fr 1fr 1fr' },
    { areas: ['a b', 'c d', 'e f'], cols: '1fr 1fr', rows: '1fr 1fr 1fr' },
  ],
};
const CHUNKS = [3, 4, 2, 5, 3, 6, 2, 4, 1, 3];
const DECOS = ['plain', 'polaroid', 'rounded', 'frame', 'polaroid', 'plain'];

const sentences = (t) => (t || '').replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [];
function splitLong(s, max) {
  if (s.length <= max) return [s];
  const out = []; let cur = '';
  s.split(' ').forEach((w) => { if ((cur + ' ' + w).length > max) { out.push(cur.trim()); cur = w; } else cur += ' ' + w; });
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function chunkCounts(count, r) {
  const out = []; let rem = count, last = 0, i = Math.floor(r() * CHUNKS.length);
  while (rem > 0) {
    let s, tries = 0;
    do { s = CHUNKS[i % CHUNKS.length]; i++; tries++; } while ((s > rem || (s === last && rem > s)) && tries < 20);
    if (s > rem) s = rem;
    out.push(s); rem -= s; last = s;
  }
  return out;
}

// Spread a day's story across its pages by character budget; leftovers become a text page.
function spreadText(story, slots, budgetOf) {
  const sents = sentences(story).flatMap((s) => splitLong(s.trim(), 420));
  const parts = slots.map(() => '');
  if (!sents.length) return { parts, rest: '' };
  const total = sents.join(' ').length;
  let idx = 0;
  const w = slots.map((s) => (s === 'opener' ? 2 : 1));
  const sumW = w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < slots.length && idx < sents.length; i++) {
    const cap = Math.min(budgetOf(slots[i]), Math.ceil((total * w[i]) / sumW) + 40);
    let cur = '';
    while (idx < sents.length && (!cur || (cur + ' ' + sents[idx]).length <= cap)) { cur = (cur + ' ' + sents[idx]).trim(); idx++; }
    parts[i] = cur;
  }
  let rest = sents.slice(idx).join(' ');
  if (rest && rest.length < 160) { parts[parts.length - 1] = (parts[parts.length - 1] + ' ' + rest).trim(); rest = ''; }
  return { parts, rest };
}

export function buildPages(project) {
  const type = EVENT_TYPES.find((t) => t.id === project.eventType) || EVENT_TYPES[0];
  const dayWord = type.dayWord;
  const pages = [];
  const photoIds = project.days.flatMap((d) => d.photos).filter((id) => project.photos[id]);
  const manyDays = project.days.length > 1;

  const names = (project.specialNames || '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  const musts = (project.mustInclude || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const dateText = project.dateMode === 'dates' ? fmtRange(project.startDate, project.endDate) : '';

  const coverId = project.theme.coverPhoto && project.photos[project.theme.coverPhoto] ? project.theme.coverPhoto : photoIds[0];
  const coverIds = [coverId, ...photoIds.filter((x) => x !== coverId)].filter(Boolean).slice(0, 5);
  pages.push({ key: 'cover', kind: 'cover', coverIds, names, dateText });

  const contentsIdx = manyDays ? pages.push({ key: 'contents', kind: 'contents', entries: [] }) - 1 : -1;
  if (project.intro.trim()) pages.push({ key: 'letter', kind: 'letter' });
  if (names.length) pages.push({ key: 'crew', kind: 'crew', names });

  project.days.forEach((day, di) => {
    const r = rng(project.layoutSeed * 7919 + di * 101 + 13);
    const ids = day.photos.filter((id) => project.photos[id]);
    const kicker = `${dayWord} ${di + 1}${day.date ? ' · ' + fmtDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' }) : ''}`;
    const heading = day.place || day.title || `${dayWord} ${di + 1}`;

    const openerPhoto = ids[0];
    const restIds = ids.slice(1);
    const counts = chunkCounts(restIds.length, r);
    const slots = ['opener', ...counts];
    const { parts, rest } = spreadText(day.story, slots, (s) => (s === 'opener' ? 560 : s >= 5 ? 160 : s >= 3 ? 300 : 380));
    const sents = sentences(day.story);

    pages.push({ key: `d${di}-open`, kind: 'opener', day: di, id: openerPhoto, kicker, title: day.title || `${dayWord} ${di + 1}`, place: day.place, text: parts[0], num: di + 1, dayWord });
    if (day.placeNote && day.placeNote.trim()) pages.push({ key: `d${di}-place`, kind: 'place', day: di, place: day.place || day.title || `${dayWord} ${di + 1}`, text: day.placeNote.trim(), ids: [] });

    let cursor = 0, prevDeco = '';
    counts.forEach((n, pi) => {
      const key = `d${di}-p${pi}`;
      const variants = LAYOUTS[n];
      const base = Math.floor(r() * variants.length);
      const variant = (base + (project.pageStyle[key] || 0)) % variants.length;
      let deco = DECOS[Math.floor(r() * DECOS.length)];
      if (deco === prevDeco) deco = DECOS[(DECOS.indexOf(deco) + 1) % DECOS.length];
      prevDeco = deco;
      const group = restIds.slice(cursor, cursor + n); cursor += n;
      const layout = variants[variant];
      pages.push({ key, kind: 'photos', day: di, ids: group, layout, variant, nVariants: variants.length, deco, textPos: r() > 0.5 ? 'top' : 'bottom', kicker, heading, text: parts[pi + 1] || '', hasCaption: group.some((g) => project.photos[g].caption) });
    });
    if (rest) pages.push({ key: `d${di}-story`, kind: 'story', day: di, kicker, title: day.title || heading, text: rest });
    if (sents.length >= 4) {
      const good = sents.map((s) => s.trim()).filter((s) => s.length > 40 && s.length < 150);
      if (good.length) pages.push({ key: `d${di}-quote`, kind: 'quote', day: di, kicker, text: good[Math.floor(r() * good.length)] });
    }
  });

  for (let i = 0; i < musts.length; i += 8) pages.push({ key: `hl${i}`, kind: 'highlights', items: musts.slice(i, i + 8), first: i === 0 });
  pages.push({ key: 'back', kind: 'back', dateText, names });

  pages.forEach((p, i) => { p.num = p.kind === 'opener' ? p.num : undefined; p.pageNo = i + 1; });
  if (contentsIdx >= 0) {
    pages[contentsIdx].entries = pages.filter((p) => p.kind === 'opener').map((p) => ({ title: p.title, kicker: p.kicker, pageNo: p.pageNo }));
  }
  void dateText;
  return pages;
}
