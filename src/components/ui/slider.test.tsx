/** Tests for Slider thumb accessibility props and focus ring class */
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { Slider } from './slider';

beforeAll(() => {
  // Radix slider needs ResizeObserver, which jsdom lacks
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof ResizeObserver;
  }
});

describe('Slider', () => {
  it('gives the thumb an accessible name from thumbAriaLabel', () => {
    render(<Slider value={[120]} min={40} max={240} thumbAriaLabel="Tempo (BPM)" />);
    expect(screen.getByRole('slider', { name: 'Tempo (BPM)' })).toBeTruthy();
  });

  it('sets aria-valuetext from thumbAriaValueText', () => {
    render(<Slider value={[50]} thumbAriaLabel="Swing" thumbAriaValueText="50% Straight" />);
    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('50% Straight');
  });

  it('still renders one opaque-ring thumb without the new props', () => {
    render(<Slider value={[10]} />);
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs).toHaveLength(1);
    expect(thumbs[0].className).toContain('ring-ring');
    expect(thumbs[0].className).not.toContain('ring-ring/50');
  });
});
