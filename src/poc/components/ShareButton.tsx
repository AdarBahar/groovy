import { useState, useCallback } from 'react';

interface ShareButtonProps {
  onCopyURL: () => Promise<boolean>;
}

/**
 * Button to copy the shareable groove URL to clipboard
 */
export default function ShareButton({ onCopyURL }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    const success = await onCopyURL();
    if (success) {
      setCopied(true);
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  }, [onCopyURL]);

  return (
    <button
      className={`toggle-button ${copied ? 'active' : ''}`}
      onClick={handleClick}
      title="Copy shareable URL to clipboard"
    >
      {copied ? '✓ Copied!' : '🔗 Share'}
    </button>
  );
}

