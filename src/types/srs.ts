export type Rating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export interface SrsCard {
  vocabId: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  dueAt: number;
  lastReviewedAt: number;
  state: CardState;
}
