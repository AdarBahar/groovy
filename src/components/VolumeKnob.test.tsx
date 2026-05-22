import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, fireEvent } from '@testing-library/react';
import VolumeKnob from './VolumeKnob';

describe('VolumeKnob - Document Listener Cleanup', () => {
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const getSlider = (container: HTMLElement): HTMLElement | null => {
    return container.querySelector('#slider');
  };

  const countListenerAdds = (eventType: string): number => {
    return addEventListenerSpy.mock.calls.filter(([type]: [string]) => type === eventType).length;
  };

  const countListenerRemoves = (eventType: string): number => {
    return removeEventListenerSpy.mock.calls.filter(([type]: [string]) => type === eventType).length;
  };

  it('attaches four document listeners on drag start', () => {
    const { container } = render(<VolumeKnob volume={0.5} onVolumeChange={vi.fn()} />);

    const slider = getSlider(container);
    expect(slider).toBeTruthy();

    // No listeners before drag
    expect(countListenerAdds('mousemove')).toBe(0);
    expect(countListenerAdds('mouseup')).toBe(0);
    expect(countListenerAdds('touchmove')).toBe(0);
    expect(countListenerAdds('touchend')).toBe(0);

    // Trigger drag start
    act(() => {
      fireEvent.mouseDown(slider!);
    });

    // Verify four listeners were added
    expect(countListenerAdds('mousemove')).toBe(1);
    expect(countListenerAdds('mouseup')).toBe(1);
    expect(countListenerAdds('touchmove')).toBe(1);
    expect(countListenerAdds('touchend')).toBe(1);
  });

  it('removes all four document listeners when drag ends', () => {
    const { container } = render(<VolumeKnob volume={0.5} onVolumeChange={vi.fn()} />);

    const slider = getSlider(container);
    expect(slider).toBeTruthy();

    // Trigger drag start
    act(() => {
      fireEvent.mouseDown(slider!);
    });

    const addsBeforeEnd = countListenerAdds('mousemove');

    // Trigger drag end
    act(() => {
      fireEvent.mouseUp(document);
    });

    // Verify no additional listeners were added
    expect(countListenerAdds('mousemove')).toBe(addsBeforeEnd);

    // Verify four listeners were removed
    expect(countListenerRemoves('mousemove')).toBe(1);
    expect(countListenerRemoves('mouseup')).toBe(1);
    expect(countListenerRemoves('touchmove')).toBe(1);
    expect(countListenerRemoves('touchend')).toBe(1);
  });

  it('no listener accumulation across repeated drag cycles', () => {
    const { container } = render(<VolumeKnob volume={0.5} onVolumeChange={vi.fn()} />);

    const slider = getSlider(container);
    expect(slider).toBeTruthy();

    // Perform 5 drag cycles
    for (let i = 0; i < 5; i++) {
      act(() => {
        fireEvent.mouseDown(slider!);
      });

      act(() => {
        fireEvent.mouseUp(document);
      });
    }

    // Verify balanced adds and removes for each event type
    expect(countListenerAdds('mousemove')).toBe(5);
    expect(countListenerRemoves('mousemove')).toBe(5);

    expect(countListenerAdds('mouseup')).toBe(5);
    expect(countListenerRemoves('mouseup')).toBe(5);

    expect(countListenerAdds('touchmove')).toBe(5);
    expect(countListenerRemoves('touchmove')).toBe(5);

    expect(countListenerAdds('touchend')).toBe(5);
    expect(countListenerRemoves('touchend')).toBe(5);
  });

  it('cleans up on unmount mid-drag', () => {
    const { container, unmount } = render(<VolumeKnob volume={0.5} onVolumeChange={vi.fn()} />);

    const slider = getSlider(container);
    expect(slider).toBeTruthy();

    // Trigger drag start
    act(() => {
      fireEvent.mouseDown(slider!);
    });

    const addsBeforeUnmount = {
      mousemove: countListenerAdds('mousemove'),
      mouseup: countListenerAdds('mouseup'),
      touchmove: countListenerAdds('touchmove'),
      touchend: countListenerAdds('touchend'),
    };

    // Unmount while dragging
    act(() => {
      unmount();
    });

    // Verify cleanup removed all four listeners
    expect(countListenerRemoves('mousemove')).toBe(addsBeforeUnmount.mousemove);
    expect(countListenerRemoves('mouseup')).toBe(addsBeforeUnmount.mouseup);
    expect(countListenerRemoves('touchmove')).toBe(addsBeforeUnmount.touchmove);
    expect(countListenerRemoves('touchend')).toBe(addsBeforeUnmount.touchend);
  });
});
