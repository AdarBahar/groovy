/** Tests for Sidebar accessible names and Escape handling */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';

const baseProps = {
  isNotesOnly: false,
  onToggleNotesOnly: vi.fn(),
  timeSignature: { beats: 4, noteValue: 4 as const },
  onTimeSignatureClick: vi.fn(),
  division: 16 as const,
  onDivisionChange: vi.fn(),
  canUndo: true,
  canRedo: true,
  onUndo: vi.fn(),
  onRedo: vi.fn(),
};

describe('Sidebar', () => {
  it('names the icon-only undo, redo and close buttons', () => {
    render(<Sidebar {...baseProps} isOpen onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close sidebar' })).toBeTruthy();
  });

  it('calls onClose once when Escape is pressed while open', () => {
    const onClose = vi.fn();
    render(<Sidebar {...baseProps} isOpen onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape while closed', () => {
    const onClose = vi.fn();
    render(<Sidebar {...baseProps} isOpen={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('hides the closed drawer only below the md breakpoint', () => {
    const { container } = render(<Sidebar {...baseProps} isOpen={false} onClose={vi.fn()} />);
    const drawer = container.querySelector('.fixed.inset-y-0') as HTMLElement;
    expect(drawer.className).toContain('max-md:invisible');
    expect(drawer.className).not.toMatch(/(^|\s)invisible/);
  });
});
