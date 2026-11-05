// Works out romaji and furigana ahead of time with MeCab + UniDic and writes src/data/romaji.json.
// Usage: node scripts/annotate.mjs UNIDIC_DIR KANJIDIC2.json REVIEW.tsv [EXTRA.jsonl]   (mecab on PATH; EXTRA from a build with RO_MISS=file)
// Precedence for each word: readings in the source (Aozora, Tatoeba, Tae Kim) > FIXES > UniDic > a kanji's first on-reading.
// REVIEW.tsv lists where kuromoji reads the text differently from the result, most frequent first; those were read by hand.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { analyse, autoRuby, digest, parseSource, spaced } from '../src/lib/romaji.js';
import { toRomaji } from '../src/lib/kana.js';

const [dic, kanjidic, reviewPath, extra] = process.argv.slice(2);
const json = (p) => JSON.parse(readFileSync(new URL(`../src/data/${p}`, import.meta.url), 'utf8'));
const dir = (p) => readdirSync(new URL(`../src/data/${p}/`, import.meta.url)).filter((f) => f !== 'index.json');
const fixes = JSON.parse(readFileSync(new URL('./romaji-fixes.json', import.meta.url), 'utf8'));

const hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const HAS_KANJI = /[㐀-鿿豈-﫿々〆ヶ〇0-9０-９]/;
const KANJI_RUN = /([㐀-鿿豈-﫿々〆ヶ〇]+)/;

function mecab(lines) {
  const out = spawnSync('mecab', ['-d', dic, '-r', '/dev/null', '-b', '4000000', '-O', '', '-F', '%m\t%f[0]\t%f[17]\n', '-U', '%m\t\t\n', '-E', 'EOS\n'], { input: `${lines.join('\n')}\n`, maxBuffer: 2 ** 31 - 1 });
  if (out.status !== 0) throw new Error(out.stderr.toString());
  return out.stdout.toString().split('EOS\n');
}

/** Words read by context, plus hand fixes from reviewing REVIEW.tsv. UniDic reads 何か as nanka and 私 as watakushi; suffixes keep its reading. */
function fixed(tok, next) {
  if (tok.pos1 === '接尾辞') return undefined;
  if (tok.m === '何') return next && (/^[でだのとてど]/.test(next.m) || /^(?:人|時|回|年|月|日|歳|度|本|枚|個|匹|遍|番|十|百|千|万)/.test(next.m)) && next.m !== 'でも' ? 'なん' : 'なに';
  if (tok.m === '実') return next && /^[がを]/.test(next.m) ? 'み' : 'じつ';
  return fixes[tok.m];
}

