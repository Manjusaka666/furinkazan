import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://furinkazan.vercel.app',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  // Keep scripts and fonts as files so the CSP can stay 'self' and they get immutable caching.
  vite: { build: { assetsInlineLimit: 0 } },
});
