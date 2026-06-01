import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DrumGridDark } from './DrumGridDark';
import { createEmptyNotesRecord, GrooveData } from '../../types';

function createEmptyGroove(): GrooveData {
  return {
    timeSignature: { beats: 4, noteValue: 4 },
    division: 8,
    tempo: 120,
    swing: 0,
    measures: [{ notes: createEmptyNotesRecord(8) }],
  };
}

function renderGrid(groove = createEmptyGroove()) {
  const props = {
    groove,
    onNoteToggle: vi.fn(),
    onSetNotes: vi.fn(),
    onPreview: vi.fn(),
    onMeasureCopy: vi.fn(),
    onMeasurePaste: vi.fn().mockReturnValue(true),
  };

  render(<DrumGridDark {...props} />);

  return {
    app: screen.getByRole('application', { name: /keyboard editor/i }),
    props,
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

  it('copies and pastes the current measure with ctrl-c and ctrl-v', () => {
    const { app, props } = renderGrid();

    fireEvent.keyDown(app, { key: 'c', ctrlKey: true });
    fireEvent.keyDown(app, { key: 'v', ctrlKey: true });

    expect(props.onMeasureCopy).toHaveBeenCalledWith(0);
    expect(props.onMeasurePaste).toHaveBeenCalledWith(0);
  });
});
