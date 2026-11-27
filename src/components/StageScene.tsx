import { ArrowLeft, Ear, EarOff, Flame, Volume2, VolumeX } from 'lucide-react';
import type { NpcAvatar, NpcExpression, SceneTheme } from '../types/dialogue';
import type { DisplayMode } from '../store/useGameStore';

interface StageSceneProps {
  sceneTheme: SceneTheme;
  locationTag: string;
  npcName: string;
  npcRoleZh: string;
  npcAvatar: NpcAvatar;
  expression: NpcExpression;
  stepIndex: number;
  totalSteps: number;
  combo: number;
  displayMode: DisplayMode;
  pureListening: boolean;
  sfxEnabled: boolean;
  onBack: () => void;
  onCycleDisplay: () => void;
  onToggleListening: () => void;
  onToggleSfx: () => void;
}

const DISPLAY_LABEL: Record<DisplayMode, string> = {
  furigana: '漢+あ',
  kana: 'あ',
  kanji: '漢',
};

export function StageScene({
  sceneTheme,
  locationTag,
  npcName,
  npcRoleZh,
  npcAvatar,
  expression,
  stepIndex,
  totalSteps,
  combo,
  displayMode,
  pureListening,
  sfxEnabled,
  onBack,
  onCycleDisplay,
  onToggleListening,
  onToggleSfx,
}: StageSceneProps) {
  return (
    <div className="relative overflow-hidden rounded-b-3xl border-b-2 border-[#1F2430] bg-[#EFE6D8]">
      {/* Scene SVG Backdrop */}
      <SceneBackdrop theme={sceneTheme} />

      {/* Top HUD */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-3 pb-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFF8F0]/92 border-2 border-[#1F2430] text-xs font-bold shadow-[0_2px_0_#1F2430] active:translate-y-0.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          地圖
        </button>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-1 bg-[#FFF8F0]/90 px-2.5 py-1.5 rounded-full border border-[#1F2430]/30">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i < stepIndex
                  ? 'w-2 bg-[#2E8B57]'
                  : i === stepIndex
                    ? 'w-4 bg-[#E0523D]'
                    : 'w-2 bg-[#D3C6B4]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {combo >= 2 && (
            <span className="flex items-center gap-0.5 px-2 py-1 rounded-xl bg-[#E0523D] text-white text-xs font-extrabold border-2 border-[#1F2430] shadow-[0_2px_0_#1F2430]">
              <Flame className="w-3.5 h-3.5" />
              {combo}
            </span>
          )}
          <button
            type="button"
            onClick={onCycleDisplay}
            className="px-2.5 py-1 rounded-xl bg-[#FFF8F0]/92 border-2 border-[#1F2430] text-xs font-extrabold shadow-[0_2px_0_#1F2430] cursor-pointer"
            title="切換振假名顯示 (純假名 / 漢字+振假名 / 純漢字)"
          >
            {DISPLAY_LABEL[displayMode]}
          </button>
          <button
            type="button"
            onClick={onToggleListening}
            className={`p-1.5 rounded-xl border-2 border-[#1F2430] shadow-[0_2px_0_#1F2430] cursor-pointer ${
              pureListening ? 'bg-[#2C497F] text-white' : 'bg-[#FFF8F0]/92 text-[#1F2430]'
            }`}
            title={pureListening ? '純聽力盲聽模式：開啟（加分獎勵）' : '純聽力盲聽模式：關閉'}
          >
            {pureListening ? <Ear className="w-3.5 h-3.5" /> : <EarOff className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onToggleSfx}
            className="p-1.5 rounded-xl bg-[#FFF8F0]/92 border-2 border-[#1F2430] shadow-[0_2px_0_#1F2430] cursor-pointer"
            title={sfxEnabled ? '音效開啟' : '音效靜音'}
          >
            {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Location Badge + NPC Portrait */}
      <div className="relative z-10 flex items-end justify-between px-4 pt-2 pb-3 min-h-[152px]">
        <div className="mb-1">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#1F2430] text-[#FFF8F0] text-[11px] font-bold tracking-wide">
            {locationTag}
          </span>
          <p className="mt-1.5 text-sm font-extrabold text-[#1F2430] drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
            {npcName}
          </p>
          <p className="text-xs font-medium text-[#475061] drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
            {npcRoleZh}
          </p>
        </div>

        <div className="animate-float-slow">
          <NpcIllustration avatar={npcAvatar} expression={expression} />
        </div>
      </div>
    </div>
  );
}

