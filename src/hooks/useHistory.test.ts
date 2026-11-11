/** Tests for useHistory replace() (Undo keeps a groove loaded from a link) */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useHistory } from './useHistory';

describe('useHistory replace()', () => {
  it('does not undo to the state before replace()', () => {
    const { result } = renderHook(() => useHistory({ id: 'A' }));
    act(() => result.current.setState({ id: 'B' }));
    act(() => result.current.replace({ id: 'C' }));
    expect(result.current.state).toEqual({ id: 'C' });
    act(() => result.current.undo());
    expect(result.current.state).toEqual({ id: 'A' });
    expect(result.current.canUndo).toBe(false);
  });

  it('sets the state without an undo step on a fresh hook', () => {
    const { result } = renderHook(() => useHistory({ id: 'A' }));
    act(() => result.current.replace({ id: 'C' }));
    expect(result.current.state).toEqual({ id: 'C' });
    expect(result.current.canUndo).toBe(false);
    act(() => result.current.undo());
    expect(result.current.state).toEqual({ id: 'C' });
  });

  it('keeps the redo stack', () => {
    const { result } = renderHook(() => useHistory({ id: 'A' }));
    act(() => result.current.setState({ id: 'B' }));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.replace({ id: 'C' }));
    expect(result.current.canRedo).toBe(true);
  });
});
