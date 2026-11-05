// Words and sentences for each scene come from src/data/course/topics.json, built from scripts/topics.json.
export const SCENE_GROUPS = [
  ['在日本生活', [
    { slug: 'konbini', ja: 'コンビニ', zh: '便利店', to: 'washoku' },
    { slug: 'eki', ja: '駅{えき}と電車{でんしゃ}', zh: '车站与电车', to: 'edo' },
    { slug: 'shinkansen', ja: '新幹線{しんかんせん}と駅弁{えきべん}', zh: '新干线与铁路便当', to: 'ekiben' },
    { slug: 'michi', ja: '道{みち}を聞{き}く', zh: '问路', to: 'edo' },
    { slug: 'ryokan', ja: '旅館{りょかん}に泊{と}まる', zh: '住旅馆', to: 'seasons' },
    { slug: 'onsen', ja: '温泉{おんせん}と銭湯{せんとう}', zh: '温泉与澡堂', to: 'edo' },
    { slug: 'kazoku', ja: '家{いえ}と家族{かぞく}', zh: '家和家人', to: 'mono-no-aware' },
    { slug: 'byoin', ja: '病院{びょういん}で', zh: '看病', to: 'edo-food' },
    { slug: 'yubin', ja: '郵便局{ゆうびんきょく}と銀行{ぎんこう}', zh: '邮局与银行', to: 'meiji' },
    { slug: 'komatta', ja: '困{こま}ったとき', zh: '遇到麻烦', to: 'meiji' },
    { slug: 'denwa', ja: '電話{でんわ}とメール', zh: '电话与消息', to: 'kindai' },
    { slug: 'keigo', ja: 'お店{みせ}の敬語{けいご}', zh: '服务场合的敬语', to: 'stage' },
  ]],
  ['吃喝', [
    { slug: 'washoku', ja: '家庭{かてい}の和食{わしょく}', zh: '家常日本菜', to: 'washoku' },
    { slug: 'ramen', ja: 'ラーメン屋{や}', zh: '拉面店', to: 'ramen' },
    { slug: 'sushi', ja: '寿司屋{すしや}', zh: '寿司店', to: 'sushi' },
    { slug: 'izakaya', ja: '居酒屋{いざかや}', zh: '居酒屋', to: 'nihonshu' },
    { slug: 'wagashi', ja: '和菓子{わがし}とお茶{ちゃ}', zh: '和果子与茶', to: 'wagashi' },
    { slug: 'cafe', ja: '喫茶店{きっさてん}', zh: '老式咖啡馆', to: 'kindai' },
  ]],
  ['校园、工作与感情', [
    { slug: 'gakko', ja: '学校{がっこう}と部活{ぶかつ}', zh: '校园与社团', to: 'meiji' },
    { slug: 'kaisha', ja: '会社{かいしゃ}で', zh: '在公司', to: 'kindai' },
    { slug: 'koi', ja: '恋{こい}と告白{こくはく}', zh: '恋爱与告白', to: 'genji-makura' },
    { slug: 'sports', ja: 'スポーツと試合{しあい}', zh: '运动与比赛', to: 'stage' },
  ]],
  ['四季与传统', [
    { slug: 'tenki', ja: '天気{てんき}の話{はなし}', zh: '聊天气', to: 'seasons' },
    { slug: 'shiki', ja: '四季{しき}', zh: '四季', to: 'seasons' },
    { slug: 'jinja', ja: '神社{じんじゃ}とお寺{てら}', zh: '神社与寺庙', to: 'tea' },
    { slug: 'matsuri', ja: '夏祭{なつまつ}り', zh: '夏日祭典', to: 'seasons' },
    { slug: 'shogatsu', ja: 'お正月{しょうがつ}', zh: '新年', to: 'washoku' },
    { slug: 'fuku', ja: '服{ふく}と着物{きもの}', zh: '衣服与和服', to: 'colors' },
    { slug: 'shiro', ja: 'お城{しろ}と武士{ぶし}', zh: '城与武士', to: 'sengoku-okehazama' },
  ]],
  ['流行文化', [
    { slug: 'akiba', ja: '秋葉原{あきはばら}', zh: '秋叶原与动漫店', to: 'kindai' },
    { slug: 'shumi', ja: '趣味{しゅみ}の話{はなし}', zh: '聊爱好', to: 'kindai' },
    { slug: 'karaoke', ja: 'カラオケ', zh: '卡拉 OK', to: 'stage' },
  ]],
];

export const scenes = SCENE_GROUPS.flatMap(([, list]) => list);
