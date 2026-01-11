import { useState, useCallback } from 'react';
import { URLValidationResult } from '../core/GrooveURLCodec';

interface ShareButtonProps {
  onCopyURL: () => Promise<{ success: boolean; validation: URLValidationResult } | boolean>;
}

/**
 * Button to copy the shareable groove URL to clipboard
 * Shows warnings if URL is too long
 */
export default function ShareButton({ onCopyURL }: ShareButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'warning' | 'error'>('idle');
  const [message, setMessage] = useState<string | undefined>();

  const handleClick = useCallback(async () => {
    const result = await onCopyURL();

    // Handle both old (boolean) and new ({ success, validation }) return types
    const success = typeof result === 'boolean' ? result : result.success;
    const validation = typeof result === 'boolean' ? undefined : result.validation;

    if (success) {
      if (validation?.status === 'warning') {
        setStatus('warning');
        setMessage(validation.message);
        // Show warning for 4 seconds
        setTimeout(() => {
          setStatus('idle');
          setMessage(undefined);
        }, 4000);
      } else if (validation?.status === 'error') {
        setStatus('error');
        setMessage(validation.message);
        setTimeout(() => {
          setStatus('idle');
          setMessage(undefined);
        }, 4000);
      } else {
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 2000);
      }
    }
  }, [onCopyURL]);

  const getButtonText = () => {
    switch (status) {
      case 'copied':
        return '✓ Copied!';
      case 'warning':
        return '⚠️ Copied (Long URL)';
      case 'error':
        return '❌ URL Too Long';
      default:
        return '🔗 Share';
    }
  };

  const getButtonClass = () => {
    const base = 'toggle-button';
    switch (status) {
      case 'copied':
        return `${base} active`;
      case 'warning':
        return `${base} warning`;
      case 'error':
        return `${base} error`;
      default:
        return base;
    }
  };

  return (
    <button
      className={getButtonClass()}
      onClick={handleClick}
      title={message || 'Copy shareable URL to clipboard'}
    >
      {getButtonText()}
    </button>
  );
}

