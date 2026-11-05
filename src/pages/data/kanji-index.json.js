import { kanji } from '../../data/kanji.js';

// Loaded on the first search, so the kanji list page itself stays light.
export function GET() {
  return new Response(JSON.stringify(kanji.map((k) => [k.c, k.s ?? '', k.on.join(' '), k.kun.join(' ').replace(/[.-]/g, ''), k.en.join(', ')])));
}
