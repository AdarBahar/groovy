/** Tests for MetronomeOptionsMenu toggle state, Escape handling, and color tokens */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MetronomeOptionsMenu } from './MetronomeOptionsMenu';
import { MetronomeConfig } from '../../types';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: true, toggleTheme: vi.fn() }),
}));

const config: MetronomeConfig = {
  frequency: 8,
  solo: false,
  countIn: false,
  offsetClick: '1',
  volume: 80,
};

function renderMenu(onClose: () => void, returnFocusRef?: React.RefObject<HTMLElement | null>) {
  return render(
    <MetronomeOptionsMenu
      isOpen
      onClose={onClose}
      config={config}
      onFrequencyChange={vi.fn()}
      onSoloChange={vi.fn()}
      onCountInChange={vi.fn()}
      onVolumeChange={vi.fn()}
      onOffsetClickChange={vi.fn()}
      returnFocusRef={returnFocusRef}
    />,
  );
}

afterEach(() => {
  document.querySelectorAll('[data-test-dialog]').forEach((el) => el.remove());
});

describe('MetronomeOptionsMenu', () => {
  it('marks only the selected frequency button as pressed', () => {
    renderMenu(vi.fn());
    const group = screen.getByRole('group', { name: 'Metronome' });
    const buttons = within(group).getAllByRole('button');
    expect(buttons).toHaveLength(4);
    for (const b of buttons) expect(b.hasAttribute('aria-pressed')).toBe(true);
    const pressed = buttons.filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
    expect(pressed[0].textContent).toBe('8th');
  });

  it('closes on Escape and moves focus to the return target', () => {
    const onClose = vi.fn();
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    renderMenu(onClose, { current: trigger });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('does not close on Escape when an open dialog exists', () => {
    const onClose = vi.fn();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('data-state', 'open');
    dialog.setAttribute('data-test-dialog', '');
    document.body.appendChild(dialog);
    renderMenu(onClose);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close on Escape when the event is already handled', () => {
    const onClose = vi.fn();
    renderMenu(onClose);
    const capture = (e: Event) => e.preventDefault();
    window.addEventListener('keydown', capture, true);
    fireEvent.keyDown(window, { key: 'Escape', cancelable: true });
    window.removeEventListener('keydown', capture, true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('has no hard-coded hex colors', () => {
    const { container } = renderMenu(vi.fn());
    const html = container.innerHTML.toLowerCase();
    for (const hex of ['#2c2c2f', '#e6e6e8', '#19191b']) {
      expect(html).not.toContain(hex);
    }
  });
});
