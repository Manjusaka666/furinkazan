// Build-time helpers for repo-authored prose. Client code uses ruby.js alone.
import { ruby, plain } from './ruby.js';
import { romanize } from './romaji.js';

const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** A tappable Japanese term that speaks itself, with romaji unless it would give a quiz away. */
export const term = (s, { ro = true } = {}) =>
  `<button type="button" class="term" lang="ja" data-say="${attr(plain(s))}">${ruby(s)}${ro ? `<span class="ro">${attr(romanize(s))}</span>` : ''}</button>`;

/** Prose with [[term]] markers. The prose is trusted, repo-authored HTML. */
export const rich = (s, opts) => s.replace(/\[\[(.+?)\]\]/g, (_, t) => term(t, opts));
