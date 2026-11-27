import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import type { ClauseBlock, DialogueNode } from '../../types/dialogue';
import type { DisplayMode } from '../../store/useGameStore';
import type { ChallengeEvalResult } from '../../engine/dialogueEngine';
import { evaluateClauseBuilder } from '../../engine/dialogueEngine';
import { GRAMMAR_TIP_MAP } from '../../data';
import { audioManager } from '../../engine/audioManager';
import { RubyText } from '../RubyText';

interface ClauseBuilderProps {
  node: DialogueNode;
  displayMode: DisplayMode;
  onEvaluated: (result: ChallengeEvalResult) => void;
  onContinue: (nextNodeId?: string) => void;
}

function deterministicShuffle(blocks: ClauseBlock[], seedStr: string): ClauseBlock[] {
  const copy = [...blocks];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function ClauseBuilder({
  node,
  displayMode,
  onEvaluated,
  onContinue,
}: ClauseBuilderProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<ChallengeEvalResult | null>(null);

  useEffect(() => {
    setSelectedIds([]);
    setResult(null);
  }, [node.id]);

  const challenge = node.challenge?.type === 'clause-builder' ? node.challenge : null;

  const shuffledBlocks = useMemo(
    () => (challenge ? deterministicShuffle(challenge.blocks, node.id) : []),
    [challenge, node.id],
  );

  if (!challenge) return null;

  const blockMap = Object.fromEntries(challenge.blocks.map((b) => [b.id, b]));
  const tip = result?.grammarTipId ? GRAMMAR_TIP_MAP[result.grammarTipId] : null;

  const addBlock = (id: string) => {
    if (result?.correct || selectedIds.includes(id)) return;
    audioManager.playTap();
    setResult(null);
    setSelectedIds((prev) => [...prev, id]);
  };

  const removeBlock = (id: string) => {
    if (result?.correct) return;
    audioManager.playTap();
    setResult(null);
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0 || result?.correct) return;
    const res = evaluateClauseBuilder(node, selectedIds);
    setResult(res);
    onEvaluated(res);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-bold text-[#2C497F]">{challenge.promptZh}</p>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D99226]/18 text-[#8F590A]">
          語塊組句
        </span>
      </div>

      {/* Answer Tray */}
      <div className="min-h-[68px] p-3 rounded-2xl bg-[#FFFDF9] border-2 border-dashed border-[#1F2430]/40 flex flex-wrap items-center gap-2">
        {selectedIds.length === 0 ? (
          <span className="text-xs text-[#5C6475] font-medium">
            點選下方日語詞塊，組出正確語序與助詞...
          </span>
        ) : (
          selectedIds.map((id) => {
            const b = blockMap[id];
            if (!b) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => removeBlock(id)}
                className="px-3 py-1.5 rounded-xl bg-[#2C497F] text-white font-bold text-sm shadow-[0_2px_0_#1F2430] active:translate-y-0.5 cursor-pointer"
              >
                <RubyText tokens={b.tokens} displayMode={displayMode} />
              </button>
            );
          })
        )}
      </div>

      {/* Block Bank */}
      <div className="flex flex-wrap gap-2">
        {shuffledBlocks.map((b) => {
          const used = selectedIds.includes(b.id);
          return (
            <button
              key={b.id}
              type="button"
              disabled={used}
              onClick={() => addBlock(b.id)}
              className={`px-3.5 py-2 rounded-xl border-2 font-bold text-sm transition ${used
                  ? 'bg-[#EFE6D8] border-transparent text-transparent select-none cursor-default'
                  : 'bg-white border-[#1F2430] text-[#1F2430] shadow-[0_3px_0_#1F2430] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer'
                }`}
            >
              <span className={used ? 'opacity-0' : ''}>
                <RubyText tokens={b.tokens} displayMode={displayMode} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      {!result?.correct && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              audioManager.playTap();
              setSelectedIds([]);
              setResult(null);
            }}
            disabled={selectedIds.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-[#EFE6D8] border-2 border-[#1F2430] text-xs font-extrabold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重組
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selectedIds.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-[#E0523D] text-white border-2 border-[#1F2430] shadow-[0_3px_0_#1F2430] font-extrabold text-sm disabled:opacity-40 active:translate-y-0.5 cursor-pointer"
          >
            送出回答
          </button>
        </div>
      )}

      {/* Feedback + Micro Grammar Tip */}
      {result && (
        <div
          className={`p-3.5 rounded-2xl border-2 animate-pop-in space-y-2 ${result.correct
              ? 'bg-[#2E8B57]/12 border-[#2E8B57] text-[#175132]'
              : 'bg-[#E0523D]/10 border-[#E0523D] text-[#7D2417]'
            }`}
        >
          <div className="flex items-start gap-2">
            {result.correct ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#2E8B57]" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#E0523D]" />
            )}
            <p className="text-sm font-bold">{result.feedbackZh}</p>
          </div>

          {tip && (
            <div className="p-2.5 rounded-xl bg-white/85 border border-[#1F2430]/15 text-[#1F2430] text-xs space-y-1">
              <p className="font-extrabold flex items-center gap-1 text-[#2C497F]">
                <Sparkles className="w-3.5 h-3.5" />
                {tip.titleZh}
              </p>
              <p className="font-jp font-bold text-[#E0523D]">{tip.patternJa}</p>
              <p className="text-[#475061] leading-relaxed">{tip.summaryZh}</p>
            </div>
          )}

          {result.correct && (
            <button
              type="button"
              onClick={() => onContinue(result.nextNodeId)}
              className="w-full py-2.5 rounded-xl bg-[#2E8B57] text-white font-extrabold text-sm flex items-center justify-center gap-1.5 hover:bg-[#257347] cursor-pointer"
            >
              繼續對話 <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
