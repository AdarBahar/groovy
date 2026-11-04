/** Tests for AboutModal dialog semantics */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AboutModal } from './AboutModal';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

describe('AboutModal', () => {
  it('renders a named dialog when open', () => {
    render(<AboutModal isOpen onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'About Groovy' });
    expect(dialog).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    render(<AboutModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<AboutModal isOpen onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
