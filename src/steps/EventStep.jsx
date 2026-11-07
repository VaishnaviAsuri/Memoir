import { useStore } from '../store';
import { EVENT_TYPES } from '../themes';
import { MAX_DAYS, fmtDate } from '../util';

export default function EventStep() {
  const { project: p, setField, setupDays, setStep, setTheme } = useStore();
  const type = EVENT_TYPES.find((t) => t.id === p.eventType) || EVENT_TYPES[0];
  const datesOk = p.dateMode === 'dates' ? p.startDate && (!p.endDate || p.endDate >= p.startDate) : p.dayCount >= 1;
  const n = p.days.length;
  const pickType = (t) => {
    setField({ eventType: t.id });
    setTheme({ palette: t.palette, font: t.font, cover: t.cover });
  };
  return (
    <section className="card-page">
      <h2>What are we remembering?</h2>
      <div className="types">
        {EVENT_TYPES.map((t) => (
          <button key={t.id} className={'type' + (p.eventType === t.id ? ' on' : '')} onClick={() => pickType(t)}>
            <span className="em">{t.emoji}</span><b>{t.name}</b><small>{t.blurb}</small>
          </button>
        ))}
      </div>

      <label className="field">
        <span>{type.place ? 'Where did it happen? (city, country, venue)' : 'Where did it take place? (optional)'}</span>
        <input value={p.location} onChange={(e) => setField({ location: e.target.value })} placeholder="e.g. Goa, India" />
      </label>

      <div className="seg">
        <button className={p.dateMode === 'dates' ? 'on' : ''} onClick={() => setupDays({ dateMode: 'dates' })}>I know the dates</button>
        <button className={p.dateMode === 'count' ? 'on' : ''} onClick={() => setupDays({ dateMode: 'count' })}>Just the number of days</button>
      </div>

      {p.dateMode === 'dates' ? (
        <div className="row">
          <label className="field"><span>From</span>
            <input type="date" value={p.startDate} onChange={(e) => setupDays({ startDate: e.target.value, endDate: p.endDate && p.endDate < e.target.value ? e.target.value : p.endDate })} /></label>
          <label className="field"><span>To (same day for a one-day event)</span>
            <input type="date" value={p.endDate} min={p.startDate} onChange={(e) => setupDays({ endDate: e.target.value })} /></label>
        </div>
      ) : (
        <label className="field"><span>How many days was it? (max {MAX_DAYS})</span>
          <input type="number" min="1" max={MAX_DAYS} value={p.dayCount} onChange={(e) => setupDays({ dayCount: Math.max(1, Math.min(MAX_DAYS, +e.target.value || 1)) })} /></label>
      )}
      {datesOk && n > 0 && (
        <p className="hint ok">
          {n} day{n > 1 ? 's' : ''}{p.dateMode === 'dates' && p.startDate ? ` · ${fmtDate(p.startDate)}${n > 1 ? ' → ' + fmtDate(p.days[n - 1].date) : ''}` : ''}. You&rsquo;ll add photos and notes for each one next.
        </p>
      )}
      {p.dateMode === 'dates' && p.startDate && p.endDate && eachCapped(p) && <p className="hint warn">Only the first {MAX_DAYS} days are used.</p>}

      <label className="field">
        <span>In a sentence or two, what&rsquo;s this magazine about? <em>(becomes the editor&rsquo;s note — optional)</em></span>
        <textarea rows="3" value={p.intro} onChange={(e) => setField({ intro: e.target.value })} placeholder="e.g. Five days with the cousins on the coast, our first trip together in ten years." />
      </label>

      <div className="nav">
        <button className="btn ghost" onClick={() => setStep(0)}>← Back</button>
        <button className="btn" disabled={!datesOk || !n} onClick={() => setStep(2)}>Next: days &amp; photos →</button>
      </div>
    </section>
  );
}
function eachCapped(p) {
  const a = new Date(p.startDate), b = new Date(p.endDate);
  return (b - a) / 86400000 + 1 > MAX_DAYS;
}
