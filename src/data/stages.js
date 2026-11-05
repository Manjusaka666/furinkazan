// Each stage borrows one palette from the 宋式配色 post and one line of 『孫子』軍争篇, as on Takeda Shingen's banner.
export const STAGES = {
  wind: { kanji: '風', yomi: 'かぜ', line: '疾如風', name: '假名与声音', desc: '假名表、笔顺和 Tae Kim 的文字系统部分。', art: 'wind' },
  forest: { kanji: '林', yomi: 'はやし', line: '徐如林', name: '初级', desc: 'Tae Kim 的基础语法，N5、N4 的词，『いろどり』入门和初级。', art: 'forest' },
  fire: { kanji: '火', yomi: 'ひ', line: '侵掠如火', name: '中级', desc: 'Tae Kim 的精要语法和特定表达，N3、N2 的词，简单新闻和短篇。', art: 'fire' },
  mountain: { kanji: '山', yomi: 'やま', line: '不動如山', name: '高级与原典', desc: 'Tae Kim 的高级话题，N1 的词，青空文库的原文和 JLPT 官方样题。', art: 'mountain' },
};
