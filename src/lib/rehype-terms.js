import { rich } from './ruby.js';

const ONLY_TERM = /^\s*\[\[[^\]]+\]\]\s*$/;

/** Renders [[term]] markers in Markdown text; a paragraph holding only a term becomes a quoted verse. */
export function rehypeTerms() {
  const walk = (node) => {
    if (!node.children) return;
    if (node.tagName === 'p' && node.children.length === 1 && ONLY_TERM.test(node.children[0].value ?? '')) {
      node.properties.className = ['verse'];
    }
    for (const child of node.children) {
      if (child.type === 'text' && child.value.includes('[[')) {
        const safe = child.value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        child.type = 'raw';
        child.value = rich(safe);
      } else walk(child);
    }
  };
  return walk;
}
