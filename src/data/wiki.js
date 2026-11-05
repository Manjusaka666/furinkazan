// Excerpts of ja/zh Wikipedia, built by scripts/fetch-wiki.py from scripts/culture.txt and the anime list.
const files = import.meta.glob('./wiki/*.json', { eager: true });
export const wiki = Object.fromEntries(Object.entries(files).filter(([p]) => !p.endsWith('index.json')).map(([, m]) => [m.default.slug, m.default]));
export const topics = Object.values(wiki).filter((w) => w.cat !== 'anime');