function SceneBackdrop({ theme }: { theme: SceneTheme }) {
  if (theme === 'hotel') {
    return (
      <svg
        className="absolute inset-0 w-full h-full object-cover"
        viewBox="0 0 460 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect width="460" height="220" fill="#F8EBD8" />
        <rect x="0" y="165" width="460" height="55" fill="#C98A5B" />
        <rect x="0" y="165" width="460" height="6" fill="#1F2430" opacity="0.2" />
        {/* Warm key rack */}
        <rect x="26" y="34" width="130" height="96" rx="8" fill="#E6D2B5" stroke="#1F2430" strokeWidth="2.5" />
        <line x1="38" y1="62" x2="144" y2="62" stroke="#8C6239" strokeWidth="2.5" />
        <line x1="38" y1="90" x2="144" y2="90" stroke="#8C6239" strokeWidth="2.5" />
        <circle cx="54" cy="70" r="5" fill="#D99226" />
        <circle cx="82" cy="70" r="5" fill="#D99226" />
        <circle cx="110" cy="70" r="5" fill="#D99226" />
        <circle cx="54" cy="98" r="5" fill="#E0523D" />
        {/* Reception sign */}
        <rect x="184" y="42" width="106" height="32" rx="6" fill="#2C497F" stroke="#1F2430" strokeWidth="2.5" />
        <text x="237" y="63" textAnchor="middle" fill="#FFF8F0" fontSize="13" fontWeight="700">
          CHECK-IN
        </text>
        {/* Desk bell */}
        <path d="M210 165 C210 152, 234 152, 234 165 Z" fill="#D99226" stroke="#1F2430" strokeWidth="2" />
      </svg>
    );
  }

  if (theme === 'drugstore') {
    return (
      <svg
        className="absolute inset-0 w-full h-full object-cover"
        viewBox="0 0 460 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect width="460" height="220" fill="#EDF6F2" />
        <rect x="0" y="168" width="460" height="52" fill="#DCE8E2" />
        {/* Shelves */}
        <rect x="20" y="32" width="190" height="118" rx="8" fill="#FFFFFF" stroke="#1F2430" strokeWidth="2.5" />
        <line x1="28" y1="74" x2="202" y2="74" stroke="#1F2430" strokeWidth="2" />
        <line x1="28" y1="114" x2="202" y2="114" stroke="#1F2430" strokeWidth="2" />
        {/* Bottles & Boxes */}
        <rect x="40" y="48" width="22" height="24" rx="4" fill="#E0523D" />
        <rect x="70" y="44" width="24" height="28" rx="4" fill="#2C497F" />
        <rect x="104" y="50" width="26" height="22" rx="4" fill="#2E8B57" />
        <rect x="44" y="88" width="30" height="24" rx="3" fill="#F2B134" />
        <rect x="86" y="88" width="24" height="24" rx="3" fill="#5D9CEC" />
        {/* Tax-Free Banner */}
        <rect x="230" y="38" width="96" height="32" rx="6" fill="#E0523D" stroke="#1F2430" strokeWidth="2.5" />
        <text x="278" y="59" textAnchor="middle" fill="#FFF8F0" fontSize="13" fontWeight="800">
          TAX FREE
        </text>
      </svg>
    );
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full object-cover"
      viewBox="0 0 460 220"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="460" height="220" fill="#E6EEF7" />
      <rect x="0" y="168" width="460" height="52" fill="#C7D3E3" />
      {/* Station Signboard */}
      <rect x="24" y="38" width="186" height="46" rx="6" fill="#FFFFFF" stroke="#1F2430" strokeWidth="2.5" />
      <rect x="24" y="68" width="186" height="16" rx="2" fill="#2E8B57" />
      <text x="117" y="59" textAnchor="middle" fill="#1F2430" fontSize="15" fontWeight="800">
        東京 TOKYO
      </text>
      {/* Yellow tactile paving line */}
      <rect x="0" y="182" width="460" height="10" fill="#F2C94C" />
      {/* Exit arrow */}
      <rect x="234" y="42" width="84" height="34" rx="6" fill="#F2C94C" stroke="#1F2430" strokeWidth="2.5" />
      <text x="276" y="64" textAnchor="middle" fill="#1F2430" fontSize="13" fontWeight="800">
        出口 EXIT →
      </text>
    </svg>
  );
}

