import { create } from 'zustand';
import { get as idbGet, set as idbSet, clear as idbClear } from 'idb-keyval';
import { LIMITS, processFile, savePhoto, loadPhoto, pruneOrphans, blobToDataURL, dataURLToBlob } from './photos';
import { EVENT_TYPES } from './themes';
import { uid, eachDay } from './util';

const newDay = (date = '') => ({ id: uid(), date, title: '', place: '', placeNote: '', story: '', photos: [] });

export const blankProject = () => ({
  v: 1,
  eventType: 'travel',
  location: '',
  intro: '',
  dateMode: 'dates', // 'dates' | 'count'
  startDate: '', endDate: '', dayCount: 1,
  title: '', subtitle: '', issue: '', editor: '',
  specialNames: '', mustInclude: '',
  theme: { palette: 'sunset', font: 'editorial', cover: 'full', coverPhoto: null, customPalette: null },
  layoutSeed: 1,
  pageStyle: {},      // pageKey -> chosen layout variant
  days: [],
  unsorted: [],       // photo ids not yet placed in a day
  photos: {},         // id -> { w, h, date, name, caption }
});

function syncDays(p, dates) {
  const old = p.days;
  const next = dates.map((d, i) => {
    const match = d ? old.find((o) => o.date === d) : old[i];
    return match ? { ...match, date: d } : newDay(d);
  });
  const kept = new Set(next.map((d) => d.id));
  old.forEach((o) => { if (!kept.has(o.id)) p.unsorted.push(...o.photos); });
  p.days = next;
}
export function applyDaySetup(p) {
  const dates = p.dateMode === 'dates' ? eachDay(p.startDate, p.endDate) : Array.from({ length: Math.max(1, Math.min(21, p.dayCount || 1)) }, () => '');
  syncDays(p, dates);
}
const removeFromAll = (p, id) => {
  p.unsorted = p.unsorted.filter((x) => x !== id);
  p.days.forEach((d) => { d.photos = d.photos.filter((x) => x !== id); });
};
const place = (p, id, target) => {
  removeFromAll(p, id);
  const day = p.days.find((d) => d.id === target);
  if (day) day.photos.push(id); else p.unsorted.push(id);
};

