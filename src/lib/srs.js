// Leitner-style spaced repetition. Pure functions: storage lives in store.js.
const DAY = 86_400_000;
export const INTERVALS = [1, 2, 4, 7, 15, 30, 60]; // days, indexed by box

/** Add ids that are not in the deck yet; they are due immediately. */
export function addCards(deck, ids, now) {
  const next = { ...deck };
  for (const id of ids) next[id] ??= { box: 0, due: now };
  return next;
}

/** Remembered: move up a box. Forgot: back to box 0 and due again in this session. */
export function grade(card, remembered, now) {
  if (!remembered) return { box: 0, due: now };
  const box = Math.min(card.box + 1, INTERVALS.length - 1);
  return { box, due: now + INTERVALS[card.box] * DAY };
}

export const dueIds = (deck, now) =>
  Object.entries(deck)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
