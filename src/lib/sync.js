// Cross-device progress. /api/* is rewritten to Neon by vercel.json, so the session cookie stays first-party
// (Safari blocks it otherwise) and the browser needs no CORS. Row access is enforced by RLS on public.progress.
import { getDone, setDone, getDeck, setDeck, getPrefs, setPrefs, getUser, setUser, getSynced, setSynced } from './store.js';

const AUTH = '/api/auth';
const DB = '/api/db/progress';
const STALE = 5 * 60_000; // re-check other devices at most this often; keeps the free database asleep between visits
const DEBOUNCE = 1500;

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const sortKeys = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)));

const newerCard = (a, b) => {
  if (!a || !b) return a ?? b;
  const [x, y] = [a.at ?? 0, b.at ?? 0];
  if (x !== y) return x > y ? a : b;
  return a.due >= b.due ? a : b;
};

/** Merge two copies of the progress. Commutative and idempotent, so devices converge whatever the order. */
export function merge(local, remote) {
  const deckA = obj(local?.deck);
  const deckB = obj(remote?.deck);
  const deck = {};
  for (const id of new Set([...Object.keys(deckA), ...Object.keys(deckB)])) deck[id] = newerCard(deckA[id], deckB[id]);
  const done = [...new Set([...(Array.isArray(local?.done) ? local.done : []), ...(Array.isArray(remote?.done) ? remote.done : [])])].sort();
  // shortcut: prefs are display toggles, this device wins; per-key timestamps would be overkill.
  const prefs = { ...obj(remote?.prefs), ...obj(local?.prefs) };
  return { done, deck: sortKeys(deck), prefs: sortKeys(prefs) };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export async function authCall(path, body) {
  const res = await fetch(`${AUTH}/${path}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function session() {
  const res = await fetch(`${AUTH}/get-session/`);
  if (!res.ok) throw new Error(`session ${res.status}`);
  const data = await res.json();
  return data?.user ? { user: data.user, jwt: res.headers.get('set-auth-jwt') } : null;
}

/** Pull, merge, write back where different. Returns the signed-in email or null. Throws on network failure. */
export async function sync() {
  const s = await session();
  if (!s) { setUser(null); return null; }
  setUser(s.user.email);
  const headers = { Authorization: `Bearer ${s.jwt}`, 'Content-Type': 'application/json' };
  const res = await fetch(`${DB}/?select=done,deck,prefs`, { headers });
  if (!res.ok) throw new Error(`pull ${res.status}`);
  const [row] = await res.json();

  const local = { done: getDone(), deck: getDeck(), prefs: getPrefs() };
  const merged = merge(local, row);
  if (!same(merge(local, local), merged)) {
    setDone(merged.done);
    setDeck(merged.deck);
    setPrefs(merged.prefs);
    dispatchEvent(new Event('fk:synced'));
  }
  if (!row || !same(merge(row, row), merged)) {
    const put = await fetch(`${DB}/`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ user_id: s.user.id, ...merged }),
    });
    if (!put.ok) throw new Error(`push ${put.status}`);
  }
  setSynced(Date.now());
  return s.user.email;
}

let timer;
let running = false;
let again = false;
async function run() {
  if (running) { again = true; return; }
  running = true;
  // shortcut: a failed sync stays silent and retries on the next change or visit; progress is safe in localStorage.
  try { await sync(); } catch (e) { console.warn('sync failed', e); }
  running = false;
  if (again) { again = false; run(); }
}

/** Background sync for signed-in visitors. app.js only imports this when a user hint exists. */
export function start() {
  const begin = () => {
    const due = () => getUser() && Date.now() - getSynced() > STALE;
    addEventListener('fk:changed', () => {
      if (running) return; // the sync's own write-back
      clearTimeout(timer);
      setSynced(0); // a change that navigation interrupts is still pushed on the next page
      timer = setTimeout(run, DEBOUNCE);
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && due()) run(); });
    if (due()) run();
  };
  // Speculatively prerendered pages run scripts before the visit; they must not wake the database.
  if (document.prerendering) document.addEventListener('prerenderingchange', begin, { once: true });
  else begin();
}
