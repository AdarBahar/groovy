import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ShareModal } from './ShareModal';
import { DEFAULT_GROOVE } from '../../types';

describe('ShareModal', () => {
  describe('embed snippet title escaping (#114)', () => {
    it('escapes special characters in the groove title within the embed iframe attribute', () => {
      const maliciousTitle = '"><script>alert(1)</script>';
      const groove = { ...DEFAULT_GROOVE, title: maliciousTitle };

      render(<ShareModal groove={groove} isOpen onClose={vi.fn()} />);

      // Navigate to the Embed tab (the span inside the tab button, not the mode toggle button)
      const embedTabSpan = screen.getAllByText('Embed').find(
        (el) => el.tagName === 'SPAN'
      )!;
      fireEvent.click(embedTabSpan);

      const embedTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      const embedCode = embedTextarea.value;

      // Raw script tag must NOT appear in the attribute
      expect(embedCode).not.toContain('<script>');
      // HTML entities must be present
      expect(embedCode).toContain('&quot;');
      expect(embedCode).toContain('&lt;');
      expect(embedCode).toContain('&gt;');
    });

    it('preserves plain titles without modification in the embed snippet', () => {
      const plainTitle = 'My Cool Groove';
      const groove = { ...DEFAULT_GROOVE, title: plainTitle };

      render(<ShareModal groove={groove} isOpen onClose={vi.fn()} />);

      const embedTabSpan = screen.getAllByText('Embed').find(
        (el) => el.tagName === 'SPAN'
      )!;
      fireEvent.click(embedTabSpan);

      const embedTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      const embedCode = embedTextarea.value;

      expect(embedCode).toContain(`title="${plainTitle}"`);
    });
  });

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
