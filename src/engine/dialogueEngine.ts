import type { DialogueNode, RubyToken, Scenario } from '../types/dialogue';

export interface StageRunState {
  scenarioId: string;
  currentNodeId: string;
  visitedNodeIds: string[];
  score: number;
  combo: number;
  maxCombo: number;
  attempts: number;
  correctCount: number;
  mistakes: number;
  hintCount: number;
  pureListeningBonus: boolean;
  wrongVocabIds: string[];
  encounteredVocabIds: string[];
  completed: boolean;
}

export interface ChallengeEvalResult {
  correct: boolean;
  feedbackZh: string;
  grammarTipId?: string;
  nextNodeId?: string;
  wrongVocabIds: string[];
  encounteredVocabIds: string[];
}

export interface StageSummary {
  scenarioId: string;
  score: number;
  stars: 1 | 2 | 3;
  accuracy: number;
  maxCombo: number;
  mistakes: number;
  hintCount: number;
  pureListeningBonus: boolean;
  wrongVocabIds: string[];
  encounteredVocabIds: string[];
}

function collectVocabFromTokens(tokens: RubyToken[]): string[] {
  return tokens.map((t) => t.vocabId).filter((id): id is string => Boolean(id));
}

function mergeUnique(base: string[], extra: string[]): string[] {
  const set = new Set(base);
  for (const item of extra) set.add(item);
  return [...set];
}

export function getNode(scenario: Scenario, nodeId: string): DialogueNode {
  const found = scenario.nodes.find((n) => n.id === nodeId);
  if (!found) {
    throw new Error(`Node "${nodeId}" not found in scenario "${scenario.id}"`);
  }
  return found;
}

export function createStageRun(scenario: Scenario, pureListening = false): StageRunState {
  const startNode = getNode(scenario, scenario.startNodeId);
  const initialVocab = collectVocabFromTokens(startNode.npcTokens);
  return {
    scenarioId: scenario.id,
    currentNodeId: scenario.startNodeId,
    visitedNodeIds: [scenario.startNodeId],
    score: 0,
    combo: 0,
    maxCombo: 0,
    attempts: 0,
    correctCount: 0,
    mistakes: 0,
    hintCount: 0,
    pureListeningBonus: pureListening,
    wrongVocabIds: [],
    encounteredVocabIds: initialVocab,
    completed: Boolean(startNode.isEnd),
  };
}

export function evaluateChoice(node: DialogueNode, optionId: string): ChallengeEvalResult {
  if (!node.challenge || node.challenge.type !== 'choice') {
    throw new Error(`Node ${node.id} is not a choice challenge`);
  }
  const opt = node.challenge.options.find((o) => o.id === optionId);
  if (!opt) {
    throw new Error(`Option ${optionId} not found on node ${node.id}`);
  }
  const tokenVocabs = collectVocabFromTokens(opt.tokens);
  return {
    correct: opt.correct,
    feedbackZh: opt.feedbackZh,
    nextNodeId: opt.nextNodeId ?? node.nextNodeId,
    wrongVocabIds: opt.correct ? [] : (opt.wrongVocabIds ?? tokenVocabs),
    encounteredVocabIds: tokenVocabs,
  };
}

export function evaluateClauseBuilder(
  node: DialogueNode,
  selectedBlockIds: string[],
): ChallengeEvalResult {
  if (!node.challenge || node.challenge.type !== 'clause-builder') {
    throw new Error(`Node ${node.id} is not a clause-builder challenge`);
  }
  const { correctOrder, blocks, grammarTipId, targetVocabIds, feedbackSuccessZh, feedbackWrongZh } =
    node.challenge;

  const isExactMatch =
    selectedBlockIds.length === correctOrder.length &&
    correctOrder.every((id, idx) => selectedBlockIds[idx] === id);

  const blockVocabs = blocks.flatMap((b) => collectVocabFromTokens(b.tokens));
  const allTarget = mergeUnique(targetVocabIds ?? [], blockVocabs);

  return {
    correct: isExactMatch,
    feedbackZh: isExactMatch ? feedbackSuccessZh : feedbackWrongZh,
    grammarTipId,
    nextNodeId: node.nextNodeId,
    wrongVocabIds: isExactMatch ? [] : (targetVocabIds ?? blockVocabs),
    encounteredVocabIds: allTarget,
  };
}

