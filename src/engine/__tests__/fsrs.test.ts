import { describe, expect, it } from 'vitest';
import { createCard, formatIntervalZh, getDueCards, scheduleCard } from '../fsrs';

describe('fsrs scheduler', () => {
  it('creates a new card immediately due', () => {
    const now = 1_700_000_000_000;
    const card = createCard('yoyaku', now);
    expect(card.state).toBe('new');
    expect(card.dueAt).toBe(now);
  });

  it('grows stability on Good/Easy and resets on Again', () => {
    const t0 = 1_700_000_000_000;
    let card = createCard('megusuri', t0);

    const r1 = scheduleCard(card, 3, t0);
    card = r1.card;
    expect(card.state).toBe('review');
    expect(r1.intervalDays).toBeGreaterThanOrEqual(1);

    const t1 = card.dueAt;
    const r2 = scheduleCard(card, 4, t1);
    expect(r2.intervalDays).toBeGreaterThan(r1.intervalDays);
    expect(r2.card.stability).toBeGreaterThan(card.stability);

    const rAgain = scheduleCard(r2.card, 1, r2.card.dueAt);
    expect(rAgain.card.lapses).toBe(1);
    expect(rAgain.card.state).toBe('relearning');
    expect(rAgain.card.stability).toBeLessThan(r2.card.stability);
  });

  it('filters and sorts due cards chronologically', () => {
    const now = 1_700_000_000_000;
    const c1 = { ...createCard('a', now), dueAt: now - 5000 };
    const c2 = { ...createCard('b', now), dueAt: now - 1000 };
    const c3 = { ...createCard('c', now), dueAt: now + 86_400_000 };

    const due = getDueCards({ a: c1, b: c2, c: c3 }, now);
    expect(due.map((c) => c.vocabId)).toEqual(['a', 'b']);
  });

  it('formats intervals cleanly in Traditional Chinese', () => {
    expect(formatIntervalZh(10 / (24 * 60))).toBe('10 分鐘後');
    expect(formatIntervalZh(0.5)).toBe('12 小時後');
    expect(formatIntervalZh(4)).toBe('4 天後');
  });
});
