import { romanize } from '../../../lib/romaji.js';

export const getStaticPaths = () =>
  Object.entries(import.meta.glob('../../../data/library/*.json', { eager: true }))
    .filter(([path]) => !path.endsWith('/index.json'))
    .map(([, m]) => ({ params: { slug: m.default.slug }, props: { paras: m.default.paras } }));

// Separate from the page so readers who hide romaji never download it.
// Lines with no Japanese (the Ainu originals, say) get no romaji row.
const JA = /[ぁ-ヿ㐀-鿿]/;
export const GET = ({ props }) => new Response(JSON.stringify(props.paras.map((p) => (JA.test(p) ? romanize(p) : ''))));
