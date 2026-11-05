import { LEVELS, topics, gloss, auOf } from '../data/course/index.js';

// Review cards are keyed by the written form; the same word in two lessons is one card.
export function GET() {
  const deck = {};
  for (const { name, words } of Object.values(LEVELS)) for (const w of words) deck[w.w] ??= { ja: w.ja, zh: gloss(w), n: name, au: auOf(w) };
  for (const words of Object.values(topics)) for (const w of words) deck[w.w] ??= { ja: w.ja, zh: gloss(w), n: '主题词', au: auOf(w) };
  return new Response(JSON.stringify(deck));
}
