# Memoir – Photo Magazine Maker

Turn trip / event photos into a professional A4 magazine PDF. **100% in the browser: photos never leave the user's device.**

## Run it
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs ./dist  (a plain static website)
```

## Host it for free and share a link (pick one)
1. **Cloudflare Pages / Netlify (easiest, no account tricks):** run `npm run build`, then drag the `dist` folder onto app.netlify.com/drop (or Cloudflare Pages → Upload assets). You get a shareable link instantly.
2. **GitHub Pages (best for ongoing improvements):** push this folder to a GitHub repo, then Settings → Pages → Source: *GitHub Actions*. The included workflow (`.github/workflows/deploy.yml`) rebuilds and publishes on every push to `main`.
3. Optional: attach a custom domain on any of them.

No server, database or API key is involved, so hosting stays free.

## How it works
| File | Job |
|---|---|
| `src/store.js` | All app state (zustand): project, undo/redo, versions, autosave to the browser's IndexedDB |
| `src/photos.js` | Photo limits, resize on device, EXIF dates, palette-from-photo |
| `src/layout.js` | **Layout engine**: turns days + photos + text into pages (hero, collages, mosaics, quotes, story, place pages…) |
| `src/Pages.jsx` + `styles.css` | The page designs (fixed A4, 794×1123 px) |
| `src/themes.js` | Event templates, palettes, fonts, cover styles |
| `src/pdf.js` | Pages → high-res images → A4 PDF (jsPDF) |
| `src/steps/*` | The wizard screens |

Limits live in one place: `LIMITS` in `src/photos.js` (default 60 photos, 25 MB each). The welcome screen and the live counter read from it.

**Privacy:** production builds ship a strict Content-Security-Policy (`vite.config.js`) that only allows the page to talk to itself, so photos cannot be sent anywhere even by mistake.

## Add a new template or layout
- New page grid: add an entry to `LAYOUTS` in `layout.js`.
- New event type, palette, font or cover: add to `themes.js` (covers also need a branch in `Pages.jsx`).

## Roadmap
**Version 2 – shared albums (needs a small backend)**
- One person creates a magazine and shares an invite link; others upload photos into it.
- Suggested free stack: Cloudflare Pages + R2 (photo storage) + D1/Workers (invites, day assignment), or Supabase free tier. Photos are stored per-album with an expiry; the organiser's theme choices are a JSON "magazine spec" that can be applied to the shared pool.
- Keep the privacy promise explicit: shared albums are the *only* mode that uploads, and it is opt-in.

**Also planned**
- Drag-and-drop page editor (move/resize photos by hand)
- Optional AI helpers (place blurbs, caption suggestions, "make it more colourful" revisions) via a tiny serverless function sending **text only**, never photos
- Print-ready export (bleed marks, 300 DPI, CMYK note), more page sizes (square, A5, landscape)
- More languages and fonts (Hindi, Telugu, Tamil…), RTL support
- Face-aware cropping, auto "best photo" picking, duplicate/blur detection
- Map page, weather/date fun facts, QR code to a video
- Reorder photos within a day, per-photo crop focus
