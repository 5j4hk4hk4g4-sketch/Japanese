import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, Flame, Snail, Volume2 } from 'lucide-react';
import { VOCAB_LIST, VOCAB_MAP } from '../data';
import { audioManager } from '../engine/audioManager';
import { formatIntervalZh, getDueCards, scheduleCard } from '../engine/fsrs';
import { useGameStore } from '../store/useGameStore';
import type { Rating } from '../types/srs';

interface ReviewDojoProps {
  onBack: () => void;
}

const RATING_OPTIONS: Array<{ rating: Rating; label: string; colorClass: string }> = [
  { rating: 1, label: '忘了', colorClass: 'bg-[#E0523D] text-white' },
  { rating: 2, label: '吃力', colorClass: 'bg-[#D99226] text-white' },
  { rating: 3, label: '記得', colorClass: 'bg-[#2E8B57] text-white' },
  { rating: 4, label: '秒懂', colorClass: 'bg-[#2C497F] text-white' },
];

export function ReviewDojo({ onBack }: ReviewDojoProps) {
  const srsCards = useGameStore((s) => s.srsCards);
  const reviewSrsCard = useGameStore((s) => s.reviewSrsCard);
  const ensureVocabCard = useGameStore((s) => s.ensureVocabCard);

  const [revealed, setRevealed] = useState(false);
  const [reviewedInSession, setReviewedInSession] = useState(0);
  const [practicePoolIdx, setPracticePoolIdx] = useState(0);

  const dueCards = useMemo(() => getDueCards(srsCards), [srsCards]);
  const isFreePractice = dueCards.length === 0;

  const fallbackPool = useMemo(() => {
    const owned = Object.keys(srsCards);
    if (owned.length > 0) return owned;
    return VOCAB_LIST.slice(0, 12).map((v) => v.id);
  }, [srsCards]);

  const activeVocabId = isFreePractice
    ? fallbackPool[practicePoolIdx % fallbackPool.length]
    : dueCards[0]?.vocabId;

  const entry = activeVocabId ? VOCAB_MAP[activeVocabId] : null;
  const activeCard = activeVocabId ? srsCards[activeVocabId] : undefined;

  useEffect(() => {
    setRevealed(false);
    if (entry) {
      void audioManager.playVoice(entry.audioId, entry.ttsText ?? entry.reading);
    }
  }, [entry?.id]);

  const handleRate = (rating: Rating) => {
    if (!entry) return;
    audioManager.playTap();
    if (!activeCard) {
      ensureVocabCard(entry.id);
    }
    reviewSrsCard(entry.id, rating);
    setReviewedInSession((c) => c + 1);
    if (isFreePractice) {
      setPracticePoolIdx((i) => i + 1);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border-2 border-[#1F2430] shadow-[0_2px_0_#1F2430] text-xs font-extrabold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          地圖
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-[#2C497F] text-white flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[#F2B134]" />
            {isFreePractice ? '自由加練模式' : `待複習：${dueCards.length}`}
          </span>
          {reviewedInSession > 0 && (
            <span className="text-xs font-bold text-[#2E8B57]">
              本次已刷 {reviewedInSession}
            </span>
          )}
        </div>
      </div>

      {entry ? (
        <div className="rounded-3xl bg-white border-2 border-[#1F2430] shadow-[0_6px_0_#1F2430] p-6 space-y-5 animate-pop-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EFE6D8] text-[#1F2430]">
              {entry.posZh}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  void audioManager.playVoice(entry.audioId, entry.ttsText ?? entry.reading)
                }
                className="px-3 py-1.5 rounded-xl bg-[#E0523D] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                播放
              </button>
              <button
                type="button"
                onClick={() =>
                  void audioManager.playVoice(entry.audioId, entry.ttsText ?? entry.reading, {
                    rate: 0.75,
                  })
                }
                className="px-2.5 py-1.5 rounded-xl bg-[#EFE6D8] text-[#1F2430] text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Snail className="w-3.5 h-3.5" />
                0.75x
              </button>
            </div>
          </div>

          <div className="py-6 text-center space-y-2">
            <p className="font-jp text-4xl font-extrabold text-[#1F2430]">{entry.word}</p>
            <p className="font-jp text-base font-medium text-[#5C6475]">
              {entry.reading}
              {entry.pitch ? ` [${entry.pitch}]` : ''}
            </p>
          </div>

          {!revealed ? (
            <button
              type="button"
              onClick={() => {
                audioManager.playTap();
                setRevealed(true);
              }}
              className="w-full py-3.5 rounded-2xl bg-[#1F2430] text-[#FFF8F0] font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              顯示中文解釋與例句
            </button>
          ) : (
            <div className="space-y-4 animate-pop-in">
              <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#E5DAC8] space-y-2">
                <p className="text-lg font-extrabold text-[#1F2430]">{entry.meaningZh}</p>
                <div className="pt-2 border-t border-[#E5DAC8]">
                  <p className="font-jp text-sm font-bold text-[#2C497F]">{entry.exampleJa}</p>
                  <p className="text-xs text-[#5C6475] mt-0.5">{entry.exampleZh}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-[#5C6475] mb-2 text-center">
                  根據熟悉程度評分（FSRS 自動排程下次複習時間）
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {RATING_OPTIONS.map((opt) => {
                    const previewDays = activeCard
                      ? scheduleCard(activeCard, opt.rating).intervalDays
                      : opt.rating === 1
                        ? 10 / (24 * 60)
                        : opt.rating === 2
                          ? 0.5
                          : opt.rating === 3
                            ? 1
                            : 3;
                    return (
                      <button
                        key={opt.rating}
                        type="button"
                        onClick={() => handleRate(opt.rating)}
                        className={`py-2.5 px-1 rounded-xl border-2 border-[#1F2430] shadow-[0_2px_0_#1F2430] font-extrabold text-xs flex flex-col items-center gap-0.5 active:translate-y-0.5 cursor-pointer ${opt.colorClass}`}
                      >
                        <span>{opt.label}</span>
                        <span className="text-[10px] opacity-90 font-medium">
                          {formatIntervalZh(previewDays)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center rounded-3xl bg-white border-2 border-[#1F2430]">
          <CheckCircle2 className="w-10 h-10 text-[#2E8B57] mx-auto" />
          <p className="mt-2 font-extrabold">今日待複習卡片已全部完成！</p>
        </div>
      )}
    </div>
  );
}
