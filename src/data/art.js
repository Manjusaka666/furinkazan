const aic = (id) => `https://www.artic.edu/artworks/${id}`;
const cma = (acc) => `https://www.clevelandart.org/art/${acc}`;
const AIC = '芝加哥艺术博物馆（公有领域）';
const CMA = '克利夫兰艺术博物馆（CC0）';

export const ART = {
  wind: { title: '駿州江尻', by: '葛饰北斋', date: '约 1830–33', alt: '北斋版画：大风中行人的斗笠和纸片被吹上天空，远处是富士山。', museum: AIC, url: aic(24800) },
  forest: { title: '甲州三嶌越', by: '葛饰北斋', date: '约 1830–33', alt: '北斋版画：甲斐国山道上，一棵巨大的杉树前有旅人合抱树干，后方是富士山。', museum: AIC, url: aic(24786) },
  fire: { title: '名所江戸百景 両国花火', by: '歌川广重', date: '1858', alt: '广重版画：夜空中的烟花绽放在两国桥和隅田川上方。', museum: CMA, url: cma('1940.986') },
  mountain: { title: '凱風快晴', by: '葛饰北斋', date: '1830 年代初', alt: '北斋版画「赤富士」：红褐色的富士山与天空中排列的卷云。', museum: CMA, url: cma('1930.189') },
  seasons: { title: '名所江戸百景 亀戸梅屋舗', by: '歌川广重', date: '1857', alt: '广重版画：近景粗壮的梅枝横贯画面，后方小小的人影在赏梅。', museum: AIC, url: aic(26577) },
  raku: { title: '楽焼茶碗', by: '乐了入', date: '18 世纪', alt: '一只手捏成形的日本乐烧茶碗，器形厚重，色泽深暗。', museum: AIC, url: aic(8585) },
  jian: { title: '建窯茶碗', by: '中国福建建窑', date: '宋代（960–1279）', alt: '宋代建窑黑釉茶碗，碗沿釉色泛褐。', museum: CMA, url: cma('1942.132') },
  kana: { title: '百人一首姥がゑとき 在原業平', by: '葛饰北斋', date: '1835–36', alt: '北斋版画：行人站在拱桥上，俯看桥下龙田川的激流，取意在原业平的和歌。', museum: AIC, url: aic(89524) },
  sharaku: { title: '紅葉狩', by: '东洲斋写乐', date: '1794', alt: '写乐绘歌舞伎《红叶狩》：长发鬼女高举手臂，抓住身下的武士。', museum: AIC, url: aic(9788) },
  genji: { title: '源氏物語図', by: '土佐派', date: '18 世纪后期', alt: '源氏物语场景的屏风画，以揭去屋顶的视角俯瞰室内人物。', museum: CMA, url: cma('1948.124.2') },
  basho: { title: '芭蕉像', by: 'Ichijun', date: '18 世纪', alt: '俳人松尾芭蕉的半身像：头戴黑头巾，四周缠绕着绿色藤蔓。', museum: CMA, url: cma('1988.72') },
  noh: { title: '能装束 縫箔', by: '佚名', date: '1675–99', alt: '挂在衣架上的十七世纪能装束，金色底子上绣着成簇的花卉。', museum: CMA, url: cma('1974.36') },
  edo: { title: '東海道五十三次 庄野', by: '歌川广重', date: '1833', alt: '广重版画：急雨中，行人和轿夫弓身快步穿过斜坡。', museum: CMA, url: cma('1948.306') },
  food: { title: '名所江戸百景 永代橋佃しま', by: '歌川广重', date: '1858', alt: '广重版画：从永代桥的桥桩间望出去，月夜下的水面上远远泊着佃岛的渔船。', museum: CMA, url: cma('1992.73') },
  shingen: { title: '九代目市村羽左衛門の信玄', by: '胜川春章', date: '1775', alt: '胜川春章的役者绘：歌舞伎演员市村羽左卫门九世扮演武田信玄。', museum: CMA, url: cma('1921.1270') },
};
