import { GOJUON } from '../lib/kana.js';
import { drawStrokes } from './strokes.js';

const $ = (id) => document.getElementById(id);
const root = $('kana');
const dialog = $('k-dialog');
const cellsAll = GOJUON.flatMap((r) => r.cells.filter(Boolean));
let script = 'hira';
let current;

const col = () => (script === 'hira' ? 1 : 2);

document.querySelectorAll('input[name="script"]').forEach((r) => r.addEventListener('change', () => {
  script = r.value;
  root.dataset.script = script;
  ask();
}));

const draw = (char) => drawStrokes($('k-stroke'), char);

function open(c) {
  current = c;
  const [roma, hira, kata, hs, ks] = c;
  const here = script === 'hira';
  const char = here ? hira : kata;
  $('k-title').textContent = char;
  $('k-roma').textContent = roma;
  $('k-other').textContent = here ? kata : hira;
  $('k-src').textContent = (here ? hs : ks) ?? '';
  dialog.querySelector('.k-info div:last-child').hidden = !(here ? hs : ks);
  dialog.showModal();
  draw(char);
}

document.addEventListener('click', (e) => {
  const cell = e.target.closest('[data-kana]');
  if (cell) return open(JSON.parse(cell.dataset.kana));
});
$('k-again').addEventListener('click', () => draw(current[col()]));
$('k-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

// Four-choice practice: a kana on top, four romaji below.
let right = 0;
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
function ask() {
  const range = $('t-range').value;
  const pool = range === 'all' ? cellsAll : GOJUON[Number(range)].cells.filter(Boolean);
  const target = pool[Math.floor(Math.random() * pool.length)];
  // Distractors come from all kana so a two-kana row still gives four choices; を shares "o" with お.
  const others = shuffle(cellsAll.filter((c) => c[0] !== target[0])).slice(0, 3);
  $('t-prompt').textContent = target[col()];
  const opts = $('t-opts');
  opts.replaceChildren(...shuffle([target, ...others]).map((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.textContent = c[0];
    b.addEventListener('click', () => {
      const ok = c === target;
      opts.querySelectorAll('.opt').forEach((o) => { o.disabled = true; if (o.textContent === target[0]) o.dataset.state = 'right'; });
      if (!ok) b.dataset.state = 'wrong';
      else right += 1;
      $('t-score').textContent = `答对 ${right} 题`;
      setTimeout(ask, ok ? 800 : 1800);
    });
    return b;
  }));
}
$('t-range').addEventListener('change', ask);
ask();
