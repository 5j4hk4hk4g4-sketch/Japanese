import { BookOpen, Map, RotateCcw, Star, Volume2 } from 'lucide-react';
import type { StageSummary } from '../engine/dialogueEngine';
import type { Scenario } from '../types/dialogue';
import { VOCAB_MAP } from '../data';
import { audioManager } from '../engine/audioManager';

interface StageSummaryProps {
  scenario: Scenario;
  summary: StageSummary;
  onReplay: () => void;
  onBackMap: () => void;
  onOpenVocab: (vocabId: string) => void;
}

export function StageSummaryView({
  scenario,
  summary,
  onReplay,
  onBackMap,
  onOpenVocab,
}: StageSummaryProps) {
  const wrongSet = new Set(summary.wrongVocabIds);
  const vocabEntries = summary.encounteredVocabIds
    .map((id) => VOCAB_MAP[id])
    .filter(Boolean);

  return (
    <div className="p-4 space-y-4 animate-pop-in">
      <div className="rounded-3xl bg-white border-2 border-[#1F2430] shadow-[0_6px_0_#1F2430] p-5 text-center">
        <span className="inline-block px-3 py-0.5 rounded-full bg-[#2E8B57]/15 text-[#2E8B57] text-xs font-extrabold">
          STAGE CLEAR
        </span>
        <h2 className="mt-2 text-2xl font-extrabold text-[#1F2430]">
          {scenario.titleZh} 完成！
        </h2>
        <p className="font-jp text-sm text-[#5C6475]">{scenario.titleJa}</p>

        {/* Stars */}
        <div className="my-4 flex items-center justify-center gap-3">
          {[1, 2, 3].map((n) => (
            <Star
              key={n}
              className={`w-10 h-10 ${
                n <= summary.stars
                  ? 'fill-[#F2B134] text-[#1F2430]'
                  : 'fill-[#EFE6D8] text-[#C9BDA9]'
              }`}
            />
          ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-[#FFF8F0] border border-[#E5DAC8]">
            <p className="text-[11px] text-[#5C6475] font-bold">分數</p>
            <p className="text-lg font-extrabold text-[#E0523D]">{summary.score}</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#FFF8F0] border border-[#E5DAC8]">
            <p className="text-[11px] text-[#5C6475] font-bold">正確率</p>
            <p className="text-lg font-extrabold text-[#2E8B57]">{summary.accuracy}%</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#FFF8F0] border border-[#E5DAC8]">
            <p className="text-[11px] text-[#5C6475] font-bold">最高連擊</p>
            <p className="text-lg font-extrabold text-[#2C497F]">{summary.maxCombo}</p>
          </div>
        </div>

        {summary.pureListeningBonus && (
          <p className="mt-3 text-xs font-bold text-[#2C497F] bg-[#2C497F]/10 py-1.5 px-3 rounded-xl">
            🎧 全程純聽力盲聽達成！額外聽力加分已入帳
          </p>
        )}
      </div>

      {/* Wrong / SRS Notice */}
      {summary.wrongVocabIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#E0523D]/10 border-2 border-[#E0523D] text-xs font-bold text-[#7D2417]">
          📌 本關有 {summary.wrongVocabIds.length} 個較不熟的詞彙已自動加入「特訓道場」FSRS 立即複習清單！
        </div>
      )}

      {/* Encountered Vocab List */}
      <div className="rounded-2xl bg-white border-2 border-[#1F2430] p-4 space-y-2.5">
        <h3 className="text-sm font-extrabold flex items-center gap-1.5 text-[#1F2430]">
          <BookOpen className="w-4 h-4 text-[#2C497F]" />
          本關實戰單字（{vocabEntries.length}）
        </h3>
        <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
          {vocabEntries.map((v) => (
            <div
              key={v.id}
              onClick={() => onOpenVocab(v.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition hover:bg-[#FFF8F0] ${
                wrongSet.has(v.id)
                  ? 'border-[#E0523D]/60 bg-[#E0523D]/5'
                  : 'border-[#E5DAC8] bg-[#FFFDF9]'
              }`}
            >
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-jp font-extrabold text-sm text-[#1F2430]">
                    {v.word}
                  </span>
                  <span className="font-jp text-xs text-[#5C6475]">{v.reading}</span>
                  {wrongSet.has(v.id) && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#E0523D] text-white">
                      待特訓
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#475061]">{v.meaningZh}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void audioManager.playVoice(v.audioId, v.ttsText ?? v.reading);
                }}
                className="p-2 rounded-lg bg-[#EFE6D8] hover:bg-[#e2d4be] text-[#1F2430] cursor-pointer"
                aria-label={`播放 ${v.word}`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onReplay}
          className="flex-1 py-3 rounded-2xl bg-white border-2 border-[#1F2430] shadow-[0_3px_0_#1F2430] font-extrabold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          再玩一次
        </button>
        <button
          type="button"
          onClick={onBackMap}
          className="flex-1 py-3 rounded-2xl bg-[#E0523D] text-white border-2 border-[#1F2430] shadow-[0_3px_0_#1F2430] font-extrabold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Map className="w-4 h-4" />
          回東京地圖
        </button>
      </div>
    </div>
  );
}
