/** Tests for Header metronome option semantics and About dialog focus */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

describe('Header About dialog', () => {
  it('returns keyboard focus to the About button when the dialog closes', async () => {
    render(
      <MemoryRouter>
        <Header metronome="off" onMetronomeChange={vi.fn()} />
      </MemoryRouter>,
    );
    const aboutButton = screen.getByRole('button', { name: 'About' });
    aboutButton.focus();
    fireEvent.click(aboutButton);
    const dialog = await screen.findByRole('dialog', { name: 'About Groovy' });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(aboutButton);
  });
});