export function evaluateCloze(node: DialogueNode, choiceIndex: number): ChallengeEvalResult {
  if (!node.challenge || node.challenge.type !== 'cloze') {
    throw new Error(`Node ${node.id} is not a cloze challenge`);
  }
  const choice = node.challenge.choices[choiceIndex];
  if (!choice) {
    throw new Error(`Cloze choice index ${choiceIndex} out of bounds on node ${node.id}`);
  }
  const sentenceVocabs = [
    ...collectVocabFromTokens(node.challenge.beforeTokens),
    ...collectVocabFromTokens(node.challenge.afterTokens),
  ];
  const allTarget = mergeUnique(node.challenge.targetVocabIds ?? [], sentenceVocabs);

  return {
    correct: choice.correct,
    feedbackZh: choice.explanationZh,
    grammarTipId: node.challenge.grammarTipId,
    nextNodeId: node.nextNodeId,
    wrongVocabIds: choice.correct ? [] : (node.challenge.targetVocabIds ?? sentenceVocabs),
    encounteredVocabIds: allTarget,
  };
}

export function applyEvalResult(
  run: StageRunState,
  result: ChallengeEvalResult,
): StageRunState {
  const nextAttempts = run.attempts + 1;
  const encountered = mergeUnique(run.encounteredVocabIds, result.encounteredVocabIds);

  if (!result.correct) {
    return {
      ...run,
      attempts: nextAttempts,
      combo: 0,
      mistakes: run.mistakes + 1,
      wrongVocabIds: mergeUnique(run.wrongVocabIds, result.wrongVocabIds),
      encounteredVocabIds: encountered,
    };
  }

  const nextCombo = run.combo + 1;
  const maxCombo = Math.max(run.maxCombo, nextCombo);
  const comboBonus = Math.min(nextCombo - 1, 5) * 20;
  const listeningBonus = run.pureListeningBonus ? 30 : 0;

  return {
    ...run,
    attempts: nextAttempts,
    correctCount: run.correctCount + 1,
    combo: nextCombo,
    maxCombo,
    score: run.score + 100 + comboBonus + listeningBonus,
    encounteredVocabIds: encountered,
  };
}

export function advanceToNextNode(
  run: StageRunState,
  scenario: Scenario,
  nextNodeId?: string,
): StageRunState {
  const current = getNode(scenario, run.currentNodeId);
  const targetId = nextNodeId ?? current.nextNodeId;
  if (!targetId) {
    return { ...run, completed: true };
  }
  const nextNode = getNode(scenario, targetId);
  const npcVocab = collectVocabFromTokens(nextNode.npcTokens);
  return {
    ...run,
    currentNodeId: targetId,
    visitedNodeIds: [...run.visitedNodeIds, targetId],
    encounteredVocabIds: mergeUnique(run.encounteredVocabIds, npcVocab),
    completed: Boolean(nextNode.isEnd),
  };
}

export function recordHintUsed(run: StageRunState): StageRunState {
  return {
    ...run,
    hintCount: run.hintCount + 1,
    pureListeningBonus: false,
  };
}

export function computeStageSummary(run: StageRunState): StageSummary {
  const accuracy =
    run.attempts === 0 ? 100 : Math.round((run.correctCount / run.attempts) * 100);

  let stars: 1 | 2 | 3 = 1;
  if (run.mistakes === 0 && run.hintCount <= 1) {
    stars = 3;
  } else if (accuracy >= 70 && run.mistakes <= 2) {
    stars = 2;
  }

  return {
    scenarioId: run.scenarioId,
    score: run.score,
    stars,
    accuracy,
    maxCombo: run.maxCombo,
    mistakes: run.mistakes,
    hintCount: run.hintCount,
    pureListeningBonus: run.pureListeningBonus,
    wrongVocabIds: run.wrongVocabIds,
    encounteredVocabIds: run.encounteredVocabIds,
  };
}
