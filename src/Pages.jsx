import { getPalette, getFont } from './themes';
import { LAYOUTS } from './layout';

const lenClass = (t) => (t.length > 360 ? 'xs' : t.length > 240 ? 'sm' : t.length < 150 ? 'lg' : '');
const bodyClass = (t) => (t.length < 200 ? 'lead' : 'dropcap ' + lenClass(t));

function Fig({ id, ctx, area, caption = true, className = '' }) {
  const meta = ctx.project.photos[id];
  const url = ctx.urls[id];
  return (
    <figure className={className} style={{ gridArea: area }}>
      {url ? <img src={url} alt={meta?.caption || meta?.name || ''} /> : <div className="ph" />}
      {caption && meta?.caption ? <figcaption>{meta.caption}</figcaption> : null}
    </figure>
  );
}
function Grid({ ids, layout, ctx, caption = true }) {
  return (
    <div className="pgrid" style={{ gridTemplateAreas: layout.areas.map((r) => `"${r}"`).join(' '), gridTemplateColumns: layout.cols, gridTemplateRows: layout.rows }}>
      {ids.map((id, i) => <Fig key={id} id={id} ctx={ctx} area={'abcdef'[i]} caption={caption} />)}
    </div>
  );
}
const Foot = ({ ctx, page }) => (
  <div className="pfoot"><span>{ctx.project.title || 'Memoir'}</span><span>{page.pageNo}</span></div>
);

function Cover({ page, ctx }) {
  const { project } = ctx;
  const style = project.theme.cover;
  const { coverIds, names, dateText } = page;
  const title = project.title || 'Untitled Magazine';
  const issue = project.issue;
  const feat = names.length ? <div className="cv-feat">Featuring {names.slice(0, 5).join(' · ')}</div> : null;
  const n = Math.min(coverIds.length, 5);
  const masthead = (
    <>
      <h1 className={title.length > 22 ? 'long' : ''}>{title}</h1>
      {project.subtitle && <p className="cv-sub">{project.subtitle}</p>}
    </>
  );
  if (style === 'framed') {
    return (
      <div className="page cover cv-framed">
        <div className="cv-top"><span>{issue}</span><span>{dateText}</span></div>
        <div className="cv-mast">{masthead}</div>
        <div className="cv-arch">{coverIds[0] && ctx.urls[coverIds[0]] ? <img src={ctx.urls[coverIds[0]]} alt="" /> : <div className="ph" />}</div>
        {feat}
        <div className="cv-bar" />
      </div>
    );
  }
  if (style === 'split') {
    const g = coverIds.slice(0, 3);
    return (
      <div className="page cover cv-split">
        <div className="cv-photos">{g.length ? <Grid ids={g} layout={LAYOUTS[g.length][g.length === 3 ? 1 : 0]} ctx={ctx} caption={false} /> : <div className="ph" />}</div>
        <div className="cv-band">
          <div className="cv-top"><span>{issue}</span><span>{dateText}</span></div>
          {masthead}
          {feat}
        </div>
      </div>
    );
  }
  if (style === 'collage') {
    const ids = coverIds.slice(0, n);
    return (
      <div className="page cover cv-collage">
        <div className="cv-top"><span>{issue}</span><span>{dateText}</span></div>
        <div className="cv-mast">{masthead}</div>
        <div className="cv-grid deco-polaroid">{ids.length ? <Grid ids={ids} layout={LAYOUTS[ids.length][0]} ctx={ctx} caption={false} /> : <div className="ph" />}</div>
        {feat}
      </div>
    );
  }
  return (
    <div className="page cover cv-full">
      {coverIds[0] && ctx.urls[coverIds[0]] ? <img className="cv-bg" src={ctx.urls[coverIds[0]]} alt="" /> : <div className="ph cv-bg" />}
      <div className="cv-shade" />
      <div className="cv-top"><span>{issue}</span><span>{dateText}</span></div>
      <div className="cv-mast">{masthead}</div>
      {feat}
    </div>
  );
}

function Photos({ page, ctx }) {
  const { layout } = page;
  if (layout.hero) {
    const id = page.ids[0];
    return (
      <div className="page hero">
        {ctx.urls[id] ? <img src={ctx.urls[id]} alt={ctx.project.photos[id]?.caption || ''} /> : <div className="ph" />}
        <div className="ov">
          <div className="kicker">{page.kicker}</div>
          <h3>{ctx.project.photos[id]?.caption || page.heading}</h3>
          {page.text && <p>{page.text}</p>}
        </div>
        <div className="pfoot light"><span>{ctx.project.title}</span><span>{page.pageNo}</span></div>
      </div>
    );
  }
  return (
    <div className={`page photos deco-${page.deco} pos-${page.textPos}`}>
      <div className="ptop"><span className="kicker">{page.kicker}</span><i /></div>
      <Grid ids={page.ids} layout={layout} ctx={ctx} />
      <div className={`ptext ${lenClass(page.text)}`}>
        <h3>{page.heading}</h3>
        {page.text && <p>{page.text}</p>}
      </div>
      <Foot ctx={ctx} page={page} />
    </div>
  );
}

