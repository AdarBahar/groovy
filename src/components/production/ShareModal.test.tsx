import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ShareModal } from './ShareModal';
import { DEFAULT_GROOVE } from '../../types';

describe('ShareModal', () => {
  it('copies the displayed share URL instead of a hard-coded embed suffix', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <ShareModal
        groove={DEFAULT_GROOVE}
        isOpen
        onClose={vi.fn()}
      />
    );

    const shareURLInput = screen.getByDisplayValue((value) => value.includes('embed=true'));
    const copyButton = shareURLInput.closest('div')?.querySelector('button');

    expect(copyButton).toBeTruthy();
    fireEvent.click(copyButton!);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(shareURLInput.getAttribute('value')));
  });
});
