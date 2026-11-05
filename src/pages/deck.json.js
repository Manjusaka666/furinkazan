import { lessons } from '../data/lessons/index.js';
import { plain } from '../lib/ruby.js';

// Review cards are keyed by the written form; the same word in two lessons is one card.
export function GET() {
  const deck = {};
  for (const l of lessons) for (const [ja, zh] of l.vocab) deck[plain(ja)] ??= { ja, zh, n: l.n };
  return new Response(JSON.stringify(deck));
}
