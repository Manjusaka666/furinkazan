import { defineConfig } from 'astro/config';
import { rehypeTerms } from './src/lib/rehype-terms.js';

export default defineConfig({
  site: 'https://furinkazan.vercel.app',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  markdown: { rehypePlugins: [rehypeTerms] },
  // Keep scripts and fonts as files so the CSP can stay 'self' and they get immutable caching.
  vite: { build: { assetsInlineLimit: 0 } },
});
