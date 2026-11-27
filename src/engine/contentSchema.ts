import { z } from 'zod';
import type { RubyToken, Scenario } from '../types/dialogue';
import type { GrammarTip, VocabEntry } from '../types/vocab';

export const rubyTokenSchema = z.object({
  text: z.string().min(1),
  reading: z.string().min(1).optional(),
  vocabId: z.string().min(1).optional(),
});

const choiceChallengeSchema = z.object({
  type: z.literal('choice'),
  promptZh: z.string().min(1),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        tokens: z.array(rubyTokenSchema).min(1),
        correct: z.boolean(),
        feedbackZh: z.string().min(1),
        nextNodeId: z.string().min(1).optional(),
        wrongVocabIds: z.array(z.string().min(1)).optional(),
      }),
    )
    .min(2),
});

const clauseBuilderChallengeSchema = z.object({
  type: z.literal('clause-builder'),
  promptZh: z.string().min(1),
  correctOrder: z.array(z.string().min(1)).min(2),
  blocks: z
    .array(
      z.object({
        id: z.string().min(1),
        tokens: z.array(rubyTokenSchema).min(1),
        isDistractor: z.boolean().optional(),
      }),
    )
    .min(2),
  grammarTipId: z.string().min(1),
  targetVocabIds: z.array(z.string().min(1)).optional(),
  feedbackSuccessZh: z.string().min(1),
  feedbackWrongZh: z.string().min(1),
});

const clozeChallengeSchema = z.object({
  type: z.literal('cloze'),
  promptZh: z.string().min(1),
  beforeTokens: z.array(rubyTokenSchema),
  afterTokens: z.array(rubyTokenSchema),
  choices: z
    .array(
      z.object({
        text: z.string().min(1),
        reading: z.string().min(1).optional(),
        correct: z.boolean(),
        explanationZh: z.string().min(1),
      }),
    )
    .min(2),
  grammarTipId: z.string().min(1),
  targetVocabIds: z.array(z.string().min(1)).optional(),
});

export const challengeSchema = z.discriminatedUnion('type', [
  choiceChallengeSchema,
  clauseBuilderChallengeSchema,
  clozeChallengeSchema,
]);

export const dialogueNodeSchema = z.object({
  id: z.string().min(1),
  speaker: z.string().min(1),
  speakerVoice: z.enum(['nanami', 'keita']),
  expression: z.enum(['neutral', 'smile', 'thinking', 'surprised', 'happy']),
  npcTokens: z.array(rubyTokenSchema).min(1),
  npcZh: z.string().min(1),
  ttsText: z.string().min(1).optional(),
  audioId: z.string().min(1),
  challenge: challengeSchema.optional(),
  nextNodeId: z.string().min(1).optional(),
  isEnd: z.boolean().optional(),
});

export const scenarioSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  titleJa: z.string().min(1),
  titleZh: z.string().min(1),
  subtitleZh: z.string().min(1),
  locationTag: z.string().min(1),
  sceneTheme: z.enum(['hotel', 'drugstore', 'station']),
  npcName: z.string().min(1),
  npcRoleZh: z.string().min(1),
  npcAvatar: z.enum(['hotel-staff', 'drugstore-staff', 'commuter']),
  grammarFocus: z.array(z.string().min(1)).min(1),
  startNodeId: z.string().min(1),
  nodes: z.array(dialogueNodeSchema).min(1),
});

export const vocabEntrySchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  reading: z.string().min(1),
  pitch: z.string().optional(),
  posZh: z.string().min(1),
  meaningZh: z.string().min(1),
  ttsText: z.string().min(1).optional(),
  audioId: z.string().min(1),
  exampleJa: z.string().min(1),
  exampleZh: z.string().min(1),
  stageId: z.string().min(1),
});

export const grammarTipSchema = z.object({
  id: z.string().min(1),
  titleZh: z.string().min(1),
  patternJa: z.string().min(1),
  summaryZh: z.string().min(1),
  contrastExample: z
    .object({
      goodJa: z.string().min(1),
      goodZh: z.string().min(1),
      badJa: z.string().min(1).optional(),
      noteZh: z.string().min(1),
    })
    .optional(),
});

export const vocabListSchema = z.array(vocabEntrySchema).min(1);
export const grammarTipListSchema = z.array(grammarTipSchema).min(1);

function collectTokensVocabIds(tokens: RubyToken[], out: string[]) {
  for (const t of tokens) {
    if (t.vocabId) out.push(t.vocabId);
  }
}

