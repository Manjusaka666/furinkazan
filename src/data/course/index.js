import n5 from './n5.json';
import n4 from './n4.json';
import n3 from './n3.json';
import n2 from './n2.json';
import n1 from './n1.json';
import grammar from './grammar.json';
import lessonExamples from './lessons.json';

export { lessonExamples };

export const LEVELS = {
  n5: { name: 'N5', stage: 'forest', words: n5, desc: '最常用的基础词：人、时间、吃住行。' },
  n4: { name: 'N4', stage: 'forest', words: n4, desc: '日常会话够用的词，开始读懂简单的故事。' },
  n3: { name: 'N3', stage: 'fire', words: n3, desc: '从生活走向报道和小说，词的用法开始讲究。' },
  n2: { name: 'N2', stage: 'fire', words: n2, desc: '书面语和抽象词，读芥川、菊池宽需要的量。' },
  n1: { name: 'N1', stage: 'mountain', words: n1, desc: '论说文和文学里的词，也是读原典的底子。' },
};

const SIZE = 20;

export const levelsOf = (stage) => Object.entries(LEVELS).filter(([, l]) => l.stage === stage);
export const grammarOf = (level) => grammar.filter((g) => g.lv.toLowerCase() === level);
export const gloss = (w) => w.zh ?? `英：${w.en}`;
export const unitsOf = (level) => {
  const { words } = LEVELS[level];
  return Array.from({ length: Math.ceil(words.length / SIZE) }, (_, i) => words.slice(i * SIZE, (i + 1) * SIZE));
};

/** Meaning questions drawn from the unit itself, stable across builds. Words with only an English gloss are left out. */
export function quizOf(unit, seed) {
  const pool = unit.filter((w) => w.zh);
  if (pool.length < 4) return [];
  const step = Math.floor(pool.length / 3);
  return [0, 1, 2].map((k) => {
    const i = (seed + k * step) % pool.length;
    const target = pool[i];
    const others = [...pool.slice(i + 1), ...pool.slice(0, i)].filter((w) => w.zh !== target.zh);
    const o = [...new Set(others.map((w) => w.zh))].slice(0, 3);
    const c = (seed + k) % (o.length + 1);
    o.splice(c, 0, target.zh);
    return { ja: target.ja, o, c, why: `${target.w}：${target.zh}` };
  });
}
