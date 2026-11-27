import { BookMarked, Building2, ChevronRight, Flame, Pill, RotateCcw, Star, TrainFront } from 'lucide-react';
import { SCENARIOS, VOCAB_LIST } from '../data';
import { getDueCards } from '../engine/fsrs';
import { useGameStore } from '../store/useGameStore';
import type { SceneTheme } from '../types/dialogue';

interface WorldMapProps {
  onSelectStage: (scenarioId: string) => void;
  onOpenDojo: () => void;
}

const THEME_ICON: Record<SceneTheme, typeof Building2> = {
  hotel: Building2,
  drugstore: Pill,
  station: TrainFront,
};

const THEME_BADGE_BG: Record<SceneTheme, string> = {
  hotel: 'bg-[#2C497F] text-white',
  drugstore: 'bg-[#2E8B57] text-white',
  station: 'bg-[#E0523D] text-white',
};

export function WorldMap({ onSelectStage, onOpenDojo }: WorldMapProps) {
  const stageProgress = useGameStore((s) => s.stageProgress);
  const srsCards = useGameStore((s) => s.srsCards);
  const resetProgress = useGameStore((s) => s.resetProgress);

  const dueCount = getDueCards(srsCards).length;
  const collectedCount = Object.keys(srsCards).length;
  const totalStars = Object.values(stageProgress).reduce((sum, p) => sum + p.bestStars, 0);
  const maxStars = SCENARIOS.length * 3;

  return (
    <div className="p-4 space-y-4">
      {/* Hero Header */}
      <header className="rounded-3xl bg-[#FFF8F0] border-2 border-[#1F2430] shadow-[0_5px_0_#1F2430] p-5 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-[#E0523D]/15 pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E0523D] text-white text-[11px] font-extrabold tracking-wider">
              JLPT N5 情境 RPG
            </span>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#1F2430]">
              東京初日 <span className="font-jp text-base font-bold text-[#5C6475]">Tokyo Day 1</span>
            </h1>
            <p className="text-xs text-[#5C6475] mt-1">
              聽懂店員與路人、用日語詞塊親自應對三段東京實戰任務
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-2xl bg-white border border-[#E5DAC8] flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F2B134]/20 flex items-center justify-center">
              <Star className="w-5 h-5 fill-[#F2B134] text-[#1F2430]" />
            </div>
            <div>
              <p className="text-[11px] text-[#5C6475] font-bold">關卡星等</p>
              <p className="text-sm font-extrabold">
                {totalStars} / {maxStars}
              </p>
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-white border border-[#E5DAC8] flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2C497F]/15 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-[#2C497F]" />
            </div>
            <div>
              <p className="text-[11px] text-[#5C6475] font-bold">收錄單字</p>
              <p className="text-sm font-extrabold">
                {collectedCount} / {VOCAB_LIST.length}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* FSRS Review Dojo Banner */}
      <button
        type="button"
        onClick={onOpenDojo}
        className="w-full text-left p-4 rounded-2xl bg-[#2C497F] text-white border-2 border-[#1F2430] shadow-[0_4px_0_#1F2430] hover:-translate-y-0.5 active:translate-y-0.5 transition flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
            <Flame className="w-6 h-6 text-[#F2B134]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base">特訓道場（FSRS 記憶排程）</h2>
              {dueCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#E0523D] text-white text-xs font-extrabold">
                  {dueCount} 待複習
                </span>
              )}
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              {dueCount > 0
                ? '答錯或不熟的詞彙已排程到期，趁記憶衰退前刷一輪！'
                : '點此進行聽音辨義自由複習，或先通關解鎖更多單字卡'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 shrink-0" />
      </button>

      {/* Stage List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold text-[#1F2430]">東京實戰路線（3 關）</h2>
          {Object.keys(stageProgress).length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('確定要清除所有關卡進度與複習紀錄嗎？')) {
                  resetProgress();
                }
              }}
              className="text-[11px] text-[#5C6475] hover:text-[#E0523D] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              重置存檔
            </button>
          )}
        </div>

        {SCENARIOS.map((scenario) => {
          const Icon = THEME_ICON[scenario.sceneTheme];
          const prog = stageProgress[scenario.id];
          const stars = prog?.bestStars ?? 0;

          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onSelectStage(scenario.id)}
              className="w-full text-left p-4 rounded-2xl bg-white border-2 border-[#1F2430] shadow-[0_4px_0_#1F2430] hover:-translate-y-0.5 active:translate-y-0.5 transition cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl border-2 border-[#1F2430] flex items-center justify-center shrink-0 ${THEME_BADGE_BG[scenario.sceneTheme]}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-[#5C6475]">
                        STAGE 0{scenario.order}
                      </span>
                      <span className="text-[11px] font-bold text-[#2C497F]">
                        {scenario.locationTag}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-[#1F2430] mt-0.5">
                      {scenario.titleZh}
                    </h3>
                    <p className="font-jp text-xs font-bold text-[#5C6475]">
                      {scenario.titleJa}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 pt-1">
                  {[1, 2, 3].map((n) => (
                    <Star
                      key={n}
                      className={`w-4 h-4 ${
                        n <= stars
                          ? 'fill-[#F2B134] text-[#1F2430]'
                          : 'fill-[#EFE6D8] text-[#C9BDA9]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="mt-2.5 text-xs text-[#475061] leading-relaxed">
                {scenario.subtitleZh}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {scenario.grammarFocus.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#FFF8F0] border border-[#E5DAC8] text-[#1F2430]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}
