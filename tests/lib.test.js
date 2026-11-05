import test from 'node:test';
import assert from 'node:assert/strict';
import { ruby, plain, reading, term, rich } from '../src/lib/ruby.js';
import { toRomaji, GOJUON } from '../src/lib/kana.js';
import { addCards, grade, dueIds, INTERVALS } from '../src/lib/srs.js';
import { merge } from '../src/lib/sync.js';
import { lessons, STAGES } from '../src/data/lessons/index.js';
import { readFileSync, readdirSync } from 'node:fs';

const json = (p) => JSON.parse(readFileSync(new URL(`../src/data/${p}`, import.meta.url), 'utf8'));

test('ruby wraps only the kanji run', () => {
  assert.equal(ruby('お願{ねが}い'), 'お<ruby>願<rp>(</rp><rt>ねが</rt><rp>)</rp></ruby>い');
  assert.equal(ruby('<b>'), '&lt;b&gt;');
});
test('plain and reading', () => {
  assert.equal(plain('日本語{にほんご}です'), '日本語です');
  assert.equal(reading('日本語{にほんご}です'), 'にほんごです');
});
test('term carries speech text; rich replaces markers', () => {
  assert.match(term('侘{わ}び'), /data-say="侘び"/);
  assert.match(rich('这是[[茶{ちゃ}]]。'), /^这是<button type="button" class="term"/);
});
test('romaji handles digraphs, geminates, long vowels', () => {
  assert.equal(toRomaji('きょうと'), 'kyouto');
  assert.equal(toRomaji('がっこう'), 'gakkou');
  assert.equal(toRomaji('まっちゃ'), 'matcha');
  assert.equal(toRomaji('コーヒー'), 'koohii');
  assert.equal(toRomaji('しんぶん'), 'shinbun');
  assert.equal(toRomaji('ありがとうございます'), 'arigatougozaimasu');
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
  assert.deepEqual(grade({ box: 0, due: 0 }, true, 0), { box: 1, due: day, at: 0 });
  assert.deepEqual(grade({ box: 4, due: 0 }, false, 5), { box: 0, due: 5, at: 5 });
  const top = INTERVALS.length - 1;
  assert.equal(grade({ box: top, due: 0 }, true, 0).box, top);
});
test('srs: dueIds returns only due cards, oldest first', () => {
  assert.deepEqual(dueIds({ a: { box: 0, due: 5 }, b: { box: 0, due: 1 }, c: { box: 0, due: 9 } }, 5), ['b', 'a']);
});

test('merge: union of lessons, newest review wins, a lapse is not undone', () => {
  const a = { done: ['x'], deck: { w: { box: 0, due: 100, at: 100 }, only: { box: 1, due: 1 } }, prefs: { 'hide-rt': true } };
  const b = { done: ['y'], deck: { w: { box: 4, due: 900, at: 50 }, other: { box: 2, due: 2 } }, prefs: { 'hide-zh': true } };
  const m = merge(a, b);
  assert.deepEqual(m.done, ['x', 'y']);
  assert.equal(m.deck.w.box, 0);
  assert.deepEqual(Object.keys(m.deck), ['only', 'other', 'w']);
  assert.deepEqual(m.prefs, { 'hide-rt': true, 'hide-zh': true });
  assert.deepEqual(merge(b, a).deck, m.deck);
  assert.deepEqual(merge(m, a), m);
});
test('merge: old cards without a timestamp fall back to the later due date; bad remote data is ignored', () => {
  assert.equal(merge({ deck: { w: { box: 1, due: 5 } } }, { deck: { w: { box: 2, due: 9 } } }).deck.w.box, 2);
  assert.deepEqual(merge({ done: ['a'], deck: {}, prefs: {} }, undefined), { done: ['a'], deck: {}, prefs: {} });
  assert.deepEqual(merge({ done: ['a'] }, { done: 'oops', deck: [], prefs: null }), { done: ['a'], deck: {}, prefs: {} });
});

test('lesson data is consistent', () => {
  const slugs = new Set();
  for (const l of lessons) {
    assert.ok(!slugs.has(l.slug), `dup slug ${l.slug}`);
    slugs.add(l.slug);
    assert.ok(STAGES[l.stage], l.slug);
    assert.ok(l.vocab.length >= 4, `${l.slug} vocab`);
    assert.ok(l.quiz.length >= 2, `${l.slug} quiz`);
    for (const q of l.quiz) assert.ok(q.c >= 0 && q.c < q.o.length, `${l.slug}: ${q.q}`);
    for (const [ja] of [...l.vocab, ...(l.dialog ?? []).map((d) => [d[1]])]) {
      // Every kanji must carry a reading: a beginner cannot read a bare one.
      const bare = ja.replace(/[㐀-鿿々]+\{[^}]+\}/g, '');
      assert.ok(!/[㐀-鿿]/.test(bare), `${l.slug}: unread kanji in ${ja}`);
    }
  }
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
  for (const g of json('course/grammar.json')) for (const e of g.ex) assert.ok(e.id && e.by, g.p);
});
test('library: index matches files, no leftover Aozora markup', () => {
  const works = json('library/index.json');
  for (const w of works) {
    const { paras } = json(`library/${w.slug}.json`);
    assert.ok(paras.length, w.slug);
    // ruby() must consume every reading, or raw {かな} shows up in the text.
    assert.ok(!paras.some((p) => /［＃|\{/.test(ruby(p))), `${w.slug}: markup`);
    assert.ok(w.base && w.card, w.slug);
  }
  assert.equal(works.length, readdirSync(new URL('../src/data/library/', import.meta.url)).length - 1);
});
