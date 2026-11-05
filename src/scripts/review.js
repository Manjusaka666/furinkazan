import { dueIds, grade } from '../lib/srs.js';
import { ruby } from '../lib/ruby.js';
import { getDeck, setDeck } from '../lib/store.js';
import { say } from './app.js';

const card = document.getElementById('r-card');
const text = (id, v) => { document.getElementById(id).textContent = v; };
let words = {};
let deck = getDeck();

const el = (tag, cls, content) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (content !== undefined) n.textContent = content;
  return n;
};
const btn = (label, cls, fn) => {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', fn);
  return b;
};
const link = (href, label) => { const a = el('a', 'btn', label); a.href = href; return a; };

function stats(due) {
  const all = Object.values(deck);
  text('r-due', due);
  text('r-total', all.length);
  text('r-long', all.filter((c) => c.box >= 4).length);
}

function next() {
  // A word removed from the course stays in localStorage but can no longer be shown.
  const due = dueIds(deck, Date.now()).filter((id) => words[id]);
  stats(due.length);
  if (!Object.keys(deck).length) {
    return card.replaceChildren(el('p', '', '还没有卡片。学完一课后点「完成本课」，生词就会到这里。'), link('/learn/', '去上课'));
  }
  if (!due.length) {
    return card.replaceChildren(el('p', '', '今天的卡片都复习完了。明天再来，或者继续学新课。'), link('/learn/', '继续学习'));
  }
  show(due[0]);
}

function show(id) {
  const w = words[id];
  const front = el('p', 'front');
  front.lang = 'ja';
  front.textContent = id;
  const row = el('div', 'row');
  row.append(
    btn('听发音', 'btn ghost', () => say(id)),
    btn('看答案', 'btn', () => {
      front.innerHTML = ruby(w.ja);
      const back = el('p', 'back', `${w.zh}（第 ${w.n} 课）`);
      const rate = el('div', 'row');
      const mark = (ok) => () => {
        deck = { ...deck, [id]: grade(deck[id], ok, Date.now()) };
        setDeck(deck);
        next();
      };
      rate.append(btn('忘了', 'btn ghost', mark(false)), btn('记得', 'btn', mark(true)));
      card.replaceChildren(front, back, rate);
      say(id);
    }),
  );
  card.replaceChildren(front, row);
}

fetch('/deck.json')
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then((d) => { words = d; next(); })
  .catch(() => card.replaceChildren(el('p', '', '词库没有加载成功。检查网络后刷新这一页，你的进度没有丢失。')));
