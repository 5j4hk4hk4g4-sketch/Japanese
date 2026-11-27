import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateContentBundle } from '../src/engine/contentSchema';

function loadJson(relPath: string): unknown {
  const full = resolve(process.cwd(), relPath);
  return JSON.parse(readFileSync(full, 'utf-8'));
}

const vocab = loadJson('src/data/vocab/n5-core.json');
const grammarTips = loadJson('src/data/grammar/n5-tips.json');
const scenarios = [
  loadJson('src/data/scenarios/01-hotel.json'),
  loadJson('src/data/scenarios/02-drugstore.json'),
  loadJson('src/data/scenarios/03-station.json'),
];

const result = validateContentBundle({ vocab, grammarTips, scenarios });
const totalNodes = result.scenarios.reduce((acc, s) => acc + s.nodes.length, 0);

console.log(
  `[validate-content] OK: ${result.scenarios.length} scenarios (${totalNodes} nodes), ${result.vocab.length} vocab entries, ${result.grammarTips.length} grammar tips.`,
);
