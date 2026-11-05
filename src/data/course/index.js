import n5 from './n5.json';
import n4 from './n4.json';
import n3 from './n3.json';
import n2 from './n2.json';
import n1 from './n1.json';
import topics from './topics.json';
import wordAudio from '../audio-words.json';
import sentenceAudio from '../audio-sentences.json';
import { reading } from '../../lib/ruby.js';

export { topics, sentenceAudio };

export const LEVELS = {
  n5: { name: 'N5', stage: 'forest', words: n5, desc: '' },
  n4: { name: 'N4', stage: 'forest', words: n4, desc: '' },
  n3: { name: 'N3', stage: 'fire', words: n3, desc: '' },
  n2: { name: 'N2', stage: 'fire', words: n2, desc: '' },
  n1: { name: 'N1', stage: 'mountain', words: n1, desc: '' },
};

export const levelsOf = (stage) => Object.entries(LEVELS).filter(([, l]) => l.stage === stage);
export const gloss = (w) => w.zh ?? `英：${w.en}`;
export const topicWords = (slug) => topics[slug] ?? [];

/** Who a sentence's audio is by, as shown under it. */
export const creditOf = (id) => {
  const a = sentenceAudio[id];
  if (!a) return undefined;
  return `录音：${a[1]}，${a[2]}`;
};

/** Path under /audio/ of a word's native recording. Undefined means none. */
export const auOf = (w) => wordAudio[`${w.w}|${reading(w.ja)}`];