export const useStore = create((set, get) => ({
  project: blankProject(),
  urls: {},
  past: [], future: [],
  versions: [],
  step: 0,
  ready: false,
  busy: null,       // { done, total }
  notices: [],
  _lastKey: null, _lastAt: 0,

  setStep: (step) => { set({ step }); window.scrollTo({ top: 0 }); },
  dismissNotices: () => set({ notices: [] }),

  commit: (fn, key) => {
    const { project, past, _lastKey, _lastAt } = get();
    const next = structuredClone(project);
    fn(next);
    const now = Date.now();
    const merge = key && key === _lastKey && now - _lastAt < 1500;
    set({ project: next, past: merge ? past : [...past.slice(-59), project], future: [], _lastKey: key || null, _lastAt: now });
  },
  undo: () => { const { past, project, future } = get(); if (!past.length) return; set({ project: past[past.length - 1], past: past.slice(0, -1), future: [project, ...future], _lastKey: null }); },
  redo: () => { const { past, project, future } = get(); if (!future.length) return; set({ project: future[0], future: future.slice(1), past: [...past, project], _lastKey: null }); },

  setField: (patch, key) => get().commit((p) => Object.assign(p, patch), key || 'f:' + Object.keys(patch).join()),
  setTheme: (patch) => get().commit((p) => Object.assign(p.theme, patch)),
  setupDays: (patch) => get().commit((p) => { Object.assign(p, patch); applyDaySetup(p); }, 'days'),
  updateDay: (id, patch) => get().commit((p) => { Object.assign(p.days.find((d) => d.id === id), patch); }, 'day:' + id + Object.keys(patch).join()),
  setCaption: (id, caption) => get().commit((p) => { if (p.photos[id]) p.photos[id].caption = caption; }, 'cap:' + id),
  movePhoto: (id, target) => get().commit((p) => place(p, id, target)),
  removePhoto: (id) => get().commit((p) => { removeFromAll(p, id); delete p.photos[id]; if (p.theme.coverPhoto === id) p.theme.coverPhoto = null; }),
  nextLayoutSeed: () => get().commit((p) => { p.layoutSeed += 1; p.pageStyle = {}; }),
  cycleVariant: (key, current) => get().commit((p) => { p.pageStyle[key] = current + 1; }),
  clearPageStyles: () => get().commit((p) => { p.pageStyle = {}; }),

  photoCount: () => Object.keys(get().project.photos).length,

  // target: a day id, 'unsorted', or 'auto' (sort by the date stored in each photo)
  addPhotos: async (target, fileList) => {
    const files = [...fileList];
    if (!files.length) return;
    const room = LIMITS.maxPhotos - get().photoCount();
    const notes = [];
    const todo = files.slice(0, Math.max(0, room));
    files.slice(todo.length).forEach((f) => notes.push(`${f.name}: not added – the ${LIMITS.maxPhotos}-photo limit was reached`));
    const done = [];
    set({ busy: { done: 0, total: todo.length } });
    for (const f of todo) {
      try {
        const ph = await processFile(f);
        await savePhoto(ph.id, ph.blob);
        done.push({ ...ph, url: URL.createObjectURL(ph.blob) });
      } catch (e) { notes.push(`${f.name}: ${e.message}`); }
      set((s) => ({ busy: { done: s.busy.done + 1, total: s.busy.total } }));
    }
    if (done.length) {
      set((s) => ({ urls: { ...s.urls, ...Object.fromEntries(done.map((d) => [d.id, d.url])) } }));
      get().commit((p) => {
        done.forEach((d) => { p.photos[d.id] = { w: d.w, h: d.h, date: d.date, name: d.name, caption: '' }; });
        if (target !== 'auto') { done.forEach((d) => place(p, d.id, target)); return; }
        const sorted = [...done].sort((a, b) => (a.date || '9').localeCompare(b.date || '9'));
        if (p.dateMode === 'dates') {
          sorted.forEach((d) => {
            if (!d.date) return place(p, d.id, 'unsorted');
            const exact = p.days.find((x) => x.date === d.date);
            const before = [...p.days].reverse().find((x) => x.date <= d.date);
            const target2 = exact || before || p.days[0];
            place(p, d.id, target2 ? target2.id : 'unsorted');
          });
        } else {
          const distinct = [...new Set(sorted.filter((d) => d.date).map((d) => d.date))];
          sorted.forEach((d) => {
            if (!d.date) return place(p, d.id, 'unsorted');
            const idx = Math.min(p.days.length - 1, distinct.indexOf(d.date));
            place(p, d.id, p.days[idx].id);
          });
        }
      }, 'upload' + Date.now());
    }
    set({ busy: null, notices: notes });
  },

  // ---- versions ("save a draft, keep experimenting") ----
  saveVersion: (label) => set((s) => ({ versions: [{ id: uid(), label: label || 'Version ' + (s.versions.length + 1), at: Date.now(), project: structuredClone(s.project) }, ...s.versions].slice(0, 20) })),
  restoreVersion: (id) => { const v = get().versions.find((x) => x.id === id); if (v) get().commit((p) => { Object.keys(p).forEach((k) => delete p[k]); Object.assign(p, structuredClone(v.project)); }); },
  deleteVersion: (id) => set((s) => ({ versions: s.versions.filter((v) => v.id !== id) })),

  // ---- persistence & files ----
  hydrate: async () => {
    try {
      const [project, versions] = await Promise.all([idbGet('project'), idbGet('versions')]);
      const state = {};
      if (project) state.project = { ...blankProject(), ...project, theme: { ...blankProject().theme, ...project.theme } };
      if (versions) state.versions = versions;
      const ids = new Set([...Object.keys(project?.photos || {}), ...(versions || []).flatMap((v) => Object.keys(v.project.photos || {}))]);
      const urls = {};
      for (const id of ids) { const b = await loadPhoto(id); if (b) urls[id] = URL.createObjectURL(b); }
      await pruneOrphans([...ids]);
      set({ ...state, urls, ready: true });
    } catch { set({ ready: true }); }
  },
  persist: async () => {
    const { project, versions } = get();
    try { await Promise.all([idbSet('project', project), idbSet('versions', versions)]); } catch { /* storage full/private mode */ }
  },
  resetAll: async () => {
    await idbClear();
    Object.values(get().urls).forEach((u) => URL.revokeObjectURL(u));
    set({ project: blankProject(), urls: {}, past: [], future: [], versions: [], step: 0, notices: [] });
  },
  exportFile: async () => {
    const { project, versions } = get();
    const ids = Object.keys(project.photos);
    const photos = {};
    for (const id of ids) photos[id] = await blobToDataURL(await loadPhoto(id));
    return new Blob([JSON.stringify({ app: 'memoir', version: 1, project, versions: versions.map((v) => ({ ...v })), photos })], { type: 'application/json' });
  },
  importFile: async (file) => {
    const data = JSON.parse(await file.text());
    if (data.app !== 'memoir' || !data.project) throw new Error('This is not a Memoir project file');
    const ids = Object.keys(data.photos || {});
    if (ids.length > LIMITS.maxPhotos) throw new Error(`This project has ${ids.length} photos; the limit is ${LIMITS.maxPhotos}`);
    const urls = {};
    for (const id of ids) { const b = await dataURLToBlob(data.photos[id]); await savePhoto(id, b); urls[id] = URL.createObjectURL(b); }
    set({ project: { ...blankProject(), ...data.project, theme: { ...blankProject().theme, ...data.project.theme } }, versions: data.versions || [], urls: { ...get().urls, ...urls }, past: [], future: [], step: 1 });
  },
  eventType: () => EVENT_TYPES.find((t) => t.id === get().project.eventType) || EVENT_TYPES[0],
}));

let timer;
useStore.subscribe((s, prev) => {
  if (!s.ready) return;
  if (s.project !== prev.project || s.versions !== prev.versions) {
    clearTimeout(timer);
    timer = setTimeout(() => useStore.getState().persist(), 500);
  }
});
