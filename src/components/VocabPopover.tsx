import { BookmarkCheck, BookmarkPlus, Volume2, X } from 'lucide-react';
import { VOCAB_MAP } from '../data';
import { audioManager } from '../engine/audioManager';
import { useGameStore } from '../store/useGameStore';

interface VocabPopoverProps {
  vocabId: string | null;
  onClose: () => void;
}

export function VocabPopover({ vocabId, onClose }: VocabPopoverProps) {
  const srsCards = useGameStore((s) => s.srsCards);
  const ensureVocabCard = useGameStore((s) => s.ensureVocabCard);
  const removeVocabCard = useGameStore((s) => s.removeVocabCard);
  const voiceRate = useGameStore((s) => s.voiceRate);

  if (!vocabId) return null;
  const entry = VOCAB_MAP[vocabId];
  if (!entry) return null;

  const isSaved = Boolean(srsCards[entry.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1F2430]/40 backdrop-blur-[2px] p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-2xl bg-[#FFF8F0] border-2 border-[#1F2430] shadow-[0_12px_0_#1F2430] p-5 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-[#2C497F]/12 text-[#2C497F] mb-1.5">
              {entry.posZh}
            </span>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h3 className="font-jp text-2xl font-extrabold text-[#1F2430]">
                {entry.word}
              </h3>
              <span className="font-jp text-sm font-medium text-[#5C6475]">
                {entry.reading}
                {entry.pitch ? ` [${entry.pitch}]` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                audioManager.playTap();
                void audioManager.playVoice(
                  entry.audioId,
                  entry.ttsText ?? entry.reading,
                  { rate: voiceRate },
                );
              }}
              className="p-2.5 rounded-xl bg-[#E0523D] text-white hover:bg-[#c8432f] active:scale-95 transition cursor-pointer"
              aria-label="播放發音"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[#EFE6D8] text-[#1F2430] hover:bg-[#e5d8c4] transition cursor-pointer"
              aria-label="關閉"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="mt-3 text-lg font-bold text-[#1F2430]">{entry.meaningZh}</p>

        <div className="mt-3 p-3 rounded-xl bg-white/80 border border-[#E5DAC8]">
          <p className="font-jp text-sm font-bold text-[#1F2430]">{entry.exampleJa}</p>
          <p className="text-xs text-[#5C6475] mt-1">{entry.exampleZh}</p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              audioManager.playTap();
              if (isSaved) {
                removeVocabCard(entry.id);
              } else {
                ensureVocabCard(entry.id);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition cursor-pointer ${
              isSaved
                ? 'bg-[#2E8B57]/12 border-[#2E8B57] text-[#2E8B57]'
                : 'bg-[#1F2430] border-[#1F2430] text-[#FFF8F0] hover:bg-[#2C497F]'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4" />
                已在 FSRS 複習庫
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4" />
                加入 FSRS 複習庫
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
