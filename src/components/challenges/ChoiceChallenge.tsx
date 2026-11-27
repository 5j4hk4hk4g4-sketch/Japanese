import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import type { DialogueNode } from '../../types/dialogue';
import type { DisplayMode } from '../../store/useGameStore';
import type { ChallengeEvalResult } from '../../engine/dialogueEngine';
import { evaluateChoice } from '../../engine/dialogueEngine';
import { audioManager } from '../../engine/audioManager';
import { RubyText } from '../RubyText';

interface ChoiceChallengeProps {
  node: DialogueNode;
  displayMode: DisplayMode;
  onEvaluated: (result: ChallengeEvalResult) => void;
  onContinue: (nextNodeId?: string) => void;
}

export function ChoiceChallenge({
  node,
  displayMode,
  onEvaluated,
  onContinue,
}: ChoiceChallengeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<ChallengeEvalResult | null>(null);

  useEffect(() => {
    setSelectedId(null);
    setResult(null);
  }, [node.id]);

  if (!node.challenge || node.challenge.type !== 'choice') return null;
  const challenge = node.challenge;

  const handleSelect = (optionId: string) => {
    if (result?.correct) return;
    audioManager.playTap();
    const res = evaluateChoice(node, optionId);
    setSelectedId(optionId);
    setResult(res);
    onEvaluated(res);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (result?.correct && e.key === 'Enter') {
        e.preventDefault();
        onContinue(result.nextNodeId);
        return;
      }
      const num = Number(e.key);
      if (num >= 1 && num <= challenge.options.length) {
        handleSelect(challenge.options[num - 1].id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-[#2C497F] px-1">{challenge.promptZh}</p>

      <div className="space-y-2.5">
        {challenge.options.map((opt, idx) => {
          const isSelected = selectedId === opt.id;
          const isSolved = result?.correct && isSelected;
          const isWrongSelected = result && !result.correct && isSelected;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              className={`w-full text-left p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${isSolved
                  ? 'bg-[#2E8B57]/12 border-[#2E8B57] shadow-[0_3px_0_#2E8B57]'
                  : isWrongSelected
                    ? 'bg-[#E0523D]/10 border-[#E0523D]'
                    : 'bg-white border-[#1F2430] shadow-[0_3px_0_#1F2430] hover:-translate-y-0.5 active:translate-y-0.5'
                }`}
            >
              <span className="shrink-0 w-6 h-6 rounded-lg bg-[#EFE6D8] border border-[#1F2430]/30 text-xs font-extrabold flex items-center justify-center">
                {idx + 1}
              </span>
              <div className="text-base font-bold text-[#1F2430]">
                <RubyText tokens={opt.tokens} displayMode={displayMode} />
              </div>
            </button>
          );
        })}
      </div>

      {result && (
        <div
          className={`p-3.5 rounded-2xl border-2 animate-pop-in ${result.correct
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
            <p className="text-sm font-bold leading-relaxed">{result.feedbackZh}</p>
          </div>

          {result.correct && (
            <button
              type="button"
              onClick={() => onContinue(result.nextNodeId)}
              className="mt-3 w-full py-2.5 rounded-xl bg-[#2E8B57] text-white font-extrabold text-sm flex items-center justify-center gap-1.5 hover:bg-[#257347] active:scale-[0.99] transition cursor-pointer"
            >
              繼續對話 <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
