import { ruby, plain, reading } from '../lib/ruby.js';
import { getDeck } from '../lib/store.js';

const $ = (id) => document.getElementById(id);
const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1'];
const PAGE = 50;
const cache = {};
let shown = PAGE;
let matches = [];

const load = (lv) => (cache[lv] ??= fetch(`/data/words/${lv}.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }));

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const speak = (ja, cls) => {
  const b = el('button', cls);
  b.type = 'button';
  b.lang = 'ja';
  b.dataset.say = plain(ja);
  b.innerHTML = ruby(ja); // ruby() escapes its input
  return b;
};

function row(w, inDeck) {
  const box = el('div', 'word');
  const h = el('h3', 'word-h');
  h.append(speak(w.ja, 'term'), el('span', 'ro', ` ${w.ro}`));
  const g = el('p', 'gloss', `${w.g} `);
  const add = el('button', 'add', inDeck ? '已在复习中' : '加入复习');
  add.type = 'button';
  add.dataset.add = w.w;
  add.disabled = inDeck;
  g.append(add);
  box.append(h, g);
  if (w.ex.length) {
    const d = el('details');
    d.append(el('summary', '', `例句 ${w.ex.length}`));
    for (const e of w.ex) {
      d.append(speak(e.ja, 'say-line'), el('p', 'ro', e.ro));
      if (e.zh) d.append(el('p', 'zh', e.zh));
      const src = el('p', 'ex-src');
      const a = el('a', '', `Tatoeba #${e.id}`);
      a.href = `https://tatoeba.org/sentences/show/${e.id}`;
      a.rel = 'noopener';
      src.append(a, `，${e.by}`);
      d.append(src);
    }
    box.append(d);
  }
  return box;
}

function paint() {
  const deck = getDeck();
  $('w-list').replaceChildren(...matches.slice(0, shown).map((w) => row(w, Boolean(deck[w.w]))));
  $('w-count').textContent = `${matches.length} 个词`;
  $('w-more').hidden = shown >= matches.length;
}

let run = 0;
async function update() {
  const mine = ++run;
  const lv = document.querySelector('input[name="level"]:checked').value;
  const q = $('w-q').value.trim().toLowerCase();
  // A search looks across every level; browsing stays on the one picked, so a phone only fetches what it shows.
  const wanted = q || lv === 'all' ? (q && lv !== 'all' ? [lv, ...LEVELS.filter((l) => l !== lv)] : LEVELS) : [lv];
  try {
    const rows = (await Promise.all(wanted.map(load))).flat();
    if (mine !== run) return;
    matches = q ? rows.filter((w) => w.w.includes(q) || reading(w.ja).includes(q) || w.ro.replaceAll(' ', '').includes(q.replaceAll(' ', '')) || w.g.toLowerCase().includes(q)) : rows;
    shown = PAGE;
    paint();
  } catch {
    $('w-count').textContent = '词表没有加载成功。检查网络后再试。';
  }
}

let t;
$('w-q').addEventListener('input', () => { clearTimeout(t); t = setTimeout(update, 150); });
document.querySelectorAll('input[name="level"]').forEach((r) => r.addEventListener('change', update));
$('w-more').addEventListener('click', () => { shown += PAGE; paint(); });

const param = new URLSearchParams(location.search);
if (LEVELS.includes(param.get('level'))) document.querySelector(`input[value="${param.get('level')}"]`).checked = true;
update();
