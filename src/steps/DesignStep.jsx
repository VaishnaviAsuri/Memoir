import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { EVENT_TYPES, PALETTES, FONTS, COVERS, getPalette, customPalette } from '../themes';
import { paletteFromImage } from '../photos';
import { contrast, fmtDate } from '../util';
import { buildPages } from '../layout';
import { Scaled } from '../Magazine';

export default function DesignStep() {
  const { project: p, urls, setField, setTheme, setStep } = useStore();
  const type = EVENT_TYPES.find((t) => t.id === p.eventType) || EVENT_TYPES[0];
  const pal = getPalette(p.theme);
  const [busy, setBusy] = useState(false);
  const allIds = p.days.flatMap((d) => d.photos).concat(p.unsorted).filter((id) => p.photos[id]);
  const ctx = { project: p, urls };

  const coverPage = useMemo(() => buildPages(p)[0], [p]);
  const withCover = (cover) => ({ ...p, theme: { ...p.theme, cover } });

  const ideas = type.titles.filter((t) => p.location || !t.includes('{p}')).map((t) => t.replace('{p}', (p.location || '').split(',')[0].trim())).slice(0, 5);
  const warn = contrast(pal.ink, pal.bg) < 4.5 ? 'Text may be hard to read on this background.' : contrast(pal.accent, pal.bg) < 3 ? 'Accent colour is faint against the background; headings may be hard to read.' : '';
  const cp = p.theme.customPalette || { bg: pal.bg, accent: pal.accent, accent2: pal.accent2 };

  const matchPhoto = async () => {
    const id = p.theme.coverPhoto && p.photos[p.theme.coverPhoto] ? p.theme.coverPhoto : allIds[0];
    if (!id) return;
    setBusy(true);
    try { setTheme({ palette: 'custom', customPalette: await paletteFromImage(urls[id]) }); } finally { setBusy(false); }
  };
  const setCustom = (patch) => setTheme({ palette: 'custom', customPalette: customPalette(patch.bg || cp.bg, patch.accent || cp.accent, patch.accent2 || cp.accent2) });

  return (
    <section className="design">
      <div className="design-main">
        <h2>Make it yours</h2>

        <div className="block">
          <h3>Names &amp; words</h3>
          <label className="field"><span>Magazine title</span>
            <input value={p.title} onChange={(e) => setField({ title: e.target.value })} placeholder="e.g. Goa Diaries" />
            {ideas.length > 0 && <div className="chips"><em>Ideas:</em>{ideas.map((t) => <button key={t} type="button" onClick={() => setField({ title: t })}>{t}</button>)}</div>}
          </label>
          <div className="row">
            <label className="field"><span>Tagline <em>(optional)</em></span>
              <input value={p.subtitle} onChange={(e) => setField({ subtitle: e.target.value })} placeholder="Five days, one coastline" /></label>
            <label className="field"><span>Issue line <em>(optional)</em></span>
              <input value={p.issue} onChange={(e) => setField({ issue: e.target.value })} placeholder={p.startDate ? 'Vol. 1 · ' + fmtDate(p.startDate, { month: 'long', year: 'numeric' }) : 'Vol. 1'} /></label>
          </div>
          <label className="field"><span>Edited by <em>(your name, optional)</em></span>
            <input value={p.editor} onChange={(e) => setField({ editor: e.target.value })} /></label>
          <label className="field"><span>Special names to feature <em>(cover &amp; a “people” page — separate with commas)</em></span>
            <input value={p.specialNames} onChange={(e) => setField({ specialNames: e.target.value })} placeholder="Amma, Dad, Riya, Uncle Raj" /></label>
          <label className="field"><span>Anything specific you want included? <em>(one per line — a joke, a milestone, a favourite quote; becomes a Highlights page)</em></span>
            <textarea rows="4" value={p.mustInclude} onChange={(e) => setField({ mustInclude: e.target.value })} placeholder={'The scooter that broke down\nMom’s first time in the sea\n“Just five more minutes!”'} /></label>
        </div>

        <div className="block">
          <h3>Colours</h3>
          <div className="pals">
            {PALETTES.map((x) => (
              <button key={x.id} className={'pal' + (p.theme.palette === x.id ? ' on' : '')} onClick={() => setTheme({ palette: x.id })} title={x.name}>
                <span style={{ background: x.bg }} /><span style={{ background: x.accent }} /><span style={{ background: x.accent2 }} /><span style={{ background: x.ink }} />
                <small>{x.name}</small>
              </button>
            ))}
          </div>
          <div className="row custom">
            <button className="btn small" disabled={busy} onClick={matchPhoto}>🎨 Match my cover photo</button>
            <label>Background <input type="color" value={cp.bg} onChange={(e) => setCustom({ bg: e.target.value })} /></label>
            <label>Accent <input type="color" value={cp.accent} onChange={(e) => setCustom({ accent: e.target.value })} /></label>
            <label>Highlight <input type="color" value={cp.accent2} onChange={(e) => setCustom({ accent2: e.target.value })} /></label>
          </div>
          {warn && <p className="hint warn">{warn}</p>}
        </div>

        <div className="block">
          <h3>Fonts</h3>
          <div className="fonts">{FONTS.map((f) => (
            <button key={f.id} className={'fnt' + (p.theme.font === f.id ? ' on' : '')} onClick={() => setTheme({ font: f.id })}>
              <span style={{ fontFamily: f.head }}>{f.sample}</span><b>{f.name}</b>
            </button>
          ))}</div>
        </div>

        <div className="block">
          <h3>Cover design</h3>
          <div className="covers">{COVERS.map((c) => (
            <button key={c.id} className={'cov' + (p.theme.cover === c.id ? ' on' : '')} onClick={() => setTheme({ cover: c.id })}>
              <Scaled page={coverPage} ctx={{ project: withCover(c.id), urls }} width={130} />
              <b>{c.name}</b>
            </button>
          ))}</div>
          <h4>Cover photo</h4>
          <div className="coverpick">
            {allIds.map((id) => (
              <button key={id} className={p.theme.coverPhoto === id ? 'on' : ''} onClick={() => setTheme({ coverPhoto: id })}><img src={urls[id]} alt="" /></button>
            ))}
          </div>
        </div>

        <div className="nav">
          <button className="btn ghost" onClick={() => setStep(2)}>← Back</button>
          <button className="btn" onClick={() => setStep(4)}>✨ Create my magazine</button>
        </div>
      </div>
      <aside className="design-side">
        <h4>Live cover preview</h4>
        <Scaled page={coverPage} ctx={ctx} width={300} />
      </aside>
    </section>
  );
}