function Opener({ page, ctx }) {
  return (
    <div className="page opener">
      <div className="op-hero">
        {page.id && ctx.urls[page.id] ? <img src={ctx.urls[page.id]} alt={ctx.project.photos[page.id]?.caption || ''} /> : <div className="ph" />}
        <div className="op-badge"><span>{page.dayWord}</span><b>{page.num}</b></div>
      </div>
      <div className="op-body">
        <div className="kicker">{page.kicker}{page.place ? ' · ' + page.place : ''}</div>
        <h2>{page.title}</h2>
        {page.text && <p className={bodyClass(page.text)}>{page.text}</p>}
      </div>
      <Foot ctx={ctx} page={page} />
    </div>
  );
}

export function PageView({ page, ctx }) {
  const pal = getPalette(ctx.project.theme);
  const font = getFont(ctx.project.theme);
  const vars = { '--bg': pal.bg, '--ink': pal.ink, '--accent': pal.accent, '--accent2': pal.accent2, '--soft': pal.soft, '--head': font.head, '--body': font.body };
  let inner = null;
  switch (page.kind) {
    case 'cover': inner = <Cover page={page} ctx={ctx} />; break;
    case 'photos': inner = <Photos page={page} ctx={ctx} />; break;
    case 'opener': inner = <Opener page={page} ctx={ctx} />; break;
    case 'contents':
      inner = (
        <div className="page contents">
          <div className="kicker">Inside this issue</div>
          <h2>Contents</h2>
          <ol>{page.entries.map((e, i) => (
            <li key={i}><span className="c-no">{String(i + 1).padStart(2, '0')}</span><span className="c-t"><b>{e.title}</b><em>{e.kicker}</em></span><span className="c-p">{e.pageNo}</span></li>
          ))}</ol>
          <Foot ctx={ctx} page={page} />
        </div>
      ); break;
    case 'letter':
      inner = (
        <div className="page letter">
          <div className="kicker">Editor&rsquo;s note</div>
          <h2>Welcome</h2>
          <p className={bodyClass(ctx.project.intro)}>{ctx.project.intro}</p>
          {ctx.project.editor && <div className="sig">— {ctx.project.editor}</div>}
          <Foot ctx={ctx} page={page} />
        </div>
      ); break;
    case 'crew':
      inner = (
        <div className="page crew">
          <div className="kicker">Starring</div>
          <h2>The people who made it</h2>
          <ul>{page.names.map((n, i) => <li key={i}>{n}</li>)}</ul>
          <Foot ctx={ctx} page={page} />
        </div>
      ); break;
    case 'place':
      inner = (
        <div className="page place">
          <div className="blob b1" /><div className="blob b2" />
          <div className="kicker">About this place</div>
          <h2>{page.place}</h2>
          <div className="rule" />
          <p className={bodyClass(page.text)}>{page.text}</p>
          <Foot ctx={ctx} page={page} />
        </div>
      ); break;
    case 'story':
      inner = (
        <div className="page story">
          <div className="kicker">{page.kicker}</div>
          <h2>{page.title}</h2>
          <div className="cols">{page.text}</div>
          <Foot ctx={ctx} page={page} />
        </div>
      ); break;
    case 'quote':
      inner = (
        <div className="page quote">
          <div className="qm">“</div>
          <blockquote>{page.text}</blockquote>
          <div className="kicker">{page.kicker}</div>
          <div className="pfoot light"><span>{ctx.project.title}</span><span>{page.pageNo}</span></div>
        </div>
      ); break;
    case 'highlights':
      inner = (
        <div className="page highlights">
          <div className="kicker">Don&rsquo;t forget</div>
          <h2>{page.first ? 'Highlights' : 'More highlights'}</h2>
          <ul>{page.items.map((t, i) => <li key={i}><span>{String(i + 1).padStart(2, '0')}</span>{t}</li>)}</ul>
          <Foot ctx={ctx} page={page} />
        </div>
      ); break;
    case 'back':
      inner = (
        <div className="page back">
          <div className="bk-mid">
            <h2>{ctx.project.title || 'Memoir'}</h2>
            {page.dateText && <p>{page.dateText}</p>}
            {ctx.project.editor && <p className="by">Edited by {ctx.project.editor}</p>}
            {page.names.length > 0 && <p className="by">With love: {page.names.join(', ')}</p>}
          </div>
          <div className="bk-end">Made with Memoir · photos stayed on this device</div>
        </div>
      ); break;
    default: inner = null;
  }
  return <div className="pv" style={vars}>{inner}</div>;
}