function NpcIllustration({
  avatar,
  expression,
}: {
  avatar: NpcAvatar;
  expression: NpcExpression;
}) {
  const jacketColor =
    avatar === 'hotel-staff'
      ? '#2C497F'
      : avatar === 'drugstore-staff'
        ? '#2E8B57'
        : '#5C6475';
  const hairColor = avatar === 'drugstore-staff' ? '#2A2D34' : '#3B2C26';

  const mouthPath =
    expression === 'happy'
      ? 'M 52 72 Q 60 80 68 72 Z'
      : expression === 'smile'
        ? 'M 53 73 Q 60 79 67 73'
        : expression === 'thinking'
          ? 'M 55 75 Q 60 73 65 75'
          : expression === 'surprised'
            ? 'M 57 73 A 3 4 0 1 0 63 73 A 3 4 0 1 0 57 73'
            : 'M 54 74 L 66 74';

  return (
    <svg width="116" height="126" viewBox="0 0 120 130" aria-hidden="true">
      {/* Body */}
      <path
        d="M 24 128 C 24 96, 96 96, 96 128 Z"
        fill={jacketColor}
        stroke="#1F2430"
        strokeWidth="3"
      />
      {/* Shirt collar */}
      <polygon points="50,98 60,115 70,98" fill="#FFF8F0" stroke="#1F2430" strokeWidth="2" />
      {avatar === 'hotel-staff' && (
        <polygon points="57,104 60,122 63,104" fill="#E0523D" />
      )}
      {/* Neck */}
      <rect x="53" y="83" width="14" height="18" rx="6" fill="#FAD7BD" stroke="#1F2430" strokeWidth="2.5" />
      {/* Hair back */}
      <circle cx="60" cy="54" r="31" fill={hairColor} stroke="#1F2430" strokeWidth="3" />
      {/* Head */}
      <circle cx="60" cy="58" r="25" fill="#FCE2CD" stroke="#1F2430" strokeWidth="3" />
      {/* Hair bangs */}
      <path
        d="M 35 50 C 40 28, 82 28, 85 50 C 76 42, 65 44, 60 40 C 52 45, 42 44, 35 50 Z"
        fill={hairColor}
      />
      {/* Cheeks */}
      <circle cx="44" cy="66" r="4" fill="#F29C94" opacity="0.55" />
      <circle cx="76" cy="66" r="4" fill="#F29C94" opacity="0.55" />
      {/* Eyes */}
      {expression === 'happy' ? (
        <>
          <path d="M 44 58 Q 49 53 54 58" fill="none" stroke="#1F2430" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M 66 58 Q 71 53 76 58" fill="none" stroke="#1F2430" strokeWidth="2.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="49" cy="58" r="3.2" fill="#1F2430" />
          <circle cx="71" cy="58" r="3.2" fill="#1F2430" />
        </>
      )}
      {/* Mouth */}
      <path
        d={mouthPath}
        fill={expression === 'happy' ? '#E0523D' : 'none'}
        stroke="#1F2430"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
