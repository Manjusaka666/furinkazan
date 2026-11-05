import { LEVELS, gloss } from '../../../data/course/index.js';
import { romanize } from '../../../lib/romaji.js';

export const getStaticPaths = () => Object.keys(LEVELS).map((level) => ({ params: { level } }));

export function GET({ params }) {
  const rows = LEVELS[params.level].words.map((w) => ({
    w: w.w, ja: w.ja, ro: romanize(w.ja), g: gloss(w),
    ex: w.ex.map((e) => ({ ...e, ro: romanize(e.ja) })),
  }));
  return new Response(JSON.stringify(rows));
}