export function validateContentBundle(input: {
  vocab: unknown;
  grammarTips: unknown;
  scenarios: unknown[];
}): {
  vocab: VocabEntry[];
  grammarTips: GrammarTip[];
  scenarios: Scenario[];
} {
  const vocab = vocabListSchema.parse(input.vocab);
  const grammarTips = grammarTipListSchema.parse(input.grammarTips);
  const scenarios = input.scenarios.map((s) => scenarioSchema.parse(s));

  const vocabIds = new Set<string>();
  for (const v of vocab) {
    if (vocabIds.has(v.id)) {
      throw new Error(`Duplicate vocabId: ${v.id}`);
    }
    vocabIds.add(v.id);
  }

  const tipIds = new Set<string>();
  for (const g of grammarTips) {
    if (tipIds.has(g.id)) {
      throw new Error(`Duplicate grammarTipId: ${g.id}`);
    }
    tipIds.add(g.id);
  }

  const audioIds = new Set<string>(vocab.map((v) => v.audioId));

  for (const scenario of scenarios) {
    const nodeMap = new Map(scenario.nodes.map((n) => [n.id, n]));
    if (nodeMap.size !== scenario.nodes.length) {
      throw new Error(`Scenario ${scenario.id} contains duplicate node ids`);
    }
    if (!nodeMap.has(scenario.startNodeId)) {
      throw new Error(`Scenario ${scenario.id} startNodeId missing: ${scenario.startNodeId}`);
    }

    let hasEnd = false;

    for (const node of scenario.nodes) {
      if (audioIds.has(node.audioId)) {
        throw new Error(`Duplicate audioId detected: ${node.audioId}`);
      }
      audioIds.add(node.audioId);

      if (node.isEnd) hasEnd = true;
      if (node.nextNodeId && !nodeMap.has(node.nextNodeId)) {
        throw new Error(`Scenario ${scenario.id} node ${node.id} invalid nextNodeId: ${node.nextNodeId}`);
      }
      if (!node.isEnd && !node.nextNodeId) {
        const allOptionsHaveNext =
          node.challenge?.type === 'choice' && node.challenge.options.every((o) => !o.correct || Boolean(o.nextNodeId));
        if (!allOptionsHaveNext) {
          throw new Error(`Scenario ${scenario.id} node ${node.id} has no nextNodeId and is not an end node`);
        }
      }

      const referencedVocab: string[] = [];
      collectTokensVocabIds(node.npcTokens, referencedVocab);

      if (node.challenge) {
        if (node.challenge.type === 'choice') {
          if (!node.challenge.options.some((o) => o.correct)) {
            throw new Error(`Scenario ${scenario.id} node ${node.id} choice has no correct option`);
          }
          for (const opt of node.challenge.options) {
            collectTokensVocabIds(opt.tokens, referencedVocab);
            if (opt.nextNodeId && !nodeMap.has(opt.nextNodeId)) {
              throw new Error(`Scenario ${scenario.id} node ${node.id} option ${opt.id} invalid nextNodeId: ${opt.nextNodeId}`);
            }
            if (opt.wrongVocabIds) referencedVocab.push(...opt.wrongVocabIds);
          }
        } else if (node.challenge.type === 'clause-builder') {
          if (!tipIds.has(node.challenge.grammarTipId)) {
            throw new Error(`Scenario ${scenario.id} node ${node.id} missing grammarTipId: ${node.challenge.grammarTipId}`);
          }
          const blockIds = new Set(node.challenge.blocks.map((b) => b.id));
          for (const id of node.challenge.correctOrder) {
            if (!blockIds.has(id)) {
              throw new Error(`Scenario ${scenario.id} node ${node.id} correctOrder references missing block: ${id}`);
            }
          }
          for (const b of node.challenge.blocks) {
            collectTokensVocabIds(b.tokens, referencedVocab);
          }
          if (node.challenge.targetVocabIds) referencedVocab.push(...node.challenge.targetVocabIds);
        } else if (node.challenge.type === 'cloze') {
          if (!tipIds.has(node.challenge.grammarTipId)) {
            throw new Error(`Scenario ${scenario.id} node ${node.id} missing grammarTipId: ${node.challenge.grammarTipId}`);
          }
          if (!node.challenge.choices.some((c) => c.correct)) {
            throw new Error(`Scenario ${scenario.id} node ${node.id} cloze has no correct choice`);
          }
          collectTokensVocabIds(node.challenge.beforeTokens, referencedVocab);
          collectTokensVocabIds(node.challenge.afterTokens, referencedVocab);
          if (node.challenge.targetVocabIds) referencedVocab.push(...node.challenge.targetVocabIds);
        }
      }

      for (const vid of referencedVocab) {
        if (!vocabIds.has(vid)) {
          throw new Error(`Scenario ${scenario.id} node ${node.id} references unknown vocabId: ${vid}`);
        }
      }
    }

    if (!hasEnd) {
      throw new Error(`Scenario ${scenario.id} has no isEnd node`);
    }

    // BFS reachability + cycle guard: verify every reachable path can terminate
    const visited = new Set<string>();
    const queue = [scenario.startNodeId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const n = nodeMap.get(id)!;
      if (n.nextNodeId) queue.push(n.nextNodeId);
      if (n.challenge?.type === 'choice') {
        for (const opt of n.challenge.options) {
          if (opt.nextNodeId) queue.push(opt.nextNodeId);
        }
      }
    }
    const reachableEnd = [...visited].some((id) => nodeMap.get(id)?.isEnd);
    if (!reachableEnd) {
      throw new Error(`Scenario ${scenario.id} cannot reach any end node from ${scenario.startNodeId}`);
    }
  }

  return { vocab, grammarTips, scenarios };
}
