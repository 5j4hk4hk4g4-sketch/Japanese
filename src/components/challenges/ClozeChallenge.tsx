import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import type { DialogueNode } from '../../types/dialogue';
import type { DisplayMode } from '../../store/useGameStore';
import type { ChallengeEvalResult } from '../../engine/dialogueEngine';
import { evaluateCloze } from '../../engine/dialogueEngine';
import { GRAMMAR_TIP_MAP } from '../../data';
import { audioManager } from '../../engine/audioManager';
import { RubyText } from '../RubyText';

interface ClozeChallengeProps {
  node: DialogueNode;
  displayMode: DisplayMode;
  onVocabClick: (vocabId: string) => void;
  onEvaluated: (result: ChallengeEvalResult) => void;
  onContinue: (nextNodeId?: string) => void;
}

export function ClozeChallenge({
  node,
  displayMode,
  onVocabClick,
  onEvaluated,
  onContinue,
}: ClozeChallengeProps) {
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<ChallengeEvalResult | null>(null);

  useEffect(() => {
    setPickedIndex(null);
    setResult(null);
  }, [node.id]);

  if (!node.challenge || node.challenge.type !== 'cloze') return null;
  const challenge = node.challenge;

  const pickedChoice = pickedIndex !== null ? challenge.choices[pickedIndex] : null;
  const tip = result?.grammarTipId ? GRAMMAR_TIP_MAP[result.grammarTipId] : null;

  const handlePick = (idx: number) => {
    if (result?.correct) return;
    audioManager.playTap();
    const res = evaluateCloze(node, idx);
    setPickedIndex(idx);
    setResult(res);
    onEvaluated(res);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-bold text-[#2C497F]">{challenge.promptZh}</p>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E0523D]/15 text-[#E0523D]">
          助詞／量詞填空
        </span>
      </div>

      {/* Sentence Slot */}
      <div className="p-4 rounded-2xl bg-white border-2 border-[#1F2430] shadow-[0_3px_0_#1F2430] text-lg font-bold flex flex-wrap items-center gap-1.5">
        <RubyText
          tokens={challenge.beforeTokens}
          displayMode={displayMode}
          onVocabClick={onVocabClick}
        />
        <span
          className={`inline-flex items-center justify-center min-w-[60px] px-3 py-0.5 rounded-xl border-2 text-base font-extrabold ${
            result?.correct
              ? 'bg-[#2E8B57]/15 border-[#2E8B57] text-[#2E8B57]'
              : result
                ? 'bg-[#E0523D]/12 border-[#E0523D] text-[#E0523D]'
                : 'bg-[#EFE6D8] border-dashed border-[#2C497F] text-[#2C497F]'
          }`}
        >
          {pickedChoice
            ? displayMode === 'kana' && pickedChoice.reading
              ? pickedChoice.reading
              : pickedChoice.text
            : '＿＿'}
        </span>
        <RubyText
          tokens={challenge.afterTokens}
          displayMode={displayMode}
          onVocabClick={onVocabClick}
        />
      </div>

      {/* Choices */}
      <div className="grid grid-cols-3 gap-2">
        {challenge.choices.map((c, idx) => {
          const isPicked = pickedIndex === idx;
          const isRight = result?.correct && isPicked;
          const isWrong = result && !result.correct && isPicked;

          return (
            <button
              key={c.text}
              type="button"
              onClick={() => handlePick(idx)}
              className={`py-2.5 px-3 rounded-xl border-2 font-jp font-extrabold text-base transition cursor-pointer ${
                isRight
                  ? 'bg-[#2E8B57] border-[#1F2430] text-white'
                  : isWrong
                    ? 'bg-[#E0523D]/15 border-[#E0523D] text-[#E0523D]'
                    : 'bg-white border-[#1F2430] shadow-[0_3px_0_#1F2430] hover:-translate-y-0.5 active:translate-y-0.5'
              }`}
            >
              {displayMode === 'kana' && c.reading ? c.reading : c.text}
            </button>
          );
        })}
      </div>

      {/* Explanation + Tip */}
      {result && (
        <div
          className={`p-3.5 rounded-2xl border-2 animate-pop-in space-y-2 ${
            result.correct
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
