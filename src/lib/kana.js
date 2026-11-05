// [romaji, hiragana, katakana, hiragana's source kanji, katakana's source kanji]
export const GOJUON = [
  { row: 'あ行', cells: [['a','あ','ア','安','阿'],['i','い','イ','以','伊'],['u','う','ウ','宇','宇'],['e','え','エ','衣','江'],['o','お','オ','於','於']] },
  { row: 'か行', cells: [['ka','か','カ','加','加'],['ki','き','キ','幾','幾'],['ku','く','ク','久','久'],['ke','け','ケ','計','介'],['ko','こ','コ','己','己']] },
  { row: 'さ行', cells: [['sa','さ','サ','左','散'],['shi','し','シ','之','之'],['su','す','ス','寸','須'],['se','せ','セ','世','世'],['so','そ','ソ','曽','曽']] },
  { row: 'た行', cells: [['ta','た','タ','太','多'],['chi','ち','チ','知','千'],['tsu','つ','ツ','川','川'],['te','て','テ','天','天'],['to','と','ト','止','止']] },
  { row: 'な行', cells: [['na','な','ナ','奈','奈'],['ni','に','ニ','仁','仁'],['nu','ぬ','ヌ','奴','奴'],['ne','ね','ネ','祢','祢'],['no','の','ノ','乃','乃']] },
  { row: 'は行', cells: [['ha','は','ハ','波','八'],['hi','ひ','ヒ','比','比'],['fu','ふ','フ','不','不'],['he','へ','ヘ','部','部'],['ho','ほ','ホ','保','保']] },
  { row: 'ま行', cells: [['ma','ま','マ','末','末'],['mi','み','ミ','美','三'],['mu','む','ム','武','牟'],['me','め','メ','女','女'],['mo','も','モ','毛','毛']] },
  { row: 'や行', cells: [['ya','や','ヤ','也','也'],null,['yu','ゆ','ユ','由','由'],null,['yo','よ','ヨ','与','与']] },
  { row: 'ら行', cells: [['ra','ら','ラ','良','良'],['ri','り','リ','利','利'],['ru','る','ル','留','流'],['re','れ','レ','礼','礼'],['ro','ろ','ロ','呂','呂']] },
  { row: 'わ行', cells: [['wa','わ','ワ','和','和'],null,null,null,['o','を','ヲ','遠','乎']] },
  { row: 'ん', cells: [['n','ん','ン','无','尓'],null,null,null,null] },
];

export const DAKUON = [
  { row: 'が行', cells: [['ga','が','ガ'],['gi','ぎ','ギ'],['gu','ぐ','グ'],['ge','げ','ゲ'],['go','ご','ゴ']] },
  { row: 'ざ行', cells: [['za','ざ','ザ'],['ji','じ','ジ'],['zu','ず','ズ'],['ze','ぜ','ゼ'],['zo','ぞ','ゾ']] },
  { row: 'だ行', cells: [['da','だ','ダ'],['ji','ぢ','ヂ'],['zu','づ','ヅ'],['de','で','デ'],['do','ど','ド']] },
  { row: 'ば行', cells: [['ba','ば','バ'],['bi','び','ビ'],['bu','ぶ','ブ'],['be','べ','ベ'],['bo','ぼ','ボ']] },
  { row: 'ぱ行', cells: [['pa','ぱ','パ'],['pi','ぴ','ピ'],['pu','ぷ','プ'],['pe','ぺ','ペ'],['po','ぽ','ポ']] },
];

export const YOON = [
  ['kya','きゃ','キャ'],['kyu','きゅ','キュ'],['kyo','きょ','キョ'],
  ['sha','しゃ','シャ'],['shu','しゅ','シュ'],['sho','しょ','ショ'],
  ['cha','ちゃ','チャ'],['chu','ちゅ','チュ'],['cho','ちょ','チョ'],
  ['nya','にゃ','ニャ'],['nyu','にゅ','ニュ'],['nyo','にょ','ニョ'],
  ['hya','ひゃ','ヒャ'],['hyu','ひゅ','ヒュ'],['hyo','ひょ','ヒョ'],
  ['mya','みゃ','ミャ'],['myu','みゅ','ミュ'],['myo','みょ','ミョ'],
  ['rya','りゃ','リャ'],['ryu','りゅ','リュ'],['ryo','りょ','リョ'],
  ['gya','ぎゃ','ギャ'],['gyu','ぎゅ','ギュ'],['gyo','ぎょ','ギョ'],
  ['ja','じゃ','ジャ'],['ju','じゅ','ジュ'],['jo','じょ','ジョ'],
  ['bya','びゃ','ビャ'],['byu','びゅ','ビュ'],['byo','びょ','ビョ'],
  ['pya','ぴゃ','ピャ'],['pyu','ぴゅ','ピュ'],['pyo','ぴょ','ピョ'],
];

const MAP = new Map();
for (const group of [GOJUON, DAKUON]) {
  for (const { cells } of group) for (const c of cells) if (c) { MAP.set(c[1], c[0]); MAP.set(c[2], c[0]); }
}
for (const [r, h, k] of YOON) { MAP.set(h, r); MAP.set(k, r); }
// Historical kana, loanword spellings and stray small kana, as they turn up in Aozora texts.
for (const [k, r] of Object.entries({
  ゐ: 'i', ゑ: 'e', ヰ: 'i', ヱ: 'e', ヴ: 'vu', ヶ: 'ka',
  ァ: 'a', ィ: 'i', ゥ: 'u', ェ: 'e', ォ: 'o', ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
  ャ: 'ya', ュ: 'yu', ョ: 'yo', ゃ: 'ya', ゅ: 'yu', ょ: 'yo',
  ファ: 'fa', フィ: 'fi', フェ: 'fe', フォ: 'fo', ティ: 'ti', ディ: 'di', デュ: 'dyu', トゥ: 'tu', ドゥ: 'du',
  シェ: 'she', ジェ: 'je', チェ: 'che', ツァ: 'tsa', ウィ: 'wi', ウェ: 'we', ウォ: 'wo',
  ヴァ: 'va', ヴィ: 'vi', ヴェ: 've', ヴォ: 'vo',
})) MAP.set(k, r);

const toKata = (ch) => ch; // katakana are already keys in MAP

/** Hepburn romaji for a kana-only string. Words only: it does not know particle は = wa. */
export function toRomaji(kana) {
  let out = '';
  let geminate = false;
  const chars = [...kana];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === 'っ' || ch === 'ッ') { geminate = true; continue; }
    if (ch === 'ー') { out += out.slice(-1); continue; }
    const pair = ch + (chars[i + 1] ?? '');
    const r = MAP.get(pair) ?? MAP.get(toKata(ch));
    if (r === undefined) { out += ch === '、' || ch === '。' || ch === ' ' || ch === '　' ? ' ' : ch; continue; }
    if (MAP.has(pair)) i++;
    out += geminate ? (r.startsWith('ch') ? 't' : r[0]) + r : r;
    geminate = false;
  }
  return out.replace(/\s+/g, ' ').trim();
}
