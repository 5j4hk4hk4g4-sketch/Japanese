import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import hotelRaw from '../../data/scenarios/01-hotel.json';
import type { Scenario } from '../../types/dialogue';
import { getNode } from '../../engine/dialogueEngine';
import { ClauseBuilder } from '../challenges/ClauseBuilder';

afterEach(cleanup);

const hotel = hotelRaw as Scenario;

describe('ClauseBuilder interaction', () => {
  it('adds blocks with vocabId into the tray, allows removal, and submits exact answer', () => {
    const h1 = getNode(hotel, 'h1');
    const onEvaluated = vi.fn();
    const onContinue = vi.fn();

    render(
      <ClauseBuilder
        node={h1}
        displayMode="furigana"
        onEvaluated={onEvaluated}
        onContinue={onContinue}
      />,
    );

    // Clicking blocks that carry vocabId (e.g. sumimasen, onegaishimasu) must select them into tray
    fireEvent.click(screen.getByRole('button', { name: /すみません/ }));
    fireEvent.click(screen.getByRole('button', { name: /チェックインを/ }));

    // Remove the first block from the tray and re-add it
    const trayRemoveBtn = screen
      .getAllByRole('button', { name: /すみません/ })
      .find((btn) => !btn.hasAttribute('disabled'));
    expect(trayRemoveBtn).toBeTruthy();
    fireEvent.click(trayRemoveBtn!);

    // Tray now only has チェックインを, reset and build in exact order
    fireEvent.click(screen.getByRole('button', { name: /重組/ }));
    fireEvent.click(screen.getByRole('button', { name: /すみません/ }));
    fireEvent.click(screen.getByRole('button', { name: /チェックインを/ }));
    fireEvent.click(screen.getByRole('button', { name: /お願い/ }));

    fireEvent.click(screen.getByRole('button', { name: '送出回答' }));

    expect(onEvaluated).toHaveBeenCalledWith(
      expect.objectContaining({
        correct: true,
        grammarTipId: 'wo-object',
      }),
    );

    const continueBtn = screen.getByRole('button', { name: /繼續對話/ });
    expect(continueBtn).toBeTruthy();
    fireEvent.click(continueBtn);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
