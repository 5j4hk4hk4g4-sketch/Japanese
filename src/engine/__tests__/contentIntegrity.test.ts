import { describe, expect, it } from 'vitest';
import vocabRaw from '../../data/vocab/n5-core.json';
import grammarTipsRaw from '../../data/grammar/n5-tips.json';
import hotelRaw from '../../data/scenarios/01-hotel.json';
import drugstoreRaw from '../../data/scenarios/02-drugstore.json';
import stationRaw from '../../data/scenarios/03-station.json';
import { validateContentBundle } from '../contentSchema';

describe('content integrity', () => {
  it('validates all scenarios, vocab entries, and grammar tips with zero broken refs', () => {
    const bundle = validateContentBundle({
      vocab: vocabRaw,
      grammarTips: grammarTipsRaw,
      scenarios: [hotelRaw, drugstoreRaw, stationRaw],
    });
    expect(bundle.scenarios).toHaveLength(3);
    expect(bundle.vocab.length).toBeGreaterThanOrEqual(54);
    expect(bundle.grammarTips).toHaveLength(10);
  });
});
