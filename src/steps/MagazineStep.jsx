import { useRef, useState } from 'react';
import { useStore } from '../store';
import { usePages, Scaled, useWidth } from '../Magazine';
import { exportPdf, download } from '../pdf';
import { PALETTES, FONTS, COVERS } from '../themes';
import { slug } from '../util';

export default function MagazineStep() {
  const s = useStore();
  const { project: p, urls, setTheme, setField, setStep } = s;
  const pages = usePages(p);
  const ctx = { project: p, urls };
  const [wrapRef, width] = useWidth(520);
  const nodes = useRef({});
  const [prog, setProg] = useState(null);
  const [quality, setQuality] = useState('2');
  const [label, setLabel] = useState('');
  const [err, setErr] = useState('');

  const doExport = async () => {
    setErr(''); setProg({ i: 0, n: pages.length });
    try {
      const list = pages.map((pg) => nodes.current[pg.key]).filter(Boolean);
      const blob = await exportPdf(list, { scale: +quality, onProgress: (i, n) => setProg({ i, n }) });
      download(blob, slug(p.title) + '.pdf');
    } catch (e) { setErr('Could not create the PDF: ' + e.message + '. Try “Standard” quality.'); }
    setProg(null);
  };
  const saveFile = async () => download(await s.exportFile(), slug(p.title) + '.memoir.json');

  return (
    <section className="studio">
      <div className="pages" ref={wrapRef}>
        {pages.map((pg) => (
          <div className="pagewrap" key={pg.key}>
            <div className="pagebar">
              <span>Page {pg.pageNo} · {pg.kind}</span>
              {pg.kind === 'photos' && pg.nVariants > 1 && <button onClick={() => s.cycleVariant(pg.key, p.pageStyle[pg.key] || 0)}>↻ Change layout</button>}
              {pg.kind === 'cover' && <button onClick={() => setStep(3)}>Edit cover…</button>}
              {(pg.day != null) && <button onClick={() => setStep(2)}>Edit day {pg.day + 1} text…</button>}
            </div>
            <div className="shadow"><Scaled page={pg} ctx={ctx} width={width} pageRef={(el) => { nodes.current[pg.key] = el; }} /></div>
          </div>
        ))}
      </div>

      <aside className="panel">
        <h3>Revise</h3>
        <div className="undo">
          <button className="btn small ghost" disabled={!s.past.length} onClick={s.undo}>↶ Undo</button>
          <button className="btn small ghost" disabled={!s.future.length} onClick={s.redo}>↷ Redo</button>
        </div>
        <label className="field"><span>Title</span><input value={p.title} onChange={(e) => setField({ title: e.target.value })} /></label>
        <label className="field"><span>Tagline</span><input value={p.subtitle} onChange={(e) => setField({ subtitle: e.target.value })} /></label>
        <label className="field"><span>Colours</span>
          <select value={p.theme.palette} onChange={(e) => setTheme({ palette: e.target.value })}>
            {PALETTES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            {p.theme.customPalette && <option value="custom">Custom</option>}
          </select></label>
        <label className="field"><span>Fonts</span>
          <select value={p.theme.font} onChange={(e) => setTheme({ font: e.target.value })}>{FONTS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="field"><span>Cover</span>
          <select value={p.theme.cover} onChange={(e) => setTheme({ cover: e.target.value })}>{COVERS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <div className="undo">
          <button className="btn small" onClick={s.nextLayoutSeed}>🔀 Shuffle all layouts</button>
          {Object.keys(p.pageStyle).length > 0 && <button className="btn small ghost" onClick={s.clearPageStyles}>Reset page tweaks</button>}
        </div>
        <button className="btn small ghost wide" onClick={() => setStep(2)}>Edit photos &amp; text</button>
        <button className="btn small ghost wide" onClick={() => setStep(3)}>Edit names &amp; design options</button>

        <h3>Versions</h3>
        <div className="row tight"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name this draft" />
          <button className="btn small" onClick={() => { s.saveVersion(label); setLabel(''); }}>Save</button></div>
        <ul className="versions">
          {s.versions.map((v) => (
            <li key={v.id}><span>{v.label}<small>{new Date(v.at).toLocaleString()}</small></span>
              <button onClick={() => s.restoreVersion(v.id)}>Restore</button><button onClick={() => s.deleteVersion(v.id)}>✕</button></li>
          ))}
          {!s.versions.length && <li className="muted">Save a draft before trying big changes.</li>}
        </ul>

        <h3>Download</h3>
        <label className="field"><span>Quality</span>
          <select value={quality} onChange={(e) => setQuality(e.target.value)}>
            <option value="1.5">Standard – smaller file, great on screen</option>
            <option value="2">High – good for home printing</option>
            <option value="3">Best – largest file (laptop recommended)</option>
          </select></label>
        <button className="btn wide" disabled={!!prog} onClick={doExport}>
          {prog ? `Building PDF… ${prog.i}/${prog.n}` : '⬇ Download PDF'}
        </button>
        {prog && <div className="bar"><i style={{ width: (prog.i / prog.n) * 100 + '%' }} /></div>}
        {err && <p className="error">{err}</p>}
        <button className="btn small ghost wide" onClick={saveFile}>💾 Save project file (continue later or on another device)</button>
      </aside>
    </section>
  );
}
