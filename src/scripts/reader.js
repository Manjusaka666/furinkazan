import { say } from './app.js';

const paras = [...document.querySelectorAll('#text p')];
const textOf = (p) => {
  const c = p.cloneNode(true);
  c.querySelectorAll('rt, rp').forEach((n) => n.remove());
  return c.textContent;
};

document.getElementById('read-aloud').addEventListener('click', () => {
  const picked = getSelection().toString().trim();
  say(picked || textOf(paras.find((p) => p.getBoundingClientRect().bottom > 60) ?? paras[0]));
});

// Romaji arrives in its own file so a reader who hides it downloads nothing extra.
const box = document.querySelector('[data-pref="hide-ro"]');
let loaded = false;
async function loadRomaji() {
  if (loaded || box.checked) return;
  loaded = true;
  try {
    const lines = await fetch(`/data/romaji/${document.getElementById('text').dataset.slug}.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
    paras.forEach((p, i) => {
      if (!lines[i]) return;
      const ro = document.createElement('p');
      ro.className = 'ro';
      ro.lang = 'ja-Latn';
      ro.textContent = lines[i];
      p.after(ro);
    });
  } catch {
    loaded = false;
  }
}
box.addEventListener('change', loadRomaji);
// app.js applies stored prefs before this deferred module runs.
loadRomaji();
