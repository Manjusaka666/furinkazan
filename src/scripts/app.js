import { addCards } from '../lib/srs.js';
import { getDeck, setDeck, getDone, setDone, getPrefs, setPrefs } from '../lib/store.js';

// Device voice is the fallback when no recording exists: quality varies by device and it is synthetic.
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

function speak(text) {
  if (!synth) return toast('这个浏览器不支持朗读，这句也没有真人录音。');
  if (!voice && synth.getVoices().length) return toast('这句没有真人录音，这台设备也没有日语语音。可在系统设置里添加。');
  if (!speak.told) { toast('这句没有真人录音，现在是设备的合成语音。'); speak.told = true; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = 0.85;
  if (voice) u.voice = voice;
  synth.cancel();
  synth.speak(u);
}

let player;
/** Plays the recording at /audio/<au> when there is one, otherwise the device's own Japanese voice. */
export function say(text, au) {
  synth?.cancel();
  player?.pause();
  if (!au) return speak(text);
  player = new Audio(`/audio/${au}`);
  player.play().catch((e) => { if (e.name !== 'AbortError') speak(text); });
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
  const sayer = e.target.closest('[data-say]');
  if (sayer) {
    if (sayer.tagName === 'A') e.preventDefault();
    return say(sayer.dataset.say, sayer.dataset.au);
  }
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
