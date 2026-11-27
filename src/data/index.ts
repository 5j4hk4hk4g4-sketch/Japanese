import vocabRaw from './vocab/n5-core.json';
import grammarTipsRaw from './grammar/n5-tips.json';
import hotelRaw from './scenarios/01-hotel.json';
import drugstoreRaw from './scenarios/02-drugstore.json';
import stationRaw from './scenarios/03-station.json';
import type { Scenario } from '../types/dialogue';
import type { GrammarTip, VocabEntry } from '../types/vocab';

export const VOCAB_LIST = vocabRaw as VocabEntry[];
export const GRAMMAR_TIPS = grammarTipsRaw as GrammarTip[];
export const SCENARIOS: Scenario[] = [
  hotelRaw as Scenario,
  drugstoreRaw as Scenario,
  stationRaw as Scenario,
].sort((a, b) => a.order - b.order);

export const VOCAB_MAP: Record<string, VocabEntry> = Object.fromEntries(
  VOCAB_LIST.map((v) => [v.id, v]),
);

export const GRAMMAR_TIP_MAP: Record<string, GrammarTip> = Object.fromEntries(
  GRAMMAR_TIPS.map((g) => [g.id, g]),
);

export const SCENARIO_MAP: Record<string, Scenario> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
);
