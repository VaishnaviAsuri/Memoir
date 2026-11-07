import { useRef } from 'react';
import { useStore } from '../store';
import { LIMITS } from '../photos';
import { EVENT_TYPES, PLACE_PROMPTS } from '../themes';
import { fmtDate } from '../util';

function Thumb({ id, dayId }) {
  const { project: p, urls, setCaption, removePhoto, movePhoto, setTheme } = useStore();
  const m = p.photos[id];
  if (!m) return null;
  const isCover = p.theme.coverPhoto === id;
  return (
    <div className="thumb">
      <div className="timg"><img src={urls[id]} alt={m.caption || m.name} />
        <button className={'star' + (isCover ? ' on' : '')} title="Use as cover photo" onClick={() => setTheme({ coverPhoto: isCover ? null : id })}>★</button>
        <button className="x" title="Remove" onClick={() => removePhoto(id)}>✕</button>
      </div>
      <input className="cap" value={m.caption} maxLength={90} placeholder="Caption (optional)" onChange={(e) => setCaption(id, e.target.value)} />
      <select value={dayId} onChange={(e) => movePhoto(id, e.target.value)} aria-label="Move photo to day">
        <option value="unsorted">Unsorted</option>
        {p.days.map((d, i) => <option key={d.id} value={d.id}>Day {i + 1}{d.date ? ' · ' + fmtDate(d.date, { day: 'numeric', month: 'short' }) : ''}</option>)}
      </select>
    </div>
  );
}

function AddPhotos({ target, label }) {
  const ref = useRef();
  const { addPhotos, photoCount } = useStore();
  const full = photoCount() >= LIMITS.maxPhotos;
  return (
    <>
      <button className="btn small" disabled={full} onClick={() => ref.current.click()}>{full ? 'Photo limit reached' : label}</button>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { addPhotos(target, e.target.files); e.target.value = ''; }} />
    </>
  );
}

export default function DaysStep() {
  const { project: p, updateDay, setStep, addPhotos } = useStore();
  const type = EVENT_TYPES.find((t) => t.id === p.eventType) || EVENT_TYPES[0];
  const count = Object.keys(p.photos).length;
  const pct = Math.round((count / LIMITS.maxPhotos) * 100);
  return (
    <section className="card-page wide">
      <h2>Days &amp; photos</h2>
      <div className="quota">
        <div className="bar"><i style={{ width: pct + '%' }} className={pct > 90 ? 'hot' : ''} /></div>
        <span><b>{count}</b> of {LIMITS.maxPhotos} photos used{count >= LIMITS.maxPhotos ? ' — limit reached, remove one to add another' : ` — ${LIMITS.maxPhotos - count} left`}</span>
      </div>
      <div className="bulk">
        <AddPhotos target="auto" label="📷 Add all photos & sort by date" />
        <small>Drops photos into the right day using the date stored in each picture. Anything without a date waits in “Unsorted”. Works from your laptop or phone gallery.</small>
      </div>

      {p.unsorted.filter((id) => p.photos[id]).length > 0 && (
        <div className="day unsorted">
          <h3>Unsorted photos <small>choose a day from each photo&rsquo;s dropdown</small></h3>
          <div className="thumbs">{p.unsorted.map((id) => <Thumb key={id} id={id} dayId="unsorted" />)}</div>
        </div>
      )}

      {p.days.map((d, i) => (
        <div key={d.id} className="day"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) addPhotos(d.id, e.dataTransfer.files); }}>
          <h3><span className="dn">{i + 1}</span> Day {i + 1}{d.date ? <small>{fmtDate(d.date)}</small> : null}</h3>
          <div className="row">
            <label className="field"><span>Title for the day</span>
              <input value={d.title} onChange={(e) => updateDay(d.id, { title: e.target.value })} placeholder="e.g. Arrival & sunset" /></label>
            <label className="field"><span>{type.place ? 'Place' : 'Place / venue (optional)'}</span>
              <input value={d.place} onChange={(e) => updateDay(d.id, { place: e.target.value })} placeholder="e.g. Baga Beach" /></label>
          </div>
          <label className="field"><span>The story of the day</span>
            <textarea rows="4" value={d.story} onChange={(e) => updateDay(d.id, { story: e.target.value })} placeholder={type.storyHint} /></label>
          <label className="field">
            <span>{type.place ? 'Anything about this place you’d like us to feature?' : 'Anything about this place or moment to feature on its own page? (optional)'} <em>{d.placeNote.length}/1100</em></span>
            <textarea rows="3" maxLength={1100} value={d.placeNote} onChange={(e) => updateDay(d.id, { placeNote: e.target.value })} placeholder="History, what it’s famous for, food, tips… a page is added only if you write something." />
            <div className="chips">{PLACE_PROMPTS.map(([l, s]) => (
              <button type="button" key={l} onClick={() => updateDay(d.id, { placeNote: (d.placeNote ? d.placeNote + '\n' : '') + s })}>{l}</button>
            ))}</div>
          </label>
          <div className="thumbs">
            {d.photos.map((id) => <Thumb key={id} id={id} dayId={d.id} />)}
            <div className="dz"><AddPhotos target={d.id} label="＋ Add photos" /><small>or drop them here</small></div>
          </div>
        </div>
      ))}
      <p className="hint">★ marks the cover photo (otherwise the first photo is used).</p>
      <div className="nav">
        <button className="btn ghost" onClick={() => setStep(1)}>← Back</button>
        <button className="btn" disabled={!count} onClick={() => setStep(3)}>Next: design →</button>
      </div>
    </section>
  );
}
