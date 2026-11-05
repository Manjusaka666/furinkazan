// Identity and links only: the description on each page comes from Wikipedia. Words: see scripts/topics.json.
const wiki = (t) => `https://ja.wikipedia.org/wiki/${t}`;

export const ANIME_GROUPS = [
  ['最受欢迎的长篇', [
    { slug: 'kimetsu', ja: '鬼滅{きめつ}の刃{やいば}', zh: '鬼灭之刃', by: '吾峠呼世晴', year: '2016 连载，2019 动画', src: wiki('鬼滅の刃'), ties: [['/culture/taisho/', '大正时代'], ['/culture/yokai/', '鬼与妖怪'], ['/culture/colors/', '传统色与纹样']] },
    { slug: 'onepiece', ja: 'ONE PIECE', zh: '海贼王', by: '尾田荣一郎', year: '1997 连载，1999 动画', src: wiki('ONE_PIECE'), ties: [['/culture/sengoku-imjin/', '东亚海上的战争']] },
    { slug: 'naruto', ja: 'NARUTO', zh: '火影忍者', by: '岸本齐史', year: '1999 连载，2002 动画', src: wiki('NARUTO'), ties: [['/culture/ninja/', '真实的忍者']] },
    { slug: 'shingeki', ja: '進撃{しんげき}の巨人{きょじん}', zh: '进击的巨人', by: '谏山创', year: '2009 连载，2013 动画', src: wiki('進撃の巨人'), ties: [['/culture/wakan-kundoku/', '汉语词为什么读得懂']] },
    { slug: 'jujutsu', ja: '呪術{じゅじゅつ}廻戦{かいせん}', zh: '咒术回战', by: '芥见下下', year: '2018 连载，2020 动画', src: wiki('呪術廻戦'), ties: [['/culture/heian-onryo/', '菅原道真与怨灵'], ['/culture/yokai/', '妖怪与咒']] },
    { slug: 'conan', ja: '名探偵{めいたんてい}コナン', zh: '名侦探柯南', by: '青山刚昌', year: '1994 连载，1996 动画', src: wiki('名探偵コナン'), ties: [['/library/hana/', '读读芥川的短篇'], ['/culture/meiji/', '近代日本']] },
    { slug: 'dragonball', ja: 'ドラゴンボール', zh: '龙珠', by: '鸟山明', year: '1984 连载，1986 动画', src: wiki('DRAGON_BALL'), ties: [['/culture/wakan-kentoshi/', '中国典籍到日本']] },
    { slug: 'hunter', ja: 'HUNTER×HUNTER', zh: '全职猎人', by: '冨樫义博', year: '1998 连载，1999/2011 动画', src: wiki('HUNTER×HUNTER'), ties: [] },
    { slug: 'heroaca', ja: '僕{ぼく}のヒーローアカデミア', zh: '我的英雄学院', by: '堀越耕平', year: '2014 连载，2016 动画', src: wiki('僕のヒーローアカデミア'), ties: [] },
    { slug: 'frieren', ja: '葬送{そうそう}のフリーレン', zh: '葬送的芙莉莲', by: '山田钟人 原作，アベツカサ 作画', year: '2020 连载，2023 动画', src: wiki('葬送のフリーレン'), ties: [['/culture/mono-no-aware/', '物哀']] },
    { slug: 'spyfamily', ja: 'SPY×FAMILY', zh: '间谍过家家', by: '远藤达哉', year: '2019 连载，2022 动画', src: wiki('SPY×FAMILY'), ties: [] },
    { slug: 'gintama', ja: '銀魂{ぎんたま}', zh: '银魂', by: '空知英秋', year: '2003 连载，2006 动画', src: wiki('銀魂'), ties: [['/culture/bakumatsu/', '幕末与新选组']] },
    { slug: 'pokemon', ja: 'ポケットモンスター', zh: '宝可梦', by: '田尻智 原案', year: '1996 游戏，1997 动画', src: wiki('ポケットモンスター'), ties: [] },
    { slug: 'doraemon', ja: 'ドラえもん', zh: '哆啦 A 梦', by: '藤子·F·不二雄', year: '1969 连载，1979 动画', src: wiki('ドラえもん'), ties: [['/culture/wagashi/', '和果子']] },
  ]],
  ['吉卜力与新海诚', [
    { slug: 'sento', ja: '千{せん}と千尋{ちひろ}の神隠{かみかく}し', zh: '千与千寻', by: '宫崎骏', year: '2001', src: wiki('千と千尋の神隠し'), ties: [['/culture/yokai/', '八百万神与妖怪'], ['/culture/washoku/', '饭团和日本的食物']] },
    { slug: 'totoro', ja: 'となりのトトロ', zh: '龙猫', by: '宫崎骏', year: '1988', src: wiki('となりのトトロ'), ties: [['/culture/seasons/', '四季']] },
    { slug: 'mononoke', ja: 'もののけ姫{ひめ}', zh: '幽灵公主', by: '宫崎骏', year: '1997', src: wiki('もののけ姫'), ties: [['/culture/sengoku-onin/', '室町到战国'], ['/culture/yokai/', '「もののけ」是什么']] },
    { slug: 'kazetachinu', ja: '風立{かぜた}ちぬ', zh: '起风了', by: '宫崎骏', year: '2013', src: wiki('風立ちぬ_(2013年の映画)'), ties: [['/library/kazetachinu/', '读堀辰雄的原著'], ['/culture/taisho/', '大正到昭和']] },
    { slug: 'kaguya', ja: 'かぐや姫{ひめ}の物語{ものがたり}', zh: '辉夜姬物语', by: '高畑勋', year: '2013', src: wiki('かぐや姫の物語'), ties: [['/library/taketori/', '读竹取物语'], ['/culture/taketori/', '竹取物语与中国']] },
    { slug: 'kiminona', ja: '君{きみ}の名{な}は。', zh: '你的名字。', by: '新海诚', year: '2016', src: wiki('君の名は。'), ties: [['/culture/hyakunin/', '百人一首与和歌'], ['/culture/genji-makura/', '平安文学']] },
    { slug: 'tenkinoko', ja: '天気{てんき}の子{こ}', zh: '天气之子', by: '新海诚', year: '2019', src: wiki('天気の子'), ties: [['/scenes/tenki/', '情景：聊天气']] },
  ]],
  ['连着历史和文学的作品', [
    { slug: 'kenshin', ja: 'るろうに剣心{けんしん}', zh: '浪客剑心', by: '和月伸宏', year: '1994 连载，1996 动画', src: wiki('るろうに剣心_-明治剣客浪漫譚-'), ties: [['/culture/bakumatsu/', '幕末与新选组'], ['/culture/meiji/', '明治']] },
    { slug: 'kamuy', ja: 'ゴールデンカムイ', zh: '黄金神威', by: '野田サトル', year: '2014 连载，2018 动画', src: wiki('ゴールデンカムイ'), ties: [['/culture/ainu/', '阿伊努文化'], ['/culture/ramen/', '北海道的饮食']] },
    { slug: 'inuyasha', ja: '犬夜叉{いぬやしゃ}', zh: '犬夜叉', by: '高桥留美子', year: '1996 连载，2000 动画', src: wiki('犬夜叉'), ties: [['/culture/sengoku-onin/', '战国是怎么开始的'], ['/culture/yokai/', '妖怪']] },
    { slug: 'kingdom', ja: 'キングダム', zh: '王者天下', by: '原泰久', year: '2006 连载，2012 动画', src: wiki('キングダム_(漫画)'), ties: [['/culture/furinkazan/', '风林火山与孙子'], ['/library/riryo/', '中岛敦『李陵』']] },
    { slug: 'chihayafuru', ja: 'ちはやふる', zh: '花牌情缘', by: '末次由纪', year: '2007 连载，2011 动画', src: wiki('ちはやふる'), ties: [['/culture/hyakunin/', '百人一首']] },
    { slug: 'bungo', ja: '文豪{ぶんごう}ストレイドッグス', zh: '文豪野犬', by: '朝雾卡夫卡 原作，春河 35 作画', year: '2012 连载，2016 动画', src: wiki('文豪ストレイドッグス'), ties: [['/library/sangetsuki/', '中岛敦「山月記」'], ['/library/rashomon/', '芥川「羅生門」'], ['/library/ningen-shikkaku/', '太宰治「人間失格」'], ['/library/merosu/', '太宰治「走れメロス」']] },
    { slug: 'kitaro', ja: 'ゲゲゲの鬼太郎{きたろう}', zh: '咯咯咯的鬼太郎', by: '水木しげる', year: '1960 连载，1968 起多次动画', src: wiki('ゲゲゲの鬼太郎'), ties: [['/culture/yokai/', '妖怪'], ['/library/hoichi/', '小泉八雲']] },
  ]],
  ['校园、运动与生活', [
    { slug: 'slamdunk', ja: 'SLAM DUNK', zh: '灌篮高手', by: '井上雄彦', year: '1990 连载，1993 动画，2022 电影', src: wiki('SLAM_DUNK'), ties: [['/scenes/gakko/', '情景：校园与社团'], ['/scenes/sports/', '情景：运动与比赛']] },
    { slug: 'haikyu', ja: 'ハイキュー!!', zh: '排球少年', by: '古馆春一', year: '2012 连载，2014 动画', src: wiki('ハイキュー!!'), ties: [['/scenes/gakko/', '情景：校园与社团']] },
    { slug: 'sailormoon', ja: '美少女{びしょうじょ}戦士{せんし}セーラームーン', zh: '美少女战士', by: '武内直子', year: '1991 连载，1992 动画', src: wiki('美少女戦士セーラームーン'), ties: [] },
    { slug: 'gundam', ja: '機動戦士{きどうせんし}ガンダム', zh: '机动战士高达', by: '富野由悠季', year: '1979', src: wiki('機動戦士ガンダム'), ties: [] },
    { slug: 'eva', ja: '新世紀{しんせいき}エヴァンゲリオン', zh: '新世纪福音战士', by: '庵野秀明', year: '1995', src: wiki('新世紀エヴァンゲリオン'), ties: [] },
    { slug: 'soma', ja: '食戟{しょくげき}のソーマ', zh: '食戟之灵', by: '附田祐斗 原作，佐伯俊 作画', year: '2012 连载，2015 动画', src: wiki('食戟のソーマ'), ties: [['/scenes/washoku/', '情景：家常日本菜'], ['/culture/washoku/', '和食']] },
  ]],
];

export const anime = ANIME_GROUPS.flatMap(([, list]) => list);
