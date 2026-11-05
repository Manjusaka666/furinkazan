import test from 'node:test';
import assert from 'node:assert/strict';
import { ruby, plain, reading } from '../src/lib/ruby.js';
import { romanize } from '../src/lib/romaji.js';
import { toRomaji, GOJUON } from '../src/lib/kana.js';
import { addCards, grade, dueIds, INTERVALS } from '../src/lib/srs.js';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const json = (p) => JSON.parse(readFileSync(new URL(`../src/data/${p}`, import.meta.url), 'utf8'));

test('ruby wraps only the kanji run', () => {
  assert.equal(ruby('お願{ねが}い'), 'お<ruby>願<rp>(</rp><rt>ねが</rt><rp>)</rp></ruby>い');
  assert.equal(ruby('<b>'), '&lt;b&gt;');
});
test('plain and reading', () => {
  assert.equal(plain('日本語{にほんご}です'), '日本語です');
  assert.equal(reading('日本語{にほんご}です'), 'にほんごです');
});
test('romaji handles digraphs, geminates, long vowels', () => {
  assert.equal(toRomaji('きょうと'), 'kyouto');
  assert.equal(toRomaji('がっこう'), 'gakkou');
  assert.equal(toRomaji('まっちゃ'), 'matcha');
  assert.equal(toRomaji('コーヒー'), 'koohii');
  assert.equal(toRomaji('しんぶん'), 'shinbun');
  assert.equal(toRomaji('ありがとうございます'), 'arigatougozaimasu');
});
test('romanize spaces words, spells particles as spoken, trusts given readings', () => {
  assert.equal(romanize('私{わたし}は学校{がっこう}へ行{い}きました。'), 'watashi wa gakkou e ikimashita.');
  assert.equal(romanize('本{ほん}を読{よ}んでいます'), 'hon o yondeimasu');
  assert.equal(romanize('日本語{にっぽんご}'), 'nippongo');
  assert.equal(romanize('東京'), 'toukyou');
});
test('romanize reads old spellings and repeat marks', () => {
  assert.equal(toRomaji('くれなゐ'), 'kurenai');
  assert.equal(toRomaji('ティー'), 'tii');
  assert.equal(romanize('こゝろ'), 'kokoro');
  assert.match(romanize('たま〱'), /tamatama/);
  assert.match(romanize('悉{こと〲}く'), /kotogotoku/);
});
test('gojuon has 46 kana', () => {
  assert.equal(GOJUON.flatMap((r) => r.cells).filter(Boolean).length, 46);
});

test('srs: new cards are due now, existing cards are not reset', () => {
  const d = addCards({ a: { box: 3, due: 99 } }, ['a', 'b'], 10);
  assert.deepEqual(d.a, { box: 3, due: 99 });
  assert.deepEqual(d.b, { box: 0, due: 10 });
});
test('srs: remembering climbs, forgetting resets, top box is capped', () => {
  const day = 86_400_000;
  assert.deepEqual(grade({ box: 0, due: 0 }, true, 0), { box: 1, due: day });
  assert.deepEqual(grade({ box: 4, due: 0 }, false, 5), { box: 0, due: 5 });
  const top = INTERVALS.length - 1;
  assert.equal(grade({ box: top, due: 0 }, true, 0).box, top);
});
test('srs: dueIds returns only due cards, oldest first', () => {
  assert.deepEqual(dueIds({ a: { box: 0, due: 5 }, b: { box: 0, due: 1 }, c: { box: 0, due: 9 } }, 5), ['b', 'a']);
});

test('course data: every word has a meaning, every example credits its author', () => {
  const seen = new Set();
  for (const lv of ['n5', 'n4', 'n3', 'n2', 'n1']) {
    for (const w of json(`course/${lv}.json`)) {
      assert.ok(w.zh || w.en, w.w);
      assert.ok(!seen.has(w.w), `dup ${w.w}`);
      seen.add(w.w);
      for (const e of w.ex) assert.ok(e.id && e.by, w.w);
    }
  }
});
test('library: index matches files, no leftover Aozora markup', () => {
  const works = json('library/index.json');
  for (const w of works) {
    const { paras } = json(`library/${w.slug}.json`);
    assert.ok(paras.length, w.slug);
    // ruby() must consume every reading, or raw {かな} shows up in the text.
    assert.ok(!paras.some((p) => /［＃|／[＼\\]|\{/.test(ruby(p))), `${w.slug}: markup`);
    assert.ok(w.base && w.card, w.slug);
  }
  assert.equal(works.length, readdirSync(new URL('../src/data/library/', import.meta.url)).length - 1);
});

test('topic words: every scene and anime has its own words, all with a meaning', async () => {
  const { scenes } = await import('../src/data/scenes.js');
  const { anime } = await import('../src/data/anime.js');
  const topics = json('course/topics.json');
  for (const x of [...scenes, ...anime]) {
    assert.ok(topics[x.slug]?.length >= 4, `${x.slug}: too few words`);
    for (const w of topics[x.slug]) assert.ok(w.zh || w.en, `${x.slug}: ${w.w}`);
  }
});
test('kanji: the whole jōyō list, each with stroke paths and at least one reading', () => {
  const kanji = json('kanji.json');
  assert.equal(new Set(kanji.map((k) => k.c)).size, 2136);
  for (const k of kanji) {
    assert.ok(k.d.length > 0, k.c);
    assert.ok(k.on.length + k.kun.length > 0, k.c);
  }
});

test('grammar: every page is imported and credits nothing to this site', () => {
  const toc = json('grammar/index.json');
  assert.equal(toc.length, 70);
  for (const t of toc) {
    const g = json(`grammar/${t.slug}.json`);
    assert.ok(g.html.length > 100 && g.orig, t.slug);
    assert.ok(!/onclick|<script|<iframe/i.test(g.html), `${t.slug}: live markup from the source`);
  }
});
test('wiki: every topic has Japanese text, a source link and a retrieval date', () => {
  for (const t of json('wiki/index.json')) {
    const w = json(`wiki/${t.slug}.json`);
    assert.ok(w.jaText.length > 0 && w.jaUrl.startsWith('https://ja.wikipedia.org/') && w.date, t.slug);
  }
});
test('audio: every path in the manifests exists on disk', () => {
  const has = (p) => existsSync(new URL(`../public/audio/${p}`, import.meta.url));
  for (const [k, p] of Object.entries(json('audio-words.json'))) assert.ok(has(p), k);
  for (const [k, a] of Object.entries(json('audio-sentences.json'))) assert.ok(has(a[0]), k);
  for (const c of GOJUON.flatMap((r) => r.cells).filter(Boolean)) assert.ok(has(`kana/${c[0]}.aac`), c[0]);
});
