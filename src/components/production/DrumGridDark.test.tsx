import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DrumGridDark } from './DrumGridDark';
import { createEmptyNotesRecord, GrooveData, MAX_MEASURES } from '../../types';

function createEmptyGroove(): GrooveData {
  return {
    timeSignature: { beats: 4, noteValue: 4 },
    division: 8,
    tempo: 120,
    swing: 0,
    measures: [{ notes: createEmptyNotesRecord(8) }],
  };
}

function renderGrid(
  groove = createEmptyGroove(),
  overrides: Partial<React.ComponentProps<typeof DrumGridDark>> = {}
) {
  const props = {
    groove,
    onNoteToggle: vi.fn(),
    onSetNotes: vi.fn(),
    onPreview: vi.fn(),
    onMeasureCopy: vi.fn(),
    onMeasurePaste: vi.fn().mockReturnValue(true),
    ...overrides,
  };

  const renderResult = render(<DrumGridDark {...props} />);

  return {
    app: screen.getByRole('application', { name: /keyboard editor/i }),
    props,
    renderResult,
  };
}

describe('DrumGridDark keyboard editing', () => {
  it('starts on hi-hat and toggles the default note with Space', () => {
    const { app, props } = renderGrid();

    fireEvent.keyDown(app, { key: ' ' });

    expect(props.onSetNotes).toHaveBeenCalledWith([
      { voice: 'hihat-closed', position: 0, measureIndex: 0, value: true },
    ]);
  });

  it('moves between rows with arrows before toggling', () => {
    const { app, props } = renderGrid();

    fireEvent.keyDown(app, { key: 'ArrowDown' });
    fireEvent.keyDown(app, { key: ' ' });

    expect(props.onSetNotes).toHaveBeenCalledWith([
      { voice: 'tom-10', position: 0, measureIndex: 0, value: true },
    ]);
  });

  it('duplicates the current note to the next cell with cmd-right', () => {
    const groove = createEmptyGroove();
    groove.measures[0].notes['hihat-closed'][0] = true;
    const { app, props } = renderGrid(groove);

    fireEvent.keyDown(app, { key: 'ArrowRight', metaKey: true });

    expect(props.onSetNotes).toHaveBeenCalledWith([
      { voice: 'hihat-closed', position: 1, measureIndex: 0, value: true },
    ]);
  });

  it('removes notes from the next cell with shift-right', () => {
    const groove = createEmptyGroove();
    groove.measures[0].notes['hihat-closed'][1] = true;
    const { app, props } = renderGrid(groove);

    fireEvent.keyDown(app, { key: 'ArrowRight', shiftKey: true });

    expect(props.onSetNotes).toHaveBeenCalledWith([
      { voice: 'hihat-closed', position: 1, measureIndex: 0, value: false },
    ]);
  });

  it('opens the variation menu with Tab and selects with arrows plus Enter', async () => {
    const { app, props } = renderGrid();

    fireEvent.keyDown(app, { key: 'Tab' });
    await screen.findByText('Hi-Hat - Select Sound');
    fireEvent.keyDown(app, { key: 'ArrowDown' });
    fireEvent.keyDown(app, { key: 'Enter' });

    expect(props.onSetNotes).toHaveBeenCalledWith([
      { voice: 'hihat-open', position: 0, measureIndex: 0, value: true },
    ]);
  });

  it('positions the keyboard variation menu as fixed viewport UI', async () => {
    const { app } = renderGrid();

    fireEvent.keyDown(app, { key: 'Tab' });
    const menuHeader = await screen.findByText('Hi-Hat - Select Sound');
    const menu = menuHeader.closest('[data-placement]');

    expect(menu?.className).toContain('fixed');
  });

  it('copies and pastes the current measure with ctrl-c and ctrl-v', () => {
    const { app, props } = renderGrid();

    fireEvent.keyDown(app, { key: 'c', ctrlKey: true });
    fireEvent.keyDown(app, { key: 'v', ctrlKey: true });

    expect(props.onMeasureCopy).toHaveBeenCalledWith(0);
    expect(props.onMeasurePaste).toHaveBeenCalledWith(0);
  });

  it('shows feedback when measure paste fails at the measure limit', async () => {
    const groove = createEmptyGroove();
    groove.measures = Array.from({ length: MAX_MEASURES }, () => ({
      notes: createEmptyNotesRecord(8),
    }));
    const onMeasurePaste = vi.fn().mockReturnValue(false);
    const { app } = renderGrid(groove, { onMeasurePaste });

    fireEvent.keyDown(app, { key: 'v', ctrlKey: true });

    expect((await screen.findByRole('status')).textContent).toContain('Measure limit reached');
  });

  it('clamps the keyboard cursor when division changes reduce measure length', async () => {
    const groove = createEmptyGroove();
    groove.division = 16;
    groove.measures[0].notes = createEmptyNotesRecord(16);
    const { app, props, renderResult } = renderGrid(groove);

    for (let i = 0; i < 12; i++) {
      fireEvent.keyDown(app, { key: 'ArrowRight' });
    }

    const shorterGroove = createEmptyGroove();
    shorterGroove.division = 8;
    shorterGroove.measures[0].notes = createEmptyNotesRecord(8);
    renderResult.rerender(<DrumGridDark {...props} groove={shorterGroove} />);

    await waitFor(() => {
      fireEvent.keyDown(app, { key: ' ' });
      expect(props.onSetNotes).toHaveBeenLastCalledWith([
        { voice: 'hihat-closed', position: 7, measureIndex: 0, value: true },
      ]);
    });
  });
});
