import { useCallback, useEffect, useState } from 'react';
import { SCENARIO_MAP } from './data';
import {
  advanceToNextNode,
  applyEvalResult,
  computeStageSummary,
  createStageRun,
  getNode,
  recordHintUsed,
  type ChallengeEvalResult,
  type StageRunState,
} from './engine/dialogueEngine';
import { audioManager } from './engine/audioManager';
import { useGameStore } from './store/useGameStore';
import { WorldMap } from './components/WorldMap';
import { StageScene } from './components/StageScene';
import { DialogueBox } from './components/DialogueBox';
import { ChoiceChallenge } from './components/challenges/ChoiceChallenge';
import { ClauseBuilder } from './components/challenges/ClauseBuilder';
import { ClozeChallenge } from './components/challenges/ClozeChallenge';
import { StageSummaryView } from './components/StageSummary';
import { VocabPopover } from './components/VocabPopover';
import { ReviewDojo } from './components/ReviewDojo';

type ViewMode = { type: 'map' } | { type: 'stage'; scenarioId: string } | { type: 'dojo' };

export function App() {
  const [view, setView] = useState<ViewMode>({ type: 'map' });
  const [run, setRun] = useState<StageRunState | null>(null);
  const [activeVocabId, setActiveVocabId] = useState<string | null>(null);
  const [npcReaction, setNpcReaction] = useState<'default' | 'happy' | 'thinking'>('default');

  const displayMode = useGameStore((s) => s.displayMode);
  const pureListening = useGameStore((s) => s.pureListening);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const cycleDisplayMode = useGameStore((s) => s.cycleDisplayMode);
  const togglePureListening = useGameStore((s) => s.togglePureListening);
  const toggleSfx = useGameStore((s) => s.toggleSfx);
  const recordStageResult = useGameStore((s) => s.recordStageResult);
  const recordWrongVocabs = useGameStore((s) => s.recordWrongVocabs);

  const activeScenario =
    view.type === 'stage' ? SCENARIO_MAP[view.scenarioId] ?? null : null;
  const activeNode =
    activeScenario && run ? getNode(activeScenario, run.currentNodeId) : null;

  const playNodeVoice = useCallback(
    (rate: 1 | 0.75 = 1) => {
      if (!activeNode) return;
      const fallback =
        activeNode.ttsText ?? activeNode.npcTokens.map((t) => t.text).join('');
      void audioManager.playVoice(activeNode.audioId, fallback, { rate });
    },
    [activeNode],
  );

  // Auto-play NPC line when entering a new node
  useEffect(() => {
    if (!activeNode) return;
    setNpcReaction('default');
    playNodeVoice(1);
  }, [activeNode?.id]);

  // Global keyboard shortcuts inside stage
  useEffect(() => {
    if (view.type !== 'stage' || !activeNode || activeNode.isEnd) return;
    const onKey = (e: KeyboardEvent) => {
      if (activeVocabId) {
        if (e.key === 'Escape') setActiveVocabId(null);
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        playNodeVoice(1);
      } else if (e.key.toLowerCase() === 's') {
        playNodeVoice(0.75);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view.type, activeNode, activeVocabId, playNodeVoice]);

  const startStage = (scenarioId: string) => {
    const scenario = SCENARIO_MAP[scenarioId];
    if (!scenario) return;
    audioManager.playTap();
    setRun(createStageRun(scenario, pureListening));
    setView({ type: 'stage', scenarioId });
  };

  const handleEvaluated = (res: ChallengeEvalResult) => {
    if (!run) return;
    const nextRun = applyEvalResult(run, res);
    setRun(nextRun);

    if (res.correct) {
      audioManager.playCorrect(nextRun.combo);
      setNpcReaction('happy');
    } else {
      audioManager.playWrong();
      setNpcReaction('thinking');
      recordWrongVocabs(res.wrongVocabIds);
    }
  };

  const handleContinue = (nextNodeId?: string) => {
    if (!run || !activeScenario) return;
    const nextRun = advanceToNextNode(run, activeScenario, nextNodeId);
    setRun(nextRun);
    if (nextRun.completed) {
      audioManager.playStageClear();
      recordStageResult(computeStageSummary(nextRun));
    }
  };

  const handleBackMap = () => {
    audioManager.stopVoice();
    setRun(null);
    setView({ type: 'map' });
  };

  const displayExpression =
    npcReaction === 'happy'
      ? 'happy'
      : npcReaction === 'thinking'
        ? 'thinking'
        : (activeNode?.expression ?? 'neutral');

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-0 sm:py-6 px-0 sm:px-4">
      <main className="w-full max-w-[460px] min-h-screen sm:min-h-[760px] bg-[#FFF8F0] sm:rounded-[32px] sm:border-2 sm:border-[#1F2430] sm:shadow-[0_12px_0_#1F2430] overflow-hidden flex flex-col">
        {view.type === 'map' && (
          <WorldMap
            onSelectStage={startStage}
            onOpenDojo={() => {
              audioManager.playTap();
              setView({ type: 'dojo' });
            }}
          />
        )}

        {view.type === 'dojo' && <ReviewDojo onBack={handleBackMap} />}

        {view.type === 'stage' && activeScenario && run && activeNode && (
          <>
            <StageScene
              sceneTheme={activeScenario.sceneTheme}
              locationTag={activeScenario.locationTag}
              npcName={activeScenario.npcName}
              npcRoleZh={activeScenario.npcRoleZh}
              npcAvatar={activeScenario.npcAvatar}
              expression={displayExpression}
              stepIndex={run.visitedNodeIds.length - 1}
              totalSteps={activeScenario.nodes.length}
              combo={run.combo}
              displayMode={displayMode}
              pureListening={pureListening}
              sfxEnabled={sfxEnabled}
              onBack={handleBackMap}
              onCycleDisplay={cycleDisplayMode}
              onToggleListening={togglePureListening}
              onToggleSfx={toggleSfx}
            />

            <div className="flex-1 flex flex-col justify-between p-4 space-y-4">
              {activeNode.isEnd ? (
                <>
                  <DialogueBox
                    node={activeNode}
                    displayMode={displayMode}
                    pureListening={false}
                    onPlayNormal={() => playNodeVoice(1)}
                    onPlaySlow={() => playNodeVoice(0.75)}
                    onVocabClick={setActiveVocabId}
                    onHintUsed={() => {}}
                  />
                  <StageSummaryView
                    scenario={activeScenario}
                    summary={computeStageSummary(run)}
                    onReplay={() => startStage(activeScenario.id)}
                    onBackMap={handleBackMap}
                    onOpenVocab={setActiveVocabId}
                  />
                </>
              ) : (
                <>
                  <DialogueBox
                    node={activeNode}
                    displayMode={displayMode}
                    pureListening={pureListening}
                    onPlayNormal={() => playNodeVoice(1)}
                    onPlaySlow={() => playNodeVoice(0.75)}
                    onVocabClick={setActiveVocabId}
                    onHintUsed={() => setRun((prev) => (prev ? recordHintUsed(prev) : prev))}
                  />

                  {activeNode.challenge?.type === 'choice' && (
                    <ChoiceChallenge
                      node={activeNode}
                      displayMode={displayMode}
                      onEvaluated={handleEvaluated}
                      onContinue={handleContinue}
                    />
                  )}

                  {activeNode.challenge?.type === 'clause-builder' && (
                    <ClauseBuilder
                      node={activeNode}
                      displayMode={displayMode}
                      onEvaluated={handleEvaluated}
                      onContinue={handleContinue}
                    />
                  )}

                  {activeNode.challenge?.type === 'cloze' && (
                    <ClozeChallenge
                      node={activeNode}
                      displayMode={displayMode}
                      onVocabClick={setActiveVocabId}
                      onEvaluated={handleEvaluated}
                      onContinue={handleContinue}
                    />
                  )}
                </>
              )}
            </div>
          </>
        )}
      </main>

      {view.type === 'stage' && (
        <p className="hidden sm:block mt-3 text-[11px] text-[#5C6475] font-medium">
          快捷鍵：<kbd className="px-1.5 py-0.5 rounded bg-white border">Space</kbd> 重聽 ·{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white border">S</kbd> 0.75x 慢速 ·{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white border">1-4</kbd> 選答
        </p>
      )}

      <VocabPopover vocabId={activeVocabId} onClose={() => setActiveVocabId(null)} />
    </div>
  );
}

export default App;
