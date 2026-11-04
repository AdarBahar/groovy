/** Tests for Header metronome option semantics */
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: true, toggleTheme: vi.fn() }),
}));

describe('Header metronome options', () => {
  it('marks only the selected option as pressed inside a named group', () => {
    render(
      <MemoryRouter>
        <Header metronome="8th" onMetronomeChange={vi.fn()} />
      </MemoryRouter>,
    );
    const group = screen.getByRole('group', { name: 'Metronome' });
    const buttons = within(group).getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(1);
    const pressed = buttons.filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
    expect(pressed[0].textContent?.toLowerCase()).toBe('8th');
    expect(pressed[0].className).toContain('underline');
    for (const b of buttons) {
      expect(b.hasAttribute('aria-pressed')).toBe(true);
    }
  });
});
