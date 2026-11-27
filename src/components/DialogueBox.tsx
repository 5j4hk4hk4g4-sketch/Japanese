import { useEffect, useState } from 'react';
import { Eye, HelpCircle, Snail, Volume2 } from 'lucide-react';
import type { DialogueNode } from '../types/dialogue';
import type { DisplayMode } from '../store/useGameStore';
import { RubyText } from './RubyText';

interface DialogueBoxProps {
  node: DialogueNode;
  displayMode: DisplayMode;
  pureListening: boolean;
  onPlayNormal: () => void;
  onPlaySlow: () => void;
  onVocabClick: (vocabId: string) => void;
  onHintUsed: () => void;
}

export function DialogueBox({
  node,
  displayMode,
  pureListening,
  onPlayNormal,
  onPlaySlow,
  onVocabClick,
  onHintUsed,
}: DialogueBoxProps) {
  const [revealText, setRevealText] = useState(!pureListening);
  const [showZh, setShowZh] = useState(false);

  useEffect(() => {
    setRevealText(!pureListening);
    setShowZh(false);
  }, [node.id, pureListening]);

  const handleRevealText = () => {
    if (!revealText) {
      setRevealText(true);
      onHintUsed();
    }
  };

  const handleToggleHint = () => {
    if (!showZh) {
      setRevealText(true);
      setShowZh(true);
      onHintUsed();
    } else {
      setShowZh(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border-2 border-[#1F2430] shadow-[0_4px_0_#1F2430] p-4 animate-pop-in">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-[#2C497F] text-white text-xs font-bold">
            {node.speaker}
          </span>
          <span className="text-[11px] text-[#5C6475]">點擊帶底線詞彙可查字典</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPlayNormal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#E0523D] text-white text-xs font-bold hover:bg-[#c8432f] active:scale-95 transition cursor-pointer"
            title="重播語音 (Space)"
          >
            <Volume2 className="w-3.5 h-3.5" />
            重聽
          </button>
          <button
            type="button"
            onClick={onPlaySlow}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#EFE6D8] border border-[#1F2430]/30 text-[#1F2430] text-xs font-bold hover:bg-[#e5d8c4] active:scale-95 transition cursor-pointer"
            title="0.75x 慢速播放 (S)"
          >
            <Snail className="w-3.5 h-3.5" />
            0.75x
          </button>
          <button
            type="button"
            onClick={handleToggleHint}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-bold transition cursor-pointer ${
              showZh
                ? 'bg-[#D99226]/20 border-[#D99226] text-[#8F590A]'
                : 'bg-[#EFE6D8] border-[#1F2430]/30 text-[#1F2430] hover:bg-[#e5d8c4]'
            }`}
            title="顯示繁中提示 (H)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            提示
          </button>
        </div>
      </div>

      {/* NPC Japanese Line */}
      {revealText ? (
        <div className="text-lg font-bold text-[#1F2430]">
          <RubyText
            tokens={node.npcTokens}
            displayMode={displayMode}
            onVocabClick={onVocabClick}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={handleRevealText}
          className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#2C497F]/45 bg-[#2C497F]/5 text-[#2C497F] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#2C497F]/10 transition cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          純聽力盲聽中 — 先聽語音再選答，或點此偷看日文
        </button>
      )}

      {showZh && (
        <p className="mt-2 pt-2 border-t border-[#EFE6D8] text-sm font-medium text-[#5C6475] animate-pop-in">
          💡 {node.npcZh}
        </p>
      )}
    </div>
  );
}
