#!/usr/bin/env node
// Turn the Chinese edition of Tae Kim's Japanese Grammar Guide (CC BY-NC-SA) into src/data/grammar/*.json.
// The prose is the translator's, unchanged. We drop the old jQuery/Bootstrap chrome and add kana and romaji, and say so on every page.
// Usage (from the repo root): node scripts/import-grammar.mjs PATH_TO_jpgramma_CHECKOUT
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parse, parseFragment, serialize } from 'parse5';
import { ruby } from '../src/lib/ruby.js';
import { romanize } from '../src/lib/romaji.js';
import { toRomaji } from '../src/lib/kana.js';

const SRC = process.argv[2];
const OUT = 'src/data/grammar';
const IMG = 'public/grammar-img';
const KANJI = '㐀-鿿豈-﫿々〆ヶ';
const JA = /[ぁ-ヿ㐀-鿿々]/;
const CJK_ONLY = new RegExp(`^[${KANJI}]+$`);
// Their point is to read kana unaided, and the kana tables already give romaji.
const NO_ROMAJI = new Set(['hiragana', 'hiragana_ex', 'katakana', 'katakana_ex']);

const hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const attrOf = (n, k) => n.attrs?.find((a) => a.name === k)?.value;
const setAttr = (n, k, v) => {
  n.attrs = (n.attrs ?? []).filter((a) => a.name !== k);
  if (v !== null) n.attrs.push({ name: k, value: v });
};
const textOf = (n) => (n.nodeName === '#text' ? n.value : (n.childNodes ?? []).map(textOf).join(''));
const walk = (n, f) => {
  f(n);
  for (const c of [...(n.childNodes ?? [])]) walk(c, f);
};
const frag = (html) => parseFragment(html).childNodes;
const swap = (node, nodes) => {
  const kids = node.parentNode.childNodes;
  kids.splice(kids.indexOf(node), 1, ...nodes);
  nodes.forEach((x) => { x.parentNode = node.parentNode; });
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const roSpan = (text, cls = 'ro') => (text ? frag(`<span class="${cls}" lang="ja-Latn">${esc(text)}</span>`) : []);

/** The source gives each word's dictionary reading, and the word may be conjugated: 食べた + たべる → 食{た}べた. Returns bare text when unsure. */
function annotate(surface, title) {
  const read = hira((title ?? '').split(' - ')[0].replace(/[・\s]/g, ''));
  if (!read || !/^[ぁ-ゖー]+$/.test(read)) return surface;
  const runs = surface.match(new RegExp(`[${KANJI}]+`, 'g'));
  if (!runs) return surface;
  if (runs.length > 1) {
    const parts = surface.split(new RegExp(`([${KANJI}]+)`));
    const re = new RegExp(`^${parts.map((p) => (CJK_ONLY.test(p) ? '(.+?)' : hira(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('')}$`);
    const m = read.match(re);
    if (!m) return surface;
    let i = 1;
    return parts.map((p) => (CJK_ONLY.test(p) ? `${p}{${m[i++]}}` : p)).join('');
  }
  const [before, after] = surface.split(runs[0]);
  let r = read;
  if (before) {
    if (!r.startsWith(hira(before))) return surface;
    r = r.slice(before.length);
  }
  let base;
  if (!after) base = r;
  else if (r.endsWith(hira(after))) base = r.slice(0, -after.length);
  else if (runs[0] === '来' && r === 'くる') base = /^[なよさらこ]/.test(after) ? 'こ' : /^[るれ]/.test(after) ? 'く' : 'き';
  else if (r.lastIndexOf(hira(after[0])) >= 1) base = r.slice(0, r.lastIndexOf(hira(after[0])));
  else base = r.slice(0, -1);
  if (!base || base.length > runs[0].length * 5) return surface;
  return `${before}${runs[0]}{${base}}${after}`;
}

/** Inline nodes → site source (base{read}), rewriting popups into ruby as a side effect. */
function inline(nodes) {
  let src = '';
  for (const n of [...nodes]) {
    if (n.nodeName === '#text') src += n.value;
    else if (n.nodeName === 'span' && attrOf(n, 'class')?.includes('popup')) {
      const surface = textOf(n);
      const title = attrOf(n, 'title') ?? '';
      const s = annotate(surface, title);
      src += s;
      const gloss = title.includes(' - ') ? title.split(' - ').slice(1).join(' - ') : title;
      n.attrs = gloss ? [{ name: 'title', value: gloss }] : [];
      n.childNodes = frag(ruby(s));
      n.childNodes.forEach((c) => { c.parentNode = n; });
    } else if (n.nodeName === 'br') break;
    else src += inline(n.childNodes ?? []);
  }
  return src;
}

// Simplified Chinese hanzi are mostly outside JIS X 0208, the kanji set of ordinary Japanese text.
const JIS = new Set();
const eucjp = new TextDecoder('euc-jp');
for (let a = 0xb0; a <= 0xf4; a++) for (let b = 0xa1; b <= 0xfe; b++) JIS.add(eucjp.decode(new Uint8Array([a, b])));
const isChinese = (s) => s.includes('，') || [...s].some((c) => /\p{Script=Han}/u.test(c) && !JIS.has(c) && !'々〆'.includes(c));
if (!isChinese('把「だ」加到名词') || isChinese('友達{ともだち}だった。') || isChinese('学校に行きます')) throw new Error('isChinese');

const romaji = (src) => {
  const s = src.replace(/\s+/g, ' ').trim();
  return /[ぁ-ヿ{]/.test(s) && !isChinese(s) ? romanize(s) : ''; // romaji only for Japanese: kanji alone or mixed in prose may be Chinese
};

function vocab(li, withRo) {
  const raw = textOf(li).trim();
  const kids = li.childNodes.filter((c) => c.nodeName !== '#text' || c.value.trim());
  if (kids.length !== 1 || kids[0].nodeName !== '#text') return false;
  const m = raw.match(/^([^\s【]+)\s*【([^】]+)】(.*)$/) ?? raw.match(/^([ぁ-ゖァ-ヺー〜]+)()\s*((?:（|-|－).*)$/);
  if (!m || !JA.test(m[1])) return false;
  const [, word, reading, rest] = m;
  // 家 【1) うち; 2) いえ】, 何 【なに／なん】, ～回 【～かい】: furigana takes the first reading, the romaji gives them all.
  const reads = reading.split(/[;；／]/).map((x) => x.replace(/^\s*\d\)|[・\s～〜]/g, '')).filter(Boolean);
  const bare = word.replace(/^[～〜]/, '');
  const src = word.slice(0, word.length - bare.length) + (reads.length ? annotate(bare, reads[0]) : bare);
  const ro = (reads.length ? reads : ['']).map((x) => romaji(x ? annotate(bare, x) : bare)).join(' / ');
  const html = `<span lang="ja">${ruby(src)}</span>${withRo ? `<span class="ro" lang="ja-Latn">${esc(ro)}</span>` : ''}${esc(rest)}`;
  li.childNodes = frag(html);
  li.childNodes.forEach((c) => { c.parentNode = li; });
  setAttr(li, 'class', 'vocab');
  return true;
}

function transform(slug, root, links) {
  const withRo = !NO_ROMAJI.has(slug);
  // Scripts, frames and players first: CSP blocks them and our own pages link out instead.
  walk(root, (n) => {
    if (n.nodeName === 'iframe') {
      const u = attrOf(n, 'src')?.replace('/embed/', '/watch?v=');
      swap(n, frag(`<a class="vid" rel="noopener" href="${esc(u ?? '')}">作者的视频讲解（YouTube）</a>`));
    }
    if (['audio', 'script', 'center', 'style'].includes(n.nodeName)) swap(n, []);
    if (n.nodeName === 'a') {
      const h = attrOf(n, 'href');
      if (h && /^[\w-]+\.html/.test(h)) setAttr(n, 'href', `/grammar/${h.replace(/\.html/, '/').replace('#page-title', '')}`);
      else if (h && /^https?:/.test(h)) setAttr(n, 'rel', 'noopener');
      const on = attrOf(n, 'onclick') ?? '';
      const arg = on.match(/\('([^']+)'\)/)?.[1];
      if (/^toggle(All)?\(/.test(on)) { setAttr(n, 'data-reveal', arg); setAttr(n, 'href', '#'); }
      if (/^flip\(/.test(on)) { setAttr(n, 'data-flip', arg); setAttr(n, 'href', '#'); }
      if (/fadeIn|fadeOut/.test(on)) { setAttr(n, 'data-reveal', on.match(/\$\('#?([\w-]+)/)?.[1] ?? ''); setAttr(n, 'href', '#'); }
      if (/^(showModal|playClip)\(/.test(on)) {
        setAttr(n, 'data-say', textOf(n).trim());
        setAttr(n, 'data-au', `kana/${arg}.aac`);
        setAttr(n, 'href', '#');
        n.attrs = n.attrs.filter((a) => a.name !== 'onclick');
      }
      n.attrs = n.attrs.filter((a) => a.name !== 'onclick');
    }
    if (n.nodeName === 'img') {
      const s = attrOf(n, 'src') ?? '';
      if (/images\/(play|menu)/.test(s)) return swap(n, []);
      if (s.startsWith('images/')) {
        const name = s.replace('images/', '').replace(/\//g, '-');
        links.add([s, name]);
        setAttr(n, 'src', `/grammar-img/${name}`);
        setAttr(n, 'loading', 'lazy');
      }
    }
    if (n.attrs) n.attrs = n.attrs.filter((a) => !['style', 'align', 'border', 'cellpadding', 'width', 'height'].includes(a.name) || n.nodeName === 'img');
  });

  walk(root, (n) => {
    if (n.nodeName === 'li' && vocab(n, withRo)) return;
    if (n.nodeName === 'li') {
      const kids = n.childNodes;
      if (!kids.some((k) => JA.test(textOf(k)))) return;
      const nested = kids.some((k) => ['ol', 'ul', 'table'].includes(k.nodeName));
      const src = inline(kids);
      if (nested || !JA.test(src) || !withRo) return;
      const at = kids.findIndex((k) => k.nodeName === 'br');
      const ro = roSpan(romaji(src), 'ro ro-b');
      ro.forEach((x) => { x.parentNode = n; });
      kids.splice(at < 0 ? kids.length : at, 0, ...ro);
      setAttr(n, 'lang', null);
    } else if (['td', 'th', 'dd'].includes(n.nodeName)) {
      const hidden = n.childNodes.find((k) => /hidex|toggle/.test(attrOf(k, 'class') ?? ''));
      const box = hidden ?? n;
      const popup = box.childNodes.some((k) => attrOf(k, 'class')?.includes('popup'));
      const src = inline(box.childNodes);
      // Header cells are Chinese ("肯定", "な形容词"): only cells of actual Japanese get romaji.
      if (withRo && JA.test(src) && (popup || (/[ぁ-ヿ]/.test(src) && !/[词形式的是]/.test(src)))) {
        const ro = roSpan(romaji(src), 'ro ro-b');
        ro.forEach((x) => { x.parentNode = box; });
        box.childNodes.push(...ro);
      }
    } else if (['p', 'caption', 'span', 'div'].includes(n.nodeName) && !/ro/.test(attrOf(n, 'class') ?? '')) {
      inline(n.childNodes.filter((k) => k.nodeName === 'span'));
    }
  });

  // Terms quoted in the Chinese prose: 「じゃない」 gets its romaji next to it.
  if (withRo) walk(root, (n) => {
    if (!['p', 'caption', 'li'].includes(n.nodeName)) return;
    if (n.childNodes.some((k) => /\bro\b/.test(attrOf(k, 'class') ?? ''))) return; // this item already has its own line
    for (const k of [...n.childNodes]) {
      if (k.nodeName !== '#text' || !/「[^「」]*[ぁ-ヿ][^「」]*」/.test(k.value)) continue;
      const pieces = k.value.split(/(「[^「」]{1,24}」)/).flatMap((p) => {
        const q = p.match(/^「(.+)」$/);
        if (!q || !/[ぁ-ヿ]/.test(q[1])) return [{ nodeName: '#text', value: p }];
        const kanaOnly = /^[ぁ-ヿ〜～]+$/.test(q[1]);
        return [{ nodeName: '#text', value: p }, ...roSpan(kanaOnly ? toRomaji(q[1]) : romanize(q[1]), 'ro ro-i')];
      });
      swap(k, pieces);
    }
  });
}

const order = [];
const idx = readFileSync(path.join(SRC, 'index.html'), 'utf8');
for (const m of idx.matchAll(/href="([a-z0-9_-]+)\.html"/g)) if (!order.includes(m[1])) order.push(m[1]);

rmSync(OUT, { recursive: true, force: true });
rmSync(IMG, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(IMG, { recursive: true });
const images = new Set();
const toc = [];
const SECTIONS = { introduction: '开始之前', writing: '日语书写系统', basic: '基本语法', essential: '语法精要', specialexpressions: '特定的表达方式', advanced: '高级话题', appendix: '附录' };
let section = '';
const find = (root, pred) => {
  let hit;
  walk(root, (n) => { if (!hit && pred(n)) hit = n; });
  return hit;
};

for (const slug of order) {
  const doc = parse(readFileSync(path.join(SRC, `${slug}.html`), 'utf8'));
  const h1 = find(doc, (n) => n.nodeName === 'h1' && attrOf(n, 'id') === 'page-title');
  const box = h1.parentNode;
  const orig = find(doc, (n) => n.nodeName === 'a' && textOf(n).includes('本页原文'));
  const foot = find(doc, (n) => n.nodeName === 'nav' && attrOf(n, 'class')?.includes('footer'));
  const start = box.childNodes.indexOf(h1) + 1;
  const end = foot ? box.childNodes.indexOf(foot) : box.childNodes.length;
  const main = { nodeName: 'div', tagName: 'div', attrs: [], namespaceURI: 'http://www.w3.org/1999/xhtml', childNodes: box.childNodes.slice(start, end) };
  main.childNodes.forEach((c) => { c.parentNode = main; });
  // The credit line moves to our own footer.
  main.childNodes = main.childNodes.filter((c) => !(c.nodeName === 'p' && textOf(c).includes('作者：Tae Kim')));
  transform(slug, main, images);
  const title = textOf(h1).trim();
  if (SECTIONS[slug]) section = SECTIONS[slug];
  const html = serialize(main).replace(/>\s+</g, '><').replace(/\s*\n\s*/g, ' ');
  writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify({ slug, title, section, html, orig: attrOf(orig ?? {}, 'href') ?? 'http://guidetojapanese.org/learn/' }));
  toc.push({ slug, title, section });
  console.log(slug, title, section, html.length);
}
for (const [s, name] of images) copyFileSync(path.join(SRC, s), path.join(IMG, name));
writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(toc));
console.log('pages', toc.length, 'images', images.size);
