import { SEKKI } from '../data/eras.js';
import { ruby } from '../lib/ruby.js';
import { getDone, getDeck } from '../lib/store.js';

/** The solar term in effect on a date, given entries sorted by MM-DD. */
export function sekkiFor(date) {
  const key = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  // Before 小寒 (01-05) the running term is still last year's 冬至.
  return [...SEKKI].reverse().find((s) => s[2] <= key) ?? SEKKI[SEKKI.length - 1];
}

const [name, yomi, , word, gloss] = sekkiFor(new Date());
const today = document.getElementById('today');
today.innerHTML = `<span lang="ja"><strong>${ruby(`${name}{${yomi}}`)}</strong></span><br>当令的词：<button type="button" class="term" lang="ja" data-say="${word.replace(/\{[^}]*\}/g, '')}">${ruby(word)}</button>。${gloss}。`;

// Returning learners see what they have under way; nothing here imposes an order.
const done = getDone().length;
const cards = Object.keys(getDeck()).length;
if (done || cards) document.getElementById('mine').textContent = `你已完成 ${done} 个内容，复习卡片 ${cards} 张。`;
