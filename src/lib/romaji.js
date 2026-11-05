// Build-time only: the tokenizer dictionary is 17 MB and must never reach the browser.
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import kuromoji from 'kuromoji';
import { toRomaji } from './kana.js';

const dicPath = path.join(path.dirname(createRequire(`${process.cwd()}/`).resolve('kuromoji/package.json')), 'dict');
const tokenizer = await new Promise((ok, no) => kuromoji.builder({ dicPath }).build((e, t) => (e ? no(e) : ok(t))));

// Readings worked out ahead of time by scripts/annotate.mjs. MeCab + UniDic reads far better than kuromoji but cannot run on the host.
const tablePath = path.join(process.cwd(), 'src/data/romaji.json');  // cwd, not import.meta.url: Astro bundles this file elsewhere
const table = existsSync(tablePath) ? JSON.parse(readFileSync(tablePath, 'utf8')) : { ro: {}, auto: {} };
export const digest = (s) => createHash('sha1').update(s).digest('base64url').slice(0, 12);

const RUBY = /([㐀-鿿豈-﫿々〆ヶ〇]+)\{([^}]+)\}/g;
const KANA = /^[ぁ-ゖァ-ヺー]+$/;
const GLUE = new Set(['接尾', '非自立']);
const COPULA = new Set(['だ', 'です', 'な', 'だっ', 'でし', 'だろ', 'でしょ']);
const GLUE_PARTICLE = new Set(['て', 'で', 'ば', 'たり', 'ながら', 'ちゃ', 'じゃ']);
const PUNCT = { '。': '.', '．': '.', '、': ',', '，': ',', '！': '!', '？': '?', '　': ' ', '・': ' ', '〜': '~', '「': '', '」': '', '『': '', '』': '', '（': '(', '）': ')' };

/** Marked-up source to plain text plus the readings the author (or Tatoeba, or Aozora) gave. */
function parse(src) {
  const spans = new Map();
  let plain = '';
  let last = 0;
  for (const m of src.matchAll(RUBY)) {
    plain += src.slice(last, m.index).replaceAll('\u200b', '');
    spans.set(plain.length, { len: m[1].length, read: m[2] });
    plain += m[1];
    last = m.index + m[0].length;
  }
  return { plain: plain + src.slice(last).replaceAll('\u200b', ''), spans };
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

/** Plain text and given readings, repeat marks expanded: what analyse() and scripts/annotate.mjs start from. */
export const parseSource = (src) => parse(expandRepeats(src));

/** Each word of the text with its kana as spoken: particles sound as they do, given readings win. */
export function analyse({ plain, spans }) {
  const tokens = tokenizer.tokenize(plain);
  const out = [];
  for (let i = 0; i < tokens.length;) {
    const t = tokens[i];
    const { out: kana, next } = kanaOf(tokens, i, plain, spans);
    let k = kana;
    if (t.pos === '助詞') {
      if (k.endsWith('は') && t.surface_form.endsWith('は')) k = `${k.slice(0, -1)}わ`;
      else if (t.surface_form === 'へ') k = 'え';
      else if (t.surface_form === 'を') k = 'お';
    }
    const punct = t.surface_form in PUNCT;
    const prev = tokens[i - 1];
    const copula = t.pos === '助動詞' && COPULA.has(t.surface_form) && prev?.pos !== '動詞' && prev?.pos !== '助動詞';
    const glued = punct || (t.pos === '助動詞' && !copula) || (GLUE.has(t.pos_detail_1) && t.pos !== '名詞')
      || (t.pos === '助詞' && GLUE_PARTICLE.has(t.surface_form))
      || prev?.pos === '接頭詞' || (t.pos_detail_1 === '数' && prev?.pos_detail_1 === '数');
    const last = tokens[next - 1];
    out.push({
      at: t.word_position - 1, end: last.word_position - 1 + last.surface_form.length,
      kana: k, roma: punct ? PUNCT[t.surface_form] : null, glued: glued && t.surface_form !== '（',
    });
    i = next;
  }
  return { plain, tokens: out };
}

export function spaced(tokens) {
  const words = [];
  for (const t of tokens) {
    const k = t.roma ?? t.kana;
    if (words.length && t.glued) words[words.length - 1] += k;
    else if (k) words.push(k);
  }
  return words.map(toRomaji).join(' ').replace(/\s+/g, ' ').trim();
}

/** Spaced Hepburn: 私{わたし}は行{い}きます → "watashi wa ikimasu". Text scripts/annotate.mjs has read comes from its table. */
export function romanize(src) {
  const known = table.ro[digest(src)];
  if (known !== undefined) return known;
  if (process.env.RO_MISS) appendFileSync(process.env.RO_MISS, `${JSON.stringify(src)}\n`);
  return spaced(analyse(parseSource(src)).tokens);
}

const hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const KANJI_RUN = /([㐀-鿿豈-﫿々〆ヶ〇]+)/;

/** Machine furigana for text no one annotated: 食べる → 食{た}べる. Words the dictionary cannot read stay bare. */
export function autoRuby(text) {
  const known = table.auto[digest(text)];
  if (known !== undefined) return known;
  return tokenizer.tokenize(text).map((t) => {
    const s = t.surface_form;
    if (!KANJI_RUN.test(s) || !t.reading || t.reading === '*') return s;
    const parts = s.split(KANJI_RUN);
    const m = hira(t.reading).match(new RegExp(`^${parts.map((p) => (KANJI_RUN.test(p) ? '(.+?)' : hira(p))).join('')}$`));
    if (!m) return s;
    let i = 1;
    return parts.map((p) => (KANJI_RUN.test(p) ? `${p}{${m[i++]}}` : p)).join('');
  }).join('');
}
