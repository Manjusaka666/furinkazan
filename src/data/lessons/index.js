import { wind } from './wind.js';
import { forest } from './forest.js';
import { fire } from './fire.js';
import { mountain } from './mountain.js';

// Each stage borrows one palette from the 宋式配色 post and one line of 『孫子』軍争篇, as on Takeda Shingen's banner.
export const STAGES = {
  wind: {
    kanji: '風', yomi: 'かぜ', line: '疾如風', lineZh: '其疾如风', name: '假名与声音',
    desc: '先快。用五节课认全假名、听准声音，读得出来才谈得上学。',
    art: 'wind', colorName: '青瓦', hex: '#4A6460',
  },
  forest: {
    kanji: '林', yomi: 'はやし', line: '徐如林', lineZh: '其徐如林', name: '初级',
    desc: '再慢。十八个生活主题把基本句型种下去，再用 N5、N4 的词和语法把林子养密。',
    art: 'forest', colorName: '石绿', hex: '#6C7F4F',
  },
  fire: {
    kanji: '火', yomi: 'ひ', line: '侵掠如火', lineZh: '侵掠如火', name: '中级',
    desc: '开始读得下去。N3、N2 的词和语法，配上芥川、中岛敦和菊池宽的原文。',
    art: 'fire', colorName: '墨红', hex: '#8C2F2D',
  },
  mountain: {
    kanji: '山', yomi: 'やま', line: '不動如山', lineZh: '不动如山', name: '高级与原典',
    desc: '最后站稳。N1 的词和语法，俳句、清少纳言、露伴与安吾。读到这里，后面的路没有尽头。',
    art: 'mountain', colorName: '暮山', hex: '#4F6072',
  },
};

export const lessons = [...wind, ...forest, ...fire.map((l) => ({ ...l, stage: 'forest' })), ...mountain].map((l, i) => ({ ...l, n: i + 1 }));

export const lessonsOf = (stage) => lessons.filter((l) => l.stage === stage);
