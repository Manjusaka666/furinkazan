import { toRomaji } from '../lib/kana.js';

const q = document.getElementById('k-q');
const out = document.getElementById('k-results');
const groups = document.getElementById('k-groups');
const count = document.getElementById('k-count');
const MAX = 200;
let rows;

const hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

const load = () => (rows ??= fetch('/data/kanji-index.json').then((r) => r.json()).then((list) => list.map(([c, s, on, kun, en]) => {
  const read = `${on} ${kun}`.trim().split(/\s+/);
  return { c, s, read: read.map(hira), ro: read.map(toRomaji), en: en.toLowerCase() };
})));

async function search() {
  const v = q.value.trim().toLowerCase();
  groups.hidden = !!v;
  out.hidden = !v;
  if (!v) { count.textContent = ''; return; }
  let list;
  try {
    list = await load();
  } catch {
    rows = undefined; // a later keystroke retries
    count.textContent = '搜索数据加载失败，请检查网络后重试。';
    return;
  }
  const kana = hira(v);
  const words = v.replace(/[^a-z-]/g, '');
  const hit = list.filter((k) => v.includes(k.c) || (k.s && v.includes(k.s))
    || k.read.some((r) => r.startsWith(kana))
    || (words && (k.ro.some((r) => r.startsWith(words)) || k.en.split(/[ ,]+/).includes(words) || (words.length > 2 && k.en.includes(words)))));
  if (q.value.trim().toLowerCase() !== v) return; // a newer keystroke will render
  count.textContent = hit.length > MAX ? `找到 ${hit.length} 个字，显示前 ${MAX} 个。` : hit.length ? `找到 ${hit.length} 个字。` : '没有找到。常用汉字表之外的字这里没有收录。';
  out.replaceChildren(...hit.slice(0, MAX).map((k) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `/kanji/${k.c}/`;
    a.textContent = k.c;
    a.lang = 'ja';
    li.append(a);
    return li;
  }));
}
q.addEventListener('input', search);
