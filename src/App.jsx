import { useEffect } from 'react';
import { useStore } from './store';
import { LIMITS } from './photos';
import Welcome from './steps/Welcome';
import EventStep from './steps/EventStep';
import DaysStep from './steps/DaysStep';
import DesignStep from './steps/DesignStep';
import MagazineStep from './steps/MagazineStep';

const STEPS = ['Welcome', 'Event', 'Days & photos', 'Design', 'Magazine'];

export default function App() {
  const { step, setStep, ready, hydrate, project, photoCount, busy, notices, dismissNotices } = useStore();
  useEffect(() => { hydrate(); }, [hydrate]);
  const count = Object.keys(project.photos).length;

  if (!ready) return <div className="loading">Opening your workspace…</div>;
  return (
    <div className="app">
      <header className="top">
        <div className="brand" onClick={() => setStep(0)}><span className="logo">M</span> Memoir <small>photo magazine maker</small></div>
        {step > 0 && (
          <nav className="steps">
            {STEPS.slice(1).map((s, i) => (
              <button key={s} className={step === i + 1 ? 'on' : step > i + 1 ? 'done' : ''} onClick={() => setStep(i + 1)}>
                <b>{i + 1}</b><span>{s}</span>
              </button>
            ))}
          </nav>
        )}
        <div className="meter" title="Photos used"><b>{count}</b>/{LIMITS.maxPhotos} photos</div>
      </header>
      <div className="privacy">🔒 Your photos stay on this device. Nothing is uploaded to any server.</div>
      {busy && <div className="toast">Preparing photos… {busy.done}/{busy.total}</div>}
      {notices.length > 0 && (
        <div className="notice">
          <button onClick={dismissNotices} aria-label="Dismiss">✕</button>
          <b>Some photos were skipped:</b>
          <ul>{notices.slice(0, 6).map((n, i) => <li key={i}>{n}</li>)}{notices.length > 6 && <li>…and {notices.length - 6} more</li>}</ul>
        </div>
      )}
      <main>
        {step === 0 && <Welcome />}
        {step === 1 && <EventStep />}
        {step === 2 && <DaysStep />}
        {step === 3 && <DesignStep />}
        {step === 4 && <MagazineStep />}
      </main>
    </div>
  );
}
