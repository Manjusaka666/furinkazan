import all from './kanji.json';
import { LEVELS } from './course/index.js';

export const kanji = all;
// KANJIDIC2 grades: 1-6 are the primary-school years, 8 is the rest of the jōyō list.
export const GRADES = [[1, '小学一年级'], [2, '小学二年级'], [3, '小学三年级'], [4, '小学四年级'], [5, '小学五年级'], [6, '小学六年级'], [8, '中学及以后']];

let index;
/** Words containing a kanji, easiest level first. */
export function wordsWith(c, max = 8) {
  if (!index) {
    index = new Map();
    for (const { words } of Object.values(LEVELS)) {
      for (const w of words) {
        for (const ch of new Set(w.w)) {
          if (!index.has(ch)) index.set(ch, []);
          index.get(ch).push(w);
        }
      }
    }
  }
  return (index.get(c) ?? []).slice(0, max);
}
