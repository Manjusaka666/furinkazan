// Studio Ghibli's own stills, offered on its site for free use within common sense (https://www.ghibli.jp/info/013344/).
const set = (slug, page) => ({ page: `https://www.ghibli.jp/works/${page}/`, files: ['001', '010', '025'].map((n) => `/img/g/${slug}-${n}.webp`) });

export const STILLS = {
  sento: set('sento', 'chihiro'),
  totoro: set('totoro', 'totoro'),
  mononoke: set('mononoke', 'mononoke'),
  kazetachinu: set('kazetachinu', 'kazetachinu'),
  kaguya: set('kaguya', 'kaguyahime'),
};
