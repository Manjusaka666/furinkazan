// Build-time only: the tokenizer dictionary is 17 MB and must never reach the browser.
import { createRequire } from 'node:module';
import path from 'node:path';
import kuromoji from 'kuromoji';
import { toRomaji } from './kana.js';

const dicPath = path.join(path.dirname(createRequire(`${process.cwd()}/`).resolve('kuromoji/package.json')), 'dict');
const tokenizer = await new Promise((ok, no) => kuromoji.builder({ dicPath }).build((e, t) => (e ? no(e) : ok(t))));

const RUBY = /([㐀-鿿豈-﫿々〆ヶ]+)\{([^}]+)\}/g;
const KANA = /^[ぁ-ゖァ-ヺー]+$/;
const GLUE = new Set(['接尾', '非自立']);
const GLUE_PARTICLE = new Set(['て', 'で', 'ば', 'たり', 'ながら', 'ちゃ', 'じゃ']);
const PUNCT = { '。': '.', '．': '.', '、': ',', '，': ',', '！': '!', '？': '?', '　': ' ', '・': ' ', '〜': '~', '「': '', '」': '', '『': '', '』': '', '（': '(', '）': ')' };

/** Marked-up source to plain text plus the readings the author (or Tatoeba, or Aozora) gave. */
function parse(src) {
  const spans = new Map();
  let plain = '';
  let last = 0;
  for (const m of src.matchAll(RUBY)) {
    plain += src.slice(last, m.index);
    spans.set(plain.length, { len: m[1].length, read: m[2] });
    plain += m[1];
    last = m.index + m[0].length;
  }
  return { plain: plain + src.slice(last), spans };
}

/** The token's kana: given readings win over the dictionary's; returns the index after the merged tokens. */
function kanaOf(tokens, i, plain, spans) {
  let end = tokens[i].word_position - 1 + tokens[i].surface_form.length;
  let j = i;
  let out = '';
  let bare = false;
  for (let p = tokens[i].word_position - 1; p < end;) {
    const s = spans.get(p);
    if (s) {
      out += s.read;
      p += s.len;
      // A reading can span tokens (日本語 is 日本 + 語): keep them as one word rather than split the reading.
      while (p > end && j + 1 < tokens.length) { j += 1; end += tokens[j].surface_form.length; }
    } else if (KANA.test(plain[p])) {
      out += plain[p];
      p += 1;
    } else {
      bare = true;
      break;
    }
  }
  if (bare) out = tokens.slice(i, j + 1).map((t) => (t.reading && t.reading !== '*' ? t.reading : t.surface_form)).join('');
  return { out, next: j + 1 };
}

const voiced = (kana) => kana.replace(/^[かきくけこさしすせそたちつてとはひふへほカキクケコサシスセソタチツテトハヒフヘホ]/, (c) => String.fromCharCode(c.charCodeAt(0) + 1));
// Old texts repeat kana with marks. 〱 usually covers two kana; a longer repeat comes out short, which the reader's note allows for.
const expandRepeats = (src) => src
  .replace(/([ぁ-ゖァ-ヺ])[ゝヽ]/g, '$1$1')
  .replace(/([ぁ-ゖァ-ヺ])[ゞヾ]/g, (_, k) => k + voiced(k))
  .replace(/([ぁ-ゖァ-ヺ]{2})〱/g, '$1$1')
  .replace(/([ぁ-ゖァ-ヺ]{2})〲/g, (_, k) => k + voiced(k))
  .replace(/[ゝゞヽヾ〱〲]/g, '');

const cache = new Map();

/** Spaced Hepburn: 私{わたし}は行{い}きます → "watashi wa ikimasu". Particles are spelled as they sound. */
export function romanize(src) {
  if (cache.has(src)) return cache.get(src);
  const { plain, spans } = parse(expandRepeats(src));
  const tokens = tokenizer.tokenize(plain);
  const words = [];
  for (let i = 0; i < tokens.length;) {
    const t = tokens[i];
    const { out, next } = kanaOf(tokens, i, plain, spans);
    let k = out;
    if (t.pos === '助詞') {
      if (k.endsWith('は') && t.surface_form.endsWith('は')) k = `${k.slice(0, -1)}わ`;
      else if (t.surface_form === 'へ') k = 'え';
      else if (t.surface_form === 'を') k = 'お';
    }
    const punct = t.surface_form in PUNCT;
    if (punct) k = PUNCT[t.surface_form];
    const prev = tokens[i - 1];
    const glued = punct || t.pos === '助動詞' || GLUE.has(t.pos_detail_1)
      || (t.pos === '助詞' && GLUE_PARTICLE.has(t.surface_form))
      || prev?.pos === '接頭詞' || (t.pos_detail_1 === '数' && prev?.pos_detail_1 === '数');
    const open = punct && (t.surface_form === '（');
    if (words.length && (glued && !open)) words[words.length - 1] += k;
    else if (k) words.push(k);
    i = next;
  }
  const r = words.map(toRomaji).join(' ').replace(/\s+/g, ' ').trim();
  cache.set(src, r);
  return r;
}
