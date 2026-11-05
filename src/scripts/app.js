import { addCards } from '../lib/srs.js';
import { getDeck, setDeck, getDone, setDone, getPrefs, setPrefs } from '../lib/store.js';

const toast = (text) => {
  const el = document.getElementById('toast');
  el.textContent = text;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.textContent = ''; }, 5000);
};

let player;
/** Plays the native recording at /audio/<au>. */
export function say(au) {
  player?.pause();
  player = new Audio(`/audio/${au}`);
  player.play().catch((e) => { if (e.name !== 'AbortError') toast('录音没有加载成功，检查网络后再试。'); });
}

const addOne = (btn) => {
  if (!setDeck(addCards(getDeck(), [btn.dataset.add], Date.now()))) return toast('无法保存进度：浏览器禁用了本地存储。');
  btn.disabled = true;
  btn.textContent = '已在复习中';
};

const finish = (btn) => {
  const saved = setDone([...new Set([...getDone(), btn.dataset.finish])])
    && setDeck(addCards(getDeck(), JSON.parse(btn.dataset.vocab), Date.now()));
  if (!saved) return toast('无法保存进度：浏览器禁用了本地存储。');
  btn.disabled = true;
  btn.textContent = btn.dataset.doneText ?? '已完成，生词已加入复习';
};

document.addEventListener('click', (e) => {
  const sayer = e.target.closest('[data-au]');
  if (sayer) return say(sayer.dataset.au);
  const done = e.target.closest('[data-finish]');
  if (done) finish(done);
  const add = e.target.closest('[data-add]');
  if (add) addOne(add);
});

// Display preferences apply to the whole site and persist.
const KEYS = ['hide-rt', 'hide-zh', 'hide-ro'];
function applyPrefs() {
  const prefs = getPrefs();
  for (const key of KEYS) document.documentElement.toggleAttribute(`data-${key}`, Boolean(prefs[key]));
  document.querySelectorAll('[data-pref]').forEach((box) => { box.checked = Boolean(prefs[box.dataset.pref]); });
}
document.querySelectorAll('[data-pref]').forEach((box) => {
  box.addEventListener('change', () => {
    setPrefs({ ...getPrefs(), [box.dataset.pref]: box.checked });
    applyPrefs();
  });
});

// Reflect finished lessons wherever they are listed.
function applyDone() {
  const done = new Set(getDone());
  document.querySelectorAll('[data-lesson]').forEach((a) => a.classList.toggle('done', done.has(a.dataset.lesson)));
  const deck = getDeck();
  document.querySelectorAll('[data-add]').forEach((b) => { if (deck[b.dataset.add]) { b.disabled = true; b.textContent = '已在复习中'; } });
  const fin = document.querySelector('[data-finish]');
  if (fin && done.has(fin.dataset.finish)) { fin.disabled = true; fin.textContent = fin.dataset.doneText ?? '已完成，生词已加入复习'; }
}
applyPrefs();
applyDone();
