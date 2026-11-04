/** Tests for DownloadModal error copy */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DownloadModal } from './DownloadModal';
import { DEFAULT_GROOVE } from '../../types';

vi.mock('../../core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core')>();
  return {
    ...actual,
    downloadAsJSON: vi.fn(() => {
      throw new Error('raw internal message');
    }),
    isFormatSupported: vi.fn(() => true),
  };
});

describe('DownloadModal', () => {
  it('shows fixed user copy and hides the raw error message', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<DownloadModal groove={DEFAULT_GROOVE} isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /^Download \./ }));

    expect(
      await screen.findByText('Could not create the file. Try again, or choose a different format.'),
    ).toBeTruthy();
    expect(screen.queryByText(/raw internal message/)).toBeNull();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
