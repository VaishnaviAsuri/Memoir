import { useEffect, useMemo, useRef, useState } from 'react';
import { buildPages } from './layout';
import { PageView } from './Pages';

export const PW = 794, PH = 1123;

// Renders a single page scaled to a given width (used for thumbnails/preview).
export function Scaled({ page, ctx, width, pageRef }) {
  const s = width / PW;
  return (
    <div className="scaled" style={{ width, height: PH * s }}>
      <div ref={pageRef} style={{ width: PW, height: PH, transform: `scale(${s})`, transformOrigin: 'top left' }}>
        <PageView page={page} ctx={ctx} />
      </div>
    </div>
  );
}

export function usePages(project) {
  return useMemo(() => buildPages(project), [project]);
}

export function useWidth(max = 560) {
  const ref = useRef(null);
  const [w, setW] = useState(max);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.min(max, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [max]);
  return [ref, w];
}
