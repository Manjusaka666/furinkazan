// localStorage is the working copy, so the site works signed out and offline; sync.js mirrors it to the account.
// localStorage can throw (private mode, quota), so every access is guarded.
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
};
const writeProgress = (key, value) => {
  const ok = write(key, value);
  if (ok) dispatchEvent(new Event('fk:changed'));
  return ok;
};

export const getDone = () => read('fk.done', []);
export const setDone = (slugs) => writeProgress('fk.done', slugs);
export const getDeck = () => read('fk.deck', {});
export const setDeck = (deck) => writeProgress('fk.deck', deck);
export const getPrefs = () => read('fk.prefs', {});
export const setPrefs = (prefs) => writeProgress('fk.prefs', prefs);

// Sync bookkeeping: the signed-in email (a hint, the session cookie is the real check) and last successful sync.
export const getUser = () => read('fk.user', null);
export const setUser = (email) => write('fk.user', email);
export const getSynced = () => read('fk.synced', 0);
export const setSynced = (t) => write('fk.synced', t);
