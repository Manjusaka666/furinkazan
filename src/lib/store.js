// Progress lives only in this browser. localStorage can throw (private mode, quota), so every access is guarded.
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
};

export const getDone = () => read('fk.done', []);
export const setDone = (slugs) => write('fk.done', slugs);
export const getDeck = () => read('fk.deck', {});
export const setDeck = (deck) => write('fk.deck', deck);
export const getPrefs = () => read('fk.prefs', {});
export const setPrefs = (prefs) => write('fk.prefs', prefs);
