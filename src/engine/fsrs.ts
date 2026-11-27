import type { Rating, SrsCard } from '../types/srs';

const DAY_MS = 24 * 60 * 60 * 1000;
const TEN_MINUTES_DAYS = 10 / (24 * 60);

export function createCard(vocabId: string, now = Date.now()): SrsCard {
  return {
    vocabId,
    stability: 0.5,
    difficulty: 5.0,
    reps: 0,
    lapses: 0,
    dueAt: now,
    lastReviewedAt: 0,
    state: 'new',
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function scheduleCard(
  card: SrsCard,
  rating: Rating,
  now = Date.now(),
): { card: SrsCard; intervalDays: number } {
  const elapsedDays =
    card.lastReviewedAt > 0 ? Math.max(0, (now - card.lastReviewedAt) / DAY_MS) : 0;

  let nextDifficulty = card.difficulty;
  let nextStability = card.stability;
  let nextReps = card.reps + 1;
  let nextLapses = card.lapses;
  let nextState = card.state;
  let intervalDays = 1;

  if (rating === 1) {
    // Again: reset stability & move to relearning
    nextDifficulty = clamp(card.difficulty + 0.8, 1.0, 10.0);
    nextStability = Math.max(0.25, card.stability * 0.35);
    nextLapses = card.lapses + 1;
    nextState = card.reps === 0 ? 'learning' : 'relearning';
    intervalDays = TEN_MINUTES_DAYS;
  } else {
    const retrievability =
      card.reps === 0 ? 0.9 : Math.exp(-elapsedDays / Math.max(0.5, card.stability));

    const ratingDelta = rating === 2 ? 0.25 : rating === 3 ? -0.15 : -0.45;
    nextDifficulty = clamp(card.difficulty + ratingDelta, 1.0, 10.0);

    if (card.reps === 0 || card.state === 'new') {
      nextStability = rating === 2 ? 0.5 : rating === 3 ? 1.0 : 3.0;
    } else {
      const difficultyFactor = (11 - nextDifficulty) * 0.16;
      const ratingMultiplier = rating === 2 ? 1.15 : rating === 3 ? 1.85 : 2.5;
      const spacingBonus = 1 + (1 - retrievability) * 0.45;
      nextStability = clamp(
        card.stability * (1 + difficultyFactor * ratingMultiplier * spacingBonus),
        0.5,
        180,
      );
    }

    nextState = 'review';
    intervalDays =
      rating === 2
        ? Math.max(0.5, nextStability * 0.7)
        : rating === 3
          ? Math.max(1, nextStability)
          : Math.max(2, nextStability * 1.35);
  }

  const updated: SrsCard = {
    ...card,
    stability: Number(nextStability.toFixed(3)),
    difficulty: Number(nextDifficulty.toFixed(2)),
    reps: nextReps,
    lapses: nextLapses,
    dueAt: Math.round(now + intervalDays * DAY_MS),
    lastReviewedAt: now,
    state: nextState,
  };

  return { card: updated, intervalDays };
}

export function getDueCards(
  cards: Record<string, SrsCard>,
  now = Date.now(),
): SrsCard[] {
  return Object.values(cards)
    .filter((c) => c.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt);
}

export function formatIntervalZh(intervalDays: number): string {
  const minutes = Math.round(intervalDays * 24 * 60);
  if (minutes < 60) {
    return `${Math.max(1, minutes)} 分鐘後`;
  }
  const hours = Math.round(intervalDays * 24);
  if (hours < 24) {
    return `${hours} 小時後`;
  }
  const days = Math.round(intervalDays);
  return `${days} 天後`;
}
