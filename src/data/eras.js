// Era boundaries follow the conventional periodization; early dates are approximate and debated. The text beside each comes from Wikipedia.
export const eras = [
  { ja: '縄文{じょうもん}', span: '约 1.6 万年前起', to: 'jomon' },
  { ja: '弥生{やよい}', span: '约前 10 世纪起（有争议）', to: 'yayoi' },
  { ja: '古墳{こふん}', span: '约 3–7 世纪', to: 'kofun' },
  { ja: '飛鳥{あすか}', span: '592–710', to: 'asuka' },
  { ja: '奈良{なら}', span: '710–794', to: 'nara' },
  { ja: '平安{へいあん}', span: '794–1185', to: 'heian' },
  { ja: '鎌倉{かまくら}', span: '1185–1333', to: 'kamakura' },
  { ja: '室町{むろまち}', span: '1336–1573', to: 'muromachi' },
  { ja: '戦国{せんごく}', span: '约 1467–1590（与室町、安土桃山重叠）', to: 'sengoku' },
  { ja: '安土桃山{あづちももやま}', span: '1573–1603', to: 'azuchi' },
  { ja: '江戸{えど}', span: '1603–1868', to: 'edo' },
  { ja: '明治{めいじ}', span: '1868–1912', to: 'meiji-era' },
  { ja: '大正{たいしょう}', span: '1912–1926', to: 'taisho' },
  { ja: '昭和{しょうわ}', span: '1926–1989', to: 'showa' },
  { ja: '平成{へいせい}', span: '1989–2019', to: 'heisei' },
  { ja: '令和{れいわ}', span: '2019–', to: 'reiwa' },
];

// [year, Wikipedia topic, library slug]: 战国细表. No prose of ours, the names come from the articles.
export const EVENTS = [
  ['1467', 'sengoku-onin', 'onin'], ['1543', 'teppo', null], ['1549', 'xavier', null], ['1555', 'itsukushima', 'itsukushima'],
  ['1560', 'sengoku-okehazama', 'okehazama'], ['1561', 'sengoku-kawanakajima', 'kawanakajima'], ['1570', 'anegawa', 'anegawa'],
  ['1575', 'sengoku-nagashino', 'nagashino'], ['1582', 'sengoku-honnoji', 'yamazaki'], ['1583', 'shizugatake', 'shizugatake'],
  ['1588', 'katanagari', null], ['1590', 'odawara', 'odawara'], ['1592', 'sengoku-imjin', null], ['1600', 'sengoku-sekigahara', 'itojo'],
  ['1615', 'osaka-no-jin', 'osaka-natsu'], ['1637', 'shimabara', 'shimabara'],
];

export const CATS = {
  history: { ja: '歴史{れきし}', zh: '历史' },
  literature: { ja: '文学{ぶんがく}', zh: '文学' },
  aesthetics: { ja: '美学{びがく}', zh: '美学' },
  tradition: { ja: '伝統{でんとう}', zh: '传统' },
  food: { ja: '食{しょく}', zh: '饮食' },
  wakan: { ja: '和漢{わかん}', zh: '中日之间' },
};

// [节气, 读音, 大致起始 月-日, 时令词, 读音译文]
// shortcut: start dates are fixed approximations (±1 day each year); use NAO's yearly table if exact dates are ever needed.
export const SEKKI = [
  ['小寒', 'しょうかん', '01-05', '寒{かん}の入{い}り', '进入一年最冷的时候'],
  ['大寒', 'だいかん', '01-20', '雪見{ゆきみ}', '赏雪'],
  ['立春', 'りっしゅん', '02-04', '梅{うめ}', '梅花开始开了'],
  ['雨水', 'うすい', '02-19', '春一番{はるいちばん}', '立春后第一阵强南风'],
  ['啓蟄', 'けいちつ', '03-05', '雛祭{ひなまつ}り', '女儿节刚过'],
  ['春分', 'しゅんぶん', '03-20', 'お彼岸{ひがん}', '春分前后扫墓的日子'],
  ['清明', 'せいめい', '04-04', '花見{はなみ}', '赏樱'],
  ['穀雨', 'こくう', '04-20', '新茶{しんちゃ}', '新茶将至，「八十八夜」就在眼前'],
  ['立夏', 'りっか', '05-05', '鯉{こい}のぼり', '鲤鱼旗'],
  ['小満', 'しょうまん', '05-21', '新緑{しんりょく}', '新绿'],
  ['芒種', 'ぼうしゅ', '06-05', '田植{たう}え', '插秧'],
  ['夏至', 'げし', '06-21', '紫陽花{あじさい}', '绣球花，梅雨的颜色'],
  ['小暑', 'しょうしょ', '07-07', '七夕{たなばた}', '七夕'],
  ['大暑', 'たいしょ', '07-22', '花火{はなび}', '烟花大会'],
  ['立秋', 'りっしゅう', '08-07', 'お盆{ぼん}', '祖灵回家的日子将近'],
  ['処暑', 'しょしょ', '08-23', '盆踊{ぼんおど}り', '盂兰盆舞'],
  ['白露', 'はくろ', '09-07', '虫{むし}の声{こえ}', '秋虫的鸣声'],
  ['秋分', 'しゅうぶん', '09-22', '月見{つきみ}', '赏月'],
  ['寒露', 'かんろ', '10-08', '新米{しんまい}', '今年的新米'],
  ['霜降', 'そうこう', '10-23', '紅葉{もみじ}', '红叶开始了'],
  ['立冬', 'りっとう', '11-07', '七五三{しちごさん}', '七五三'],
  ['小雪', 'しょうせつ', '11-22', '木枯{こが}らし', '吹落树叶的寒风'],
  ['大雪', 'たいせつ', '12-07', '柚子{ゆず}', '柚子，冬至要泡柚子汤'],
  ['冬至', 'とうじ', '12-21', '大晦日{おおみそか}', '除夕将近，听除夜的钟'],
];
