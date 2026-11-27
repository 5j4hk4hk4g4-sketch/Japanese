import type { RubyToken } from '../types/dialogue';
import type { DisplayMode } from '../store/useGameStore';

interface RubyTextProps {
  tokens: RubyToken[];
  displayMode: DisplayMode;
  onVocabClick?: (vocabId: string) => void;
  className?: string;
}

export function RubyText({
  tokens,
  displayMode,
  onVocabClick,
  className = '',
}: RubyTextProps) {
  return (
    <span className={`font-jp leading-[1.9] ${className}`}>
      {tokens.map((token, idx) => {
        const clickable = Boolean(token.vocabId && onVocabClick);
        const content = renderTokenContent(token, displayMode);

        if (!clickable) {
          return <span key={idx}>{content}</span>;
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (token.vocabId && onVocabClick) {
                onVocabClick(token.vocabId);
              }
            }}
            className="inline border-b-2 border-dotted border-[#E0523D]/70 hover:bg-[#E0523D]/12 hover:border-[#E0523D] rounded-xs px-0.5 transition-colors cursor-pointer text-inherit"
            title="點擊查看單字卡"
          >
            {content}
          </button>
        );
      })}
    </span>
  );
}

function renderTokenContent(token: RubyToken, mode: DisplayMode) {
  if (mode === 'kana') {
    return token.reading ?? token.text;
  }
  if (mode === 'kanji' || !token.reading) {
    return token.text;
  }
  return (
    <ruby>
      {token.text}
      <rt>{token.reading}</rt>
    </ruby>
  );
}
