const SVG = 'http://www.w3.org/2000/svg';
let data; // one fetch per page, on first use

const num = (d, i, delay) => {
  const m = d.match(/M\s*([\d.]+)[,\s]+([\d.]+)/);
  const t = document.createElementNS(SVG, 'text');
  t.setAttribute('x', Number(m[1]) - 6);
  t.setAttribute('y', Number(m[2]) - 2);
  t.style.animationDelay = delay;
  t.textContent = i + 1;
  return t;
};

/** Animate a character's strokes one by one, numbered in writing order. */
export async function drawStrokes(svg, char, url = '/data/strokes.json') {
  svg.replaceChildren();
  try {
    data ??= fetch(url).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
    const paths = (await data)[char] ?? [];
    paths.forEach((d, i) => {
      const delay = `${i * 0.75}s`;
      const p = document.createElementNS(SVG, 'path');
      p.setAttribute('d', d);
      p.setAttribute('pathLength', '1');
      p.style.animationDelay = delay;
      svg.append(p, num(d, i, delay));
    });
  } catch {
    data = undefined; // allow a retry on the next tap
  }
}
