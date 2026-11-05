import { addCards } from '../lib/srs.js';
import { getDeck, setDeck, getDone, setDone, getPrefs, setPrefs, getUser } from '../lib/store.js';

// Speech uses the device's own Japanese voice: nothing to download, but quality varies by device.
const synth = window.speechSynthesis;
let voice;
const pickVoice = () => { voice = synth.getVoices().find((v) => v.lang.replace('_', '-').startsWith('ja')); };
if (synth) { pickVoice(); synth.addEventListener?.('voiceschanged', pickVoice); }

const toast = (text) => {
  const el = document.getElementById('toast');
  el.textContent = text;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.textContent = ''; }, 5000);
};

export function say(text) {
  if (!synth) return toast('这个浏览器不支持朗读，请用课程右栏的原声链接。');
  if (!voice && synth.getVoices().length) toast('这台设备没有日语语音。可在系统设置里添加，或听右栏的原声。');
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = 0.85;
  if (voice) u.voice = voice;
  synth.cancel();
  synth.speak(u);
}

const answer = (btn) => {
  const q = btn.closest('[data-quiz]');
  const right = Number(q.dataset.c);
  q.querySelectorAll('.opt').forEach((o) => {
    o.disabled = true;
    if (Number(o.dataset.i) === right) o.dataset.state = 'right';
  });
  if (Number(btn.dataset.i) !== right) btn.dataset.state = 'wrong';
  const why = document.createElement('p');
  why.className = 'why';
  why.textContent = q.dataset.why;
  q.append(why);
};

const finish = (btn) => {
  const saved = setDone([...new Set([...getDone(), btn.dataset.finish])])
    && setDeck(addCards(getDeck(), JSON.parse(btn.dataset.vocab), Date.now()));
  if (!saved) return toast('无法保存进度：浏览器禁用了本地存储。');
  btn.disabled = true;
  btn.textContent = btn.dataset.doneText ?? '已完成，生词已加入复习';
};

document.addEventListener('click', (e) => {
  const sayer = e.target.closest('[data-say]');
  if (sayer) return say(sayer.dataset.say);
  const opt = e.target.closest('[data-quiz] .opt');
  if (opt) return answer(opt);
  const done = e.target.closest('[data-finish]');
  if (done) finish(done);
});

// Display preferences apply to the whole site and persist.
const KEYS = ['hide-rt', 'hide-zh'];
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
  const fin = document.querySelector('[data-finish]');
  if (fin && done.has(fin.dataset.finish)) { fin.disabled = true; fin.textContent = fin.dataset.doneText ?? '已完成，生词已加入复习'; }
}
applyPrefs();
applyDone();
addEventListener('fk:synced', () => { applyPrefs(); applyDone(); });

// Visitors who never signed in do not download the sync code.
if (getUser()) import('../lib/sync.js').then((m) => m.start());
