import { lessons } from '../data/lessons/index.js';
import { plain } from '../lib/ruby.js';
import { LEVELS, gloss } from '../data/course/index.js';

// Review cards are keyed by the written form; the same word in two lessons is one card.
export function GET() {
  const deck = {};
  for (const l of lessons) for (const [ja, zh] of l.vocab) deck[plain(ja)] ??= { ja, zh, n: `第 ${l.n} 课` };
  for (const { name, words } of Object.values(LEVELS)) for (const w of words) deck[w.w] ??= { ja: w.ja, zh: gloss(w), n: name };
  return new Response(JSON.stringify(deck));
}
