import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In production builds we inject a strict Content-Security-Policy:
// the page may only talk to itself, so photos physically cannot be sent anywhere.
const csp = () => ({
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml(html) {
    const policy =
      "default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; " +
      "font-src 'self' data:; script-src 'self'; connect-src 'self' blob: data:; " +
      "object-src 'none'; base-uri 'self'; form-action 'none'";
    return html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${policy}" />`);
  },
});

export default defineConfig({
  base: './', // works on GitHub Pages sub-paths, Netlify, Cloudflare Pages
  plugins: [react(), csp()],
  build: { chunkSizeWarningLimit: 1200 },
});
