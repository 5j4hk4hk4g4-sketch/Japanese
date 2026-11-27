import { describe, expect, it } from 'vitest';
import hotelRaw from '../../data/scenarios/01-hotel.json';
import drugstoreRaw from '../../data/scenarios/02-drugstore.json';
import type { Scenario } from '../../types/dialogue';
import {
  advanceToNextNode,
  applyEvalResult,
  computeStageSummary,
  createStageRun,
  evaluateChoice,
  evaluateClauseBuilder,
  evaluateCloze,
  getNode,
  recordHintUsed,
} from '../dialogueEngine';

const hotel = hotelRaw as Scenario;
const drugstore = drugstoreRaw as Scenario;

describe('dialogueEngine', () => {
  it('evaluates clause-builder with distractor rejection and exact order', () => {
    const node = getNode(hotel, 'h1');
    const wrong = evaluateClauseBuilder(node, ['b1', 'd1', 'b3']);
    expect(wrong.correct).toBe(false);
    expect(wrong.wrongVocabIds.length).toBeGreaterThan(0);

    const right = evaluateClauseBuilder(node, ['b1', 'b2', 'b3']);
    expect(right.correct).toBe(true);
    expect(right.grammarTipId).toBe('wo-object');
  });

  it('evaluates choice and cloze challenges accurately', () => {
    const h2 = getNode(hotel, 'h2');
    const wrongChoice = evaluateChoice(h2, 'opt2');
    expect(wrongChoice.correct).toBe(false);
    expect(wrongChoice.wrongVocabIds).toContain('passport');

    const rightChoice = evaluateChoice(h2, 'opt1');
    expect(rightChoice.correct).toBe(true);
    expect(rightChoice.nextNodeId).toBe('h3');

    const d5 = getNode(drugstore, 'd5');
    const wrongCloze = evaluateCloze(d5, 1);
    expect(wrongCloze.correct).toBe(false);
    expect(wrongCloze.grammarTipId).toBe('de-means');

    const rightCloze = evaluateCloze(d5, 0);
    expect(rightCloze.correct).toBe(true);
  });

  it('tracks combo, pure listening bonus, hints, and star computation', () => {
    let run = createStageRun(hotel, true);
    const h1 = getNode(hotel, 'h1');
    const res1 = evaluateClauseBuilder(h1, ['b1', 'b2', 'b3']);
    run = applyEvalResult(run, res1);
    expect(run.combo).toBe(1);
    expect(run.score).toBe(130); // 100 + 30 listening bonus

    run = advanceToNextNode(run, hotel, res1.nextNodeId);
    expect(run.currentNodeId).toBe('h2');

    const h2 = getNode(hotel, 'h2');
    const res2 = evaluateChoice(h2, 'opt1');
    run = applyEvalResult(run, res2);
    expect(run.combo).toBe(2);
    expect(run.score).toBe(130 + 100 + 20 + 30);

    // Using hint disables pureListeningBonus
    run = recordHintUsed(run);
    expect(run.pureListeningBonus).toBe(false);

    const summary3 = computeStageSummary(run);
    expect(summary3.stars).toBe(3);

    // Making 1 mistake across 4 attempts (75% accuracy) drops stars from 3 to 2
    const wrongRes = evaluateChoice(h2, 'opt2');
    run = applyEvalResult(run, wrongRes);
    run = applyEvalResult(run, res2);
    const summary2 = computeStageSummary(run);
    expect(summary2.stars).toBe(2);
    expect(summary2.wrongVocabIds).toContain('passport');
  });
});
