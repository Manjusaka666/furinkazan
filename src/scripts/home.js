import { SEKKI } from '../data/eras.js';
import { ruby } from '../lib/ruby.js';
import { getDone } from '../lib/store.js';

/** The solar term in effect on a date, given entries sorted by MM-DD. */
export function sekkiFor(date) {
  const key = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  // Before 小寒 (01-05) the running term is still last year's 冬至.
  return [...SEKKI].reverse().find((s) => s[2] <= key) ?? SEKKI[SEKKI.length - 1];
}

const [name, yomi, , word, gloss] = sekkiFor(new Date());
const today = document.getElementById('today');
today.innerHTML = `<span lang="ja"><strong>${ruby(`${name}{${yomi}}`)}</strong></span><br>当令的词：<button type="button" class="term" lang="ja" data-say="${word.replace(/\{[^}]*\}/g, '')}">${ruby(word)}</button>。${gloss}。`;

// Returning learners continue where they stopped.
const index = JSON.parse(document.getElementById('lesson-index').dataset.slugs);
const done = new Set(getDone());
if (done.size) {
  const next = index.find(([slug]) => !done.has(slug));
  const cta = document.getElementById('continue');
  if (next) {
    cta.href = `/learn/${next[0]}/`;
    cta.textContent = `继续第 ${next[2]} 课`;
  } else {
    cta.href = '/review/';
    cta.textContent = '全部学完了，去复习';
  }
  for (const stage of new Set(index.map((l) => l[1]))) {
    const n = index.filter((l) => l[1] === stage && done.has(l[0])).length;
    if (n) document.querySelector(`[data-stage-done="${stage}"]`).textContent = `，已完成 ${n} 课`;
  }
}
