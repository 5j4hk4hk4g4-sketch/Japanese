import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Rating, SrsCard } from '../types/srs';
import type { StageSummary } from '../engine/dialogueEngine';
import { createCard, scheduleCard } from '../engine/fsrs';
import { audioManager } from '../engine/audioManager';

export type DisplayMode = 'kana' | 'furigana' | 'kanji';

export interface StageProgressRecord {
  bestStars: 1 | 2 | 3;
  bestScore: number;
  completedCount: number;
  lastPlayedAt: number;
}

interface GameStoreState {
  stageProgress: Record<string, StageProgressRecord>;
  srsCards: Record<string, SrsCard>;
  displayMode: DisplayMode;
  pureListening: boolean;
  sfxEnabled: boolean;
  voiceRate: 1 | 0.75;

  recordStageResult: (summary: StageSummary) => void;
  recordWrongVocabs: (vocabIds: string[]) => void;
  ensureVocabCard: (vocabId: string) => void;
  removeVocabCard: (vocabId: string) => void;
  reviewSrsCard: (vocabId: string, rating: Rating) => void;
  cycleDisplayMode: () => void;
  setDisplayMode: (mode: DisplayMode) => void;
  togglePureListening: () => void;
  toggleSfx: () => void;
  setVoiceRate: (rate: 1 | 0.75) => void;
  resetProgress: () => void;
}

const DISPLAY_ORDER: DisplayMode[] = ['furigana', 'kana', 'kanji'];

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      stageProgress: {},
      srsCards: {},
      displayMode: 'furigana',
      pureListening: false,
      sfxEnabled: true,
      voiceRate: 1,

      recordStageResult: (summary) => {
        const now = Date.now();
        set((state) => {
          const prev = state.stageProgress[summary.scenarioId];
          const bestStars = prev
            ? (Math.max(prev.bestStars, summary.stars) as 1 | 2 | 3)
            : summary.stars;
          const bestScore = prev ? Math.max(prev.bestScore, summary.score) : summary.score;

          const nextCards = { ...state.srsCards };
          const wrongSet = new Set(summary.wrongVocabIds);

          // Automatically schedule encountered words; wrong ones immediately due
          for (const vid of summary.encounteredVocabIds) {
            if (!nextCards[vid]) {
              nextCards[vid] = createCard(vid, now);
            }
          }
          for (const vid of wrongSet) {
            const base = nextCards[vid] ?? createCard(vid, now);
            nextCards[vid] = scheduleCard(base, 1, now).card;
          }

          return {
            stageProgress: {
              ...state.stageProgress,
              [summary.scenarioId]: {
                bestStars,
                bestScore,
                completedCount: (prev?.completedCount ?? 0) + 1,
                lastPlayedAt: now,
              },
            },
            srsCards: nextCards,
          };
        });
      },

      recordWrongVocabs: (vocabIds) => {
        if (vocabIds.length === 0) return;
        const now = Date.now();
        set((state) => {
          const next = { ...state.srsCards };
          for (const vid of vocabIds) {
            const base = next[vid] ?? createCard(vid, now);
            next[vid] = scheduleCard(base, 1, now).card;
          }
          return { srsCards: next };
        });
      },

      ensureVocabCard: (vocabId) => {
        const now = Date.now();
        set((state) => {
          if (state.srsCards[vocabId]) return state;
          return {
            srsCards: {
              ...state.srsCards,
              [vocabId]: createCard(vocabId, now),
            },
          };
        });
      },

      removeVocabCard: (vocabId) => {
        set((state) => {
          const next = { ...state.srsCards };
          delete next[vocabId];
          return { srsCards: next };
        });
      },

      reviewSrsCard: (vocabId, rating) => {
        const now = Date.now();
        const existing = get().srsCards[vocabId] ?? createCard(vocabId, now);
        const { card } = scheduleCard(existing, rating, now);
        set((state) => ({
          srsCards: {
            ...state.srsCards,
            [vocabId]: card,
          },
        }));
      },

      cycleDisplayMode: () => {
        set((state) => {
          const idx = DISPLAY_ORDER.indexOf(state.displayMode);
          return { displayMode: DISPLAY_ORDER[(idx + 1) % DISPLAY_ORDER.length] };
        });
      },

      setDisplayMode: (mode) => set({ displayMode: mode }),

      togglePureListening: () => set((state) => ({ pureListening: !state.pureListening })),

      toggleSfx: () =>
        set((state) => {
          const next = !state.sfxEnabled;
          audioManager.setSfxEnabled(next);
          return { sfxEnabled: next };
        }),

      setVoiceRate: (rate) => set({ voiceRate: rate }),

      resetProgress: () => set({ stageProgress: {}, srsCards: {} }),
    }),
    {
      name: 'tokyo-day1-save-v1',
      onRehydrateStorage: () => (state) => {
        if (state) {
          audioManager.setSfxEnabled(state.sfxEnabled);
        }
      },
    },
  ),
);
