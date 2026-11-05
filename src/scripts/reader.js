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
