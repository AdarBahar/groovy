/** Tests for ShareModal */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareModal } from './ShareModal';
import { DEFAULT_GROOVE } from '../../types';

// Mock the URL shortener service so tests control shortening behaviour
vi.mock('../../services/urlShortener', () => ({
  isShortenerConfigured: vi.fn(() => false),
  shortenURL: vi.fn(() => Promise.resolve('')),
  getShortenerErrorMessage: vi.fn(() => 'Failed to shorten URL'),
}));

// Import after mocking so vi.mocked() resolves the mock references
import { isShortenerConfigured, shortenURL } from '../../services/urlShortener';

describe('ShareModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: shortener NOT configured — existing tests are unaffected
    vi.mocked(isShortenerConfigured).mockReturnValue(false);
  });

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

    // Link tab defaults to 'editor' mode now, so toggle to Embed mode first so the
    // URL contains embed=true — making the test's intent explicit.
    const embedToggleButton = screen.getAllByText('Embed').find(
      (el) => el.tagName === 'BUTTON'
    )!;
    fireEvent.click(embedToggleButton);

    const shareURLInput = screen.getByDisplayValue((value) => value.includes('embed=true'));
    const copyButton = shareURLInput.closest('div')?.querySelector('button');

    expect(copyButton).toBeTruthy();
    fireEvent.click(copyButton!);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(shareURLInput.getAttribute('value')));
  });

  describe('QR tab auto-shorten', () => {
    /** Helper: click the QR Code tab (finds the hidden SPAN label, like the embed tests) */
    const clickQRTab = () => {
      const qrTabSpan = screen.getAllByText('QR Code').find(
        (el) => el.tagName === 'SPAN'
      )!;
      fireEvent.click(qrTabSpan);
    };

    it('calls shortenURL with the long URL when the shortener is configured and QR tab activates', async () => {
      const shortUrl = 'https://go.bahar.co.il/abc';
      vi.mocked(isShortenerConfigured).mockReturnValue(true);
      vi.mocked(shortenURL).mockResolvedValue(shortUrl);

      render(<ShareModal groove={DEFAULT_GROOVE} isOpen onClose={vi.fn()} />);

      // Activate QR tab
      clickQRTab();

      // shortenURL must be called exactly once with a non-empty editor-mode URL
      // (QR tab defaults to 'editor', so the URL will NOT contain embed=true)
      await waitFor(() => expect(shortenURL).toHaveBeenCalledTimes(1));
      const shortenedArg = vi.mocked(shortenURL).mock.calls[0][0];
      expect(shortenedArg.length).toBeGreaterThan(0);
      expect(shortenedArg).not.toContain('embed=true');

      // Wait for spinner to disappear (loading done)
      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).toBeNull();
      });
    });

    it('does not call shortenURL when the shortener is not configured', async () => {
      vi.mocked(isShortenerConfigured).mockReturnValue(false);

      render(<ShareModal groove={DEFAULT_GROOVE} isOpen onClose={vi.fn()} />);
      clickQRTab();

      // Wait a tick to ensure any async effects have run
      await new Promise((r) => setTimeout(r, 20));

      expect(shortenURL).not.toHaveBeenCalled();
    });

    it('does not call shortenURL before the QR tab is activated', async () => {
      vi.mocked(isShortenerConfigured).mockReturnValue(true);
      vi.mocked(shortenURL).mockResolvedValue('https://go.bahar.co.il/abc');

      // Render with default 'link' tab active (no QR tab clicked)
      render(<ShareModal groove={DEFAULT_GROOVE} isOpen onClose={vi.fn()} />);

      // Wait a tick to ensure any spurious effects have fired
      await new Promise((r) => setTimeout(r, 20));

      expect(shortenURL).not.toHaveBeenCalled();
    });

    it('falls back gracefully when shortenURL rejects — spinner disappears and no crash', async () => {
      vi.mocked(isShortenerConfigured).mockReturnValue(true);
      vi.mocked(shortenURL).mockRejectedValue(new Error('network error'));

      render(<ShareModal groove={DEFAULT_GROOVE} isOpen onClose={vi.fn()} />);
      clickQRTab();

      // Spinner should appear briefly while shortening
      // then disappear once the rejection is handled
      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).toBeNull();
      });

      // shortenURL was attempted
      expect(shortenURL).toHaveBeenCalledTimes(1);

      // Component did not crash — the QR tab area is still visible
      expect(screen.getByText('Scan this QR code to open the groove on any device.')).toBeTruthy();
    });
  });

  describe('per-tab urlMode default', () => {
    /** Click the Embed tab (hidden SPAN label inside the tab button) */
    const clickEmbedTab = () => {
      const embedTabSpan = screen.getAllByText('Embed').find(
        (el) => el.tagName === 'SPAN'
      )!;
      fireEvent.click(embedTabSpan);
    };

    /** Click the Link tab (hidden SPAN label inside the tab button) */
    const clickLinkTab = () => {
      const linkTabSpan = screen.getAllByText('Link').find(
        (el) => el.tagName === 'SPAN'
      )!;
      fireEvent.click(linkTabSpan);
    };

    it('defaults to Editor on the initial Link tab', () => {
      render(<ShareModal groove={DEFAULT_GROOVE} isOpen onClose={vi.fn()} />);
      expect(screen.getByText('Editor view (allows editing)')).toBeTruthy();
    });

    it('defaults to Embed when the Embed tab is active', () => {
      render(<ShareModal groove={DEFAULT_GROOVE} isOpen onClose={vi.fn()} />);
      clickEmbedTab();
      expect(screen.getByText('Embed view (optimized for viewing)')).toBeTruthy();
    });

    it('resets to Editor when switching from Embed tab back to Link tab', () => {
      render(<ShareModal groove={DEFAULT_GROOVE} isOpen onClose={vi.fn()} />);
      // Go to Embed tab → mode becomes embed
      clickEmbedTab();
      expect(screen.getByText('Embed view (optimized for viewing)')).toBeTruthy();
      // Go back to Link tab → mode resets to editor
      clickLinkTab();
      expect(screen.getByText('Editor view (allows editing)')).toBeTruthy();
    });

    it('manual toggle still overrides within a tab', () => {
      render(<ShareModal groove={DEFAULT_GROOVE} isOpen onClose={vi.fn()} />);
      // Link tab starts in editor mode
      expect(screen.getByText('Editor view (allows editing)')).toBeTruthy();
      // Click the "Embed" toggle BUTTON (not the tab span)
      const embedToggleButton = screen.getAllByText('Embed').find(
        (el) => el.tagName === 'BUTTON'
      )!;
      fireEvent.click(embedToggleButton);
      // Manual override within the tab: mode is now embed
      expect(screen.getByText('Embed view (optimized for viewing)')).toBeTruthy();
    });
  });
});
