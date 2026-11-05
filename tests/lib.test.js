import test from 'node:test';
import assert from 'node:assert/strict';
import { ruby, plain, reading, term, rich } from '../src/lib/ruby.js';
import { toRomaji, GOJUON } from '../src/lib/kana.js';
import { addCards, grade, dueIds, INTERVALS } from '../src/lib/srs.js';
import { lessons, STAGES } from '../src/data/lessons/index.js';

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
  assert.deepEqual(grade({ box: 0, due: 0 }, true, 0), { box: 1, due: day });
  assert.deepEqual(grade({ box: 4, due: 0 }, false, 5), { box: 0, due: 5 });
  const top = INTERVALS.length - 1;
  assert.equal(grade({ box: top, due: 0 }, true, 0).box, top);
});
test('srs: dueIds returns only due cards, oldest first', () => {
  assert.deepEqual(dueIds({ a: { box: 0, due: 5 }, b: { box: 0, due: 1 }, c: { box: 0, due: 9 } }, 5), ['b', 'a']);
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
    for (const [ja] of [...l.vocab, ...l.dialog.map((d) => [d[1]])]) {
      // Every kanji must carry a reading: a beginner cannot read a bare one.
      const bare = ja.replace(/[㐀-鿿々]+\{[^}]+\}/g, '');
      assert.ok(!/[㐀-鿿]/.test(bare), `${l.slug}: unread kanji in ${ja}`);
    }
  }
});
