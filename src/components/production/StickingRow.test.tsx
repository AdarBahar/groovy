import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StickingRow from './StickingRow';

describe('StickingRow', () => {
  it('paints the source sticking value while ctrl-dragging across cells', () => {
    const onStickingChange = vi.fn();

    render(
      <StickingRow
        stickingValues={['R', null, 'L']}
        onStickingChange={onStickingChange}
        isActive
        measureIndex={0}
      />
    );

    const firstCell = screen.getByRole('button', { name: /beat 1 sticking: right/i });
    const secondCell = screen.getByRole('button', { name: /beat 2 sticking: empty/i });
    const thirdCell = screen.getByRole('button', { name: /beat 3 sticking: left/i });

    fireEvent.mouseDown(firstCell, { ctrlKey: true });
    fireEvent.mouseEnter(secondCell);
    fireEvent.mouseEnter(thirdCell);
    fireEvent.mouseUp(document);

    expect(onStickingChange).toHaveBeenCalledTimes(2);
    expect(onStickingChange).toHaveBeenNthCalledWith(1, 1, 'R');
    expect(onStickingChange).toHaveBeenNthCalledWith(2, 2, 'R');
  });

  it('clears sticking values while shift-dragging across cells', () => {
    const onStickingChange = vi.fn();

    render(
      <StickingRow
        stickingValues={['R', 'L', 'L/R']}
        onStickingChange={onStickingChange}
        isActive
        measureIndex={0}
      />
    );

    const firstCell = screen.getByRole('button', { name: /beat 1 sticking: right/i });
    const secondCell = screen.getByRole('button', { name: /beat 2 sticking: left/i });
    const thirdCell = screen.getByRole('button', { name: /beat 3 sticking: both hands/i });

    fireEvent.mouseDown(thirdCell, { shiftKey: true });
    fireEvent.mouseEnter(secondCell);
    fireEvent.mouseEnter(firstCell);
    fireEvent.mouseUp(document);

    expect(onStickingChange).toHaveBeenCalledTimes(3);
    expect(onStickingChange).toHaveBeenNthCalledWith(1, 2, null);
    expect(onStickingChange).toHaveBeenNthCalledWith(2, 1, null);
    expect(onStickingChange).toHaveBeenNthCalledWith(3, 0, null);
  });

  it('does not cycle a sticking value after a modifier drag starts', () => {
    const onStickingChange = vi.fn();

    render(
      <StickingRow
        stickingValues={['R']}
        onStickingChange={onStickingChange}
        isActive
        measureIndex={0}
      />
    );

    const cell = screen.getByRole('button', { name: /beat 1 sticking: right/i });

    fireEvent.mouseDown(cell, { ctrlKey: true });
    fireEvent.click(cell);

    expect(onStickingChange).not.toHaveBeenCalled();
  });

  it('prevents the browser context menu on ctrl-click', () => {
    const onStickingChange = vi.fn();

    render(
      <StickingRow
        stickingValues={['R']}
        onStickingChange={onStickingChange}
        isActive
        measureIndex={0}
      />
    );

    const cell = screen.getByRole('button', { name: /beat 1 sticking: right/i });
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });

    cell.dispatchEvent(contextMenuEvent);

    expect(contextMenuEvent.defaultPrevented).toBe(true);
  });
});
