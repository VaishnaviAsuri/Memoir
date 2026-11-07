import { useRef, useState } from 'react';
import { useStore } from '../store';
import { LIMITS } from '../photos';

export default function Welcome() {
  const { project, setStep, resetAll, importFile } = useStore();
  const fileRef = useRef();
  const [err, setErr] = useState('');
  const hasWork = project.days.length > 0 || project.title;
  return (
    <section className="welcome">
      <h1>Turn your photos into a <em>real magazine</em>.</h1>
      <p className="lead">Tell us about your trip or event, add your pictures day by day, pick a look, and download a print-quality PDF.</p>

      <div className="limits">
        <h3>Before you start — a few limits</h3>
        <ul>
          <li><b>Up to {LIMITS.maxPhotos} photos</b> per magazine (a live counter is always shown at the top).</li>
          <li><b>{LIMITS.maxFileMB} MB</b> maximum per photo. JPG, PNG and WebP work best.</li>
          <li>Photos are shrunk on your device to {LIMITS.maxEdge}px so the magazine stays smooth, still sharp on A4 paper.</li>
          <li>Up to <b>21 days</b> per magazine. Output is an <b>A4 portrait PDF</b>.</li>
        </ul>
      </div>
      <div className="limits privacy-card">
        <h3>Your privacy</h3>
        <p>This site has no upload server. Pictures are processed and stored only inside your own browser, and the PDF is built on your device. Closing the tab keeps your draft here; use <i>Clear all my data</i> any time.</p>
      </div>

      <div className="cta">
        <button className="btn big" onClick={() => setStep(1)}>{hasWork ? 'Continue my magazine →' : 'Start a magazine →'}</button>
        {hasWork && <button className="btn ghost" onClick={() => { if (confirm('Delete your draft and all photos stored in this browser?')) resetAll(); }}>Clear all my data</button>}
        <button className="btn ghost" onClick={() => fileRef.current.click()}>Open a saved project file</button>
        <input ref={fileRef} type="file" accept=".json,.memoir" hidden onChange={async (e) => {
          setErr('');
          try { await importFile(e.target.files[0]); } catch (x) { setErr(x.message); }
          e.target.value = '';
        }} />
      </div>
      {err && <p className="error">{err}</p>}
    </section>
  );
}
