// Authoring syntax: 日本語{にほんご} is a kanji run with its reading; [[...]] marks an inline Japanese term.
const RUBY = /([㐀-鿿豈-﫿々〆ヶ]+)\{([^}]+)\}/g;

const escapeHtml = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** HTML with <ruby> furigana. */
export const ruby = (s) =>
  escapeHtml(s).replace(RUBY, '<ruby>$1<rp>(</rp><rt>$2</rt><rp>)</rp></ruby>');

/** The text as written, with no readings: what speech synthesis should be given. */
export const plain = (s) => s.replace(RUBY, '$1');

/** All-kana version, used for romaji and for matching. */
export const reading = (s) => s.replace(RUBY, '$2');