// A lone digit before a counter is read as the numeral, so １杯 is ippai and 8日 is youka rather than a digit with a guessed sound.
const NUM = { 0: '〇', 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九', '０': '〇', '１': '一', '２': '二', '３': '三', '４': '四', '５': '五', '６': '六', '７': '七', '８': '八', '９': '九' };
// Old forms are looked up as their modern kanji; same length, so offsets still hold.
const OLD = '來来樣様聲声顏顔參参處処騷騒隨随窻窓兩両輕軽應応邊辺餘余臺台譯訳默黙爭争勞労祕秘隱隠亂乱拜拝驅駆髮髪氣気當当體体惡悪會会變変國国學学實実舊旧廣広權権條条舉挙與与萬万寶宝歸帰觀観關関歡歓經経輕軽險険驗験獨独讀読賣売續続數数樂楽藥薬斷断繼継發発廢廃櫻桜壓圧圍囲醫医榮栄營営驛駅鹽塩價価假仮畫画擴拡覺覚嶽岳樂楽勸勧寬寛陷陥歸帰戲戯舊旧據拠區区輕軽縣県儉倹劍剣嚴厳廣広恆恒黃黄號号碎砕濟済齋斎雜雑贊賛蠶蚕殘残絲糸齒歯兒児辭辞實実寫写釋釈壽寿收収從従澁渋獸獣縱縦肅粛將将稱称證証燒焼奬奨讓譲釀醸觸触寢寝眞真盡尽粹粋醉酔穗穂瀨瀬齊斉靜静竊窃專専戰戦淺浅潛潜纖繊禪禅壯壮搜捜巢巣騷騒藏蔵贈贈臟臓屬属對対帶帯滯滞瀧滝擇択澤沢單単團団彈弾遲遅晝昼蟲虫鑄鋳聽聴敕勅鎭鎮遞逓鐵鉄轉転點点傳伝黨党盜盗燈灯稻稲鬪闘德徳獨独貳弐腦脳霸覇廢廃賣売麥麦發発髮髪拔抜飯飯祕秘濱浜拂払佛仏竝並邊辺辯弁瓣弁辨弁豐豊冐冒沒没飜翻滿満默黙彌弥譽誉豫予搖揺謠謡樣様來来賴頼亂乱覽覧龍竜兩両獵猟綠緑壘塁勵励禮礼靈霊齡齢戀恋爐炉勞労郞郎樓楼錄録灣湾';
const MODERN = new Map(OLD.match(/../gu).map((p) => [...p]));
const modern = (s) => s.replace(/[㐀-鿿豈-﫿]/gu, (c) => MODERN.get(c) ?? c);
const on = new Map();
for (const k of JSON.parse(readFileSync(kanjidic, 'utf8')).characters) {
  const r = k.readingMeaning?.groups?.[0]?.readings?.find((x) => x.type === 'ja_on');
  if (r) on.set(k.literal, hira(r.value));
}
const numerals = (s) => s.replace(/(?<![0-9０-９.,，．])[1-9１-９](?![0-9０-９.,，．])(?=[㐀-鿿])/g, (d) => NUM[d]);

/** Historical kana to how it sounds today: さふらふ → そうろう, しうりんゐん → しゅうりんいん. Applied to the ruby of old-spelling works. */
const ROWS = { あ: 'お', か: 'こ', さ: 'そ', た: 'と', な: 'の', は: 'ほ', ま: 'も', や: 'よ', ら: 'ろ', わ: 'お', が: 'ご', ざ: 'ぞ', だ: 'ど', ば: 'ぼ', ぱ: 'ぽ' };
const IU = { い: 'ゆ', き: 'きゅ', し: 'しゅ', ち: 'ちゅ', に: 'にゅ', ひ: 'ひゅ', み: 'みゅ', り: 'りゅ', ぎ: 'ぎゅ', じ: 'じゅ', び: 'びゅ', ぴ: 'ぴゅ' };
const EU = { え: 'よ', け: 'きょ', せ: 'しょ', て: 'ちょ', ね: 'にょ', へ: 'ひょ', め: 'みょ', れ: 'りょ', げ: 'ぎょ', ぜ: 'じょ', で: 'じょ', べ: 'びょ', ぺ: 'ぴょ' };
function modernKana(k) {
  const s = k.replace(/くわ/g, 'か').replace(/ぐわ/g, 'が').replace(/ゐ/g, 'い').replace(/ゑ/g, 'え').replace(/を/g, 'お').replace(/ぢ/g, 'じ').replace(/づ/g, 'ず')
    .replace(/(?<=.)[はひふへほ]/g, (c) => ({ は: 'わ', ひ: 'い', ふ: 'う', へ: 'え', ほ: 'お' })[c]);
  return s.replace(/(.)う/g, (m, c) => (ROWS[c] ? `${ROWS[c]}う` : IU[c] ? `${IU[c]}う` : EU[c] ? `${EU[c]}う` : m));
}

function spansFor(item, rows) {
  const spans = new Map(item.spans);
  if (item.old) for (const s of spans.values()) s.read = modernKana(s.read);
  const taken = (at, len) => [...item.spans].some(([p, s]) => p < at + len && at < p + s.len);
  const toks = [];
  let pos = 0;
  for (const row of rows.split('\n')) {
    if (!row) continue;
    const [m, pos1, kana] = row.split('\t');
    const at = item.mapped.indexOf(m, pos);
    if (at < 0) continue;
    // A hand fix may span several tokens (岸本 + 斉 + 史): merge them so it applies, and the ruby sits on the whole name.
    const prev = toks.at(-1);
    toks.push({ m, pos1, kana, at });
    pos = at + m.length;
    if (prev && prev.at + prev.m.length === at) {
      for (let n = 2, joined = m; n <= Math.min(6, toks.length); n += 1) {
        joined = toks.at(-n).m + joined;
        if (typeof fixes[joined] === 'string') { const first = toks.at(-n); toks.splice(-n, n, { ...first, m: joined, kana: fixes[joined] }); break; }
      }
    }
  }
  for (const [i, t] of toks.entries()) {
    if (taken(t.at, t.m.length)) continue;
    const read = fixed(t, toks[i + 1]) ?? (t.kana && hira(t.kana));
    if (!read || read === '*' || /^[0-9０-９]+$/.test(read)) continue;
    if (HAS_KANJI.test(t.m) || (item.old && hira(t.m) !== read)) spans.set(t.at, { len: t.m.length, read });
  }
  // What no dictionary word covered: the kanji's first on-reading beats showing a raw kanji in the romaji.
  const covered = new Set();
  for (const [at, s] of spans) for (let i = at; i < at + s.len; i += 1) covered.add(i);
  for (const m of item.mapped.matchAll(/[㐀-鿿豈-﫿]/gu)) if (!covered.has(m.index) && on.has(m[0])) spans.set(m.index, { len: 1, read: on.get(m[0]) });
  return { spans, toks };
}

const sources = new Map();
const add = (src, old = false, auto = false) => { if (src && /[㐀-鿿ぁ-ゖァ-ヺ0-9]/.test(src)) { const s = sources.get(src); sources.set(src, { old: old || s?.old, auto: auto || s?.auto }); } };
for (const w of [...['n5', 'n4', 'n3', 'n2', 'n1'].flatMap((l) => json(`course/${l}.json`)), ...Object.values(json('course/topics.json')).flat()]) { add(w.ja); w.ex.forEach((e) => add(e.ja)); }
for (const f of dir('library')) { const w = json(`library/${f}`); w.paras.forEach((p) => add(p, w.kana.includes('旧仮名'))); }
if (existsSync(new URL('../src/data/wiki/index.json', import.meta.url))) for (const f of dir('wiki')) for (const b of json(`wiki/${f}`).jaText) if (b.p) add(b.p, false, true);
if (extra && existsSync(extra)) for (const line of readFileSync(extra, 'utf8').split('\n')) if (line) add(JSON.parse(line));

const items = [...sources].map(([src, o]) => { const p = parseSource(src); return { src, ...o, ...p, mapped: modern(numerals(p.plain)) }; });
for (const [old, now] of [['さふらふ', 'そうろう'], ['しうりんゐん', 'しゅうりんいん'], ['くわをく', 'かおく'], ['ほふし', 'ほうし'], ['てふ', 'ちょう'], ['やう', 'よう'], ['けふ', 'きょう'], ['おもふ', 'おもう'], ['かは', 'かわ'], ['あふ', 'おう']]) if (modernKana(old) !== now) throw new Error(`modernKana ${old}: ${modernKana(old)}`);
// Lines are read one by one so a stray newline in one text cannot shift the rest.
const parsed = mecab(items.map((i) => i.mapped.replace(/\s/g, ' ')));
const table = { ro: {}, auto: {} };
let shifted = 0;
const review = new Map();
// Spelling of long vowels (とう / トー) and のって/云って pairs are not disagreements.
const norm = (k) => toRomaji(k).replace(/[^a-z]/g, '').replace(/ou/g, 'o').replace(/ei/g, 'e').replace(/([aiueo])\1+/g, '$1');
let raw = 0;
const left = new Map();
for (const [n, item] of items.entries()) {
  const { spans, toks } = spansFor(item, parsed[n] ?? '');
  // MeCab must hand back exactly the line it was given, or every later line is misread.
  if (toks.map((t) => t.m).join('').replace(/\s/g, '') !== item.mapped.replace(/\s/g, '')) shifted += 1;
  const { tokens } = analyse({ plain: item.plain, spans });
  const ro = spaced(tokens);
  table.ro[digest(item.src)] = ro;
  if (/[㐀-鿿]/.test(ro)) { raw += 1; for (const c of ro.match(/[㐀-鿿]+/g)) left.set(c, (left.get(c) ?? 0) + 1); }
  if (item.auto) {
    // Same readings as the romaji, split so that okurigana stays outside the ruby. A word that will not split stays bare.
    let out = '';
    let last = 0;
    for (const t of toks) {
      const s = spans.get(t.at);
      out += item.plain.slice(last, t.at);
      last = t.at + t.m.length;
      const orig = item.plain.slice(t.at, t.at + t.m.length);
      if (!s || !KANJI_RUN.test(orig)) { out += orig; continue; }
      const parts = t.m.split(KANJI_RUN);
      const m = hira(s.read).match(new RegExp(`^${parts.map((p) => (KANJI_RUN.test(p) ? '(.+?)' : hira(p))).join('')}$`));
      let i = 1;
      out += m && orig === t.m ? parts.map((p) => (KANJI_RUN.test(p) ? `${p}{${m[i++]}}` : p)).join('') : orig;
    }
    out += item.plain.slice(last);
    table.auto[digest(item.src)] = out;
    table.ro[digest(out)] = ro;
  }
  // Second opinion on every word: compare with what kuromoji alone would have read.
  const base = analyse({ plain: item.plain, spans: item.spans }).tokens;
  for (const t of toks) {
    const k = base.filter((b) => b.at < t.at + t.m.length && t.at < b.end);
    if (!HAS_KANJI.test(t.m) || k.length !== 1 || k[0].at !== t.at || k[0].end !== t.at + t.m.length) continue;
    const s = spans.get(t.at);
    if (!s || item.spans.has(t.at) || norm(hira(k[0].kana)) === norm(s.read)) continue;
    const key = `${t.m}\t${hira(k[0].kana)}\t${s.read}`;
    const r = review.get(key) ?? { n: 0, eg: item.plain.slice(Math.max(0, t.at - 8), t.at + t.m.length + 8) };
    r.n += 1;
    review.set(key, r);
  }
}
writeFileSync(new URL('../src/data/romaji.json', import.meta.url), JSON.stringify(table));
writeFileSync(reviewPath, [...review].sort((a, b) => b[1].n - a[1].n).map(([k, r]) => `${r.n}\t${k}\t${r.eg.replace(/\s/g, ' ')}`).join('\n'));
writeFileSync(`${reviewPath}.left`, [...left].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n}\t${k}`).join('\n'));
console.log('misaligned', shifted, 'texts', items.length, 'with raw kanji left', raw, 'review rows', review.size, 'occurrences', [...review.values()].reduce((a, r) => a + r.n, 0));
