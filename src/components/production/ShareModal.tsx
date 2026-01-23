/**
 * ShareModal Component
 *
 * Modal for sharing grooves via multiple channels:
 * - Link (copy to clipboard)
 * - Social media (Twitter/X, Facebook, Reddit)
 * - Embed code for websites
 * - QR Code for mobile
 * - Email
 */

import { useState, useMemo, useEffect } from 'react';
import { Share2, Link, Copy, Check, Code, QrCode, Mail, AlertTriangle, Loader2, Minimize2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { GrooveData } from '../../types';
import { getShareableURLWithValidation, URLValidationResult } from '../../core';
import { trackShareMethod } from '../../utils/analytics';
import { shortenURL, isShortenerConfigured, getShortenerErrorMessage } from '../../services/urlShortener';

type ShareTab = 'link' | 'social' | 'embed' | 'qr' | 'email';

interface ShareModalProps {
  groove: GrooveData;
  isOpen: boolean;
  onClose: () => void;
}

const TABS: { id: ShareTab; label: string; icon: React.ReactNode }[] = [
  { id: 'link', label: 'Link', icon: <Link className="w-4 h-4" /> },
  { id: 'social', label: 'Social', icon: <Share2 className="w-4 h-4" /> },
  { id: 'embed', label: 'Embed', icon: <Code className="w-4 h-4" /> },
  { id: 'qr', label: 'QR Code', icon: <QrCode className="w-4 h-4" /> },
  { id: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
];

export function ShareModal({ groove, isOpen, onClose }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<ShareTab>('link');
  const [copied, setCopied] = useState<'url' | 'embed' | 'shortUrl' | null>(null);

  // URL shortener state
  const [isShortening, setIsShortening] = useState(false);
  const [shortURL, setShortURL] = useState<string | null>(null);
  const [shortenError, setShortenError] = useState<string | null>(null);

  // Generate shareable URL with validation
  const { url: shareableURL, validation } = useMemo(
    () => getShareableURLWithValidation(groove),
    [groove]
  );

  const grooveTitle = groove.title || 'Drum Groove';

  // Reset short URL when groove changes
  useEffect(() => {
    setShortURL(null);
    setShortenError(null);
  }, [shareableURL]);

  // Handle URL shortening
  const handleShortenURL = async () => {
    setIsShortening(true);
    setShortenError(null);

    try {
      const shortened = await shortenURL(shareableURL);
      setShortURL(shortened);
      trackShareMethod('shorten');
    } catch (error) {
      setShortenError(getShortenerErrorMessage(error));
    } finally {
      setIsShortening(false);
    }
  };

  // Copy short URL to clipboard
  const handleCopyShortURL = async () => {
    if (!shortURL) return;
    await navigator.clipboard.writeText(shortURL);
    setCopied('shortUrl');
    trackShareMethod('link');
    setTimeout(() => setCopied(null), 2000);
  };

  // Generate embed code with embed=true parameter for minimal view
  const embedCode = useMemo(() => {
    const embedURL = `${shareableURL}&embed=true`;
    return `<iframe src="${embedURL}" width="600" height="400" frameborder="0" title="${grooveTitle}"></iframe>`;
  }, [shareableURL, grooveTitle]);

  const handleCopyURL = async () => {
    await navigator.clipboard.writeText(shareableURL);
    setCopied('url');
    trackShareMethod('link');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied('embed');
    trackShareMethod('embed');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'reddit') => {
    const text = `Check out this drum groove: ${grooveTitle}`;
    let url = '';

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareableURL)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableURL)}`;
        break;
      case 'reddit':
        url = `https://reddit.com/submit?url=${encodeURIComponent(shareableURL)}&title=${encodeURIComponent(grooveTitle)}`;
        break;
    }

    window.open(url, '_blank', 'width=600,height=400');
    trackShareMethod(platform);
  };

  const handleEmailShare = () => {
    const subject = `Check out this drum groove: ${grooveTitle}`;
    const body = `I created this drum groove using Groovy!\n\n${shareableURL}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    trackShareMethod('email');
  };

  const renderURLWarning = (validation: URLValidationResult) => {
    if (validation.status === 'ok') return null;

    // For error status (very long URLs), show stronger warning with shorten suggestion
    const showShortenSuggestion = validation.status === 'error' && isShortenerConfigured();
    const warningMessage = showShortenSuggestion
      ? 'This URL is longer than most browsers support. It is highly recommended to use the "Shorten URL" option below.'
      : validation.message;

    return (
      <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
        validation.status === 'error'
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
      }`}>
        <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
          validation.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
        }`} />
        <p className={validation.status === 'error' ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}>
          {warningMessage}
        </p>
      </div>
    );
  };

  const renderLinkTab = () => (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Copy the link below to share your groove with anyone.
      </p>

      {/* Short URL display (when available) */}
      {shortURL ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={shortURL}
              readOnly
              className="flex-1 font-mono text-xs bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button onClick={handleCopyShortURL} className="bg-purple-600 hover:bg-purple-700 text-white">
              {copied === 'shortUrl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShortURL(null)}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            <Minimize2 className="w-3 h-3 mr-1" />
            Show original URL
          </Button>
        </div>
      ) : (
        <>
          {/* Original URL */}
          <div className="flex gap-2">
            <Input
              value={shareableURL}
              readOnly
              className="flex-1 font-mono text-xs"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button onClick={handleCopyURL} className="bg-purple-600 hover:bg-purple-700 text-white">
              {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* URL Warning */}
          {renderURLWarning(validation)}

          {/* Shorten button (always available when shortener is configured) */}
          {isShortenerConfigured() && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShortenURL}
                disabled={isShortening}
                className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
              >
                {isShortening ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Shortening...
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-3 h-3 mr-1.5" />
                    Shorten URL
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Shorten error */}
          {shortenError && (
            <div className="flex items-start gap-2 p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200">{shortenError}</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderSocialTab = () => (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Share your groove on social media.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <Button variant="outline" onClick={() => handleSocialShare('twitter')} className="flex flex-col items-center gap-2 h-auto py-4">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          <span className="text-xs">X / Twitter</span>
        </Button>
        <Button variant="outline" onClick={() => handleSocialShare('facebook')} className="flex flex-col items-center gap-2 h-auto py-4">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          <span className="text-xs">Facebook</span>
        </Button>
        <Button variant="outline" onClick={() => handleSocialShare('reddit')} className="flex flex-col items-center gap-2 h-auto py-4">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
          <span className="text-xs">Reddit</span>
        </Button>
      </div>
    </div>
  );

  const renderEmbedTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Embed this groove on your website or blog.
        </p>
        <Button
          size="sm"
          onClick={handleCopyEmbed}
          className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
        >
          {copied === 'embed' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
          {copied === 'embed' ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <textarea
        value={embedCode}
        readOnly
        rows={5}
        className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg resize-none"
        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
      />
    </div>
  );

  // QR codes have a maximum capacity (~2953 bytes for alphanumeric at level L)
  // URLs over ~2000 chars will likely fail
  const MAX_QR_URL_LENGTH = 2000;
  const isURLTooLongForQR = shareableURL.length > MAX_QR_URL_LENGTH;

  const renderQRTab = () => (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Scan this QR code to open the groove on any device.
      </p>
      {isURLTooLongForQR ? (
        <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
          <div className="text-center">
            <p className="font-medium text-slate-700 dark:text-slate-300">URL too long for QR code</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              This groove has too much data ({shareableURL.length.toLocaleString()} characters).
              {isShortenerConfigured() && (
                <> Use the <button onClick={() => setActiveTab('link')} className="text-purple-600 dark:text-purple-400 underline">Link tab</button> to shorten it first.</>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center p-6 bg-white rounded-lg border border-slate-200 dark:border-slate-700">
          <QRCodeSVG
            value={shareableURL}
            size={200}
            level="M"
            includeMargin
            className="rounded"
          />
        </div>
      )}
      <p className="text-xs text-center text-slate-500 dark:text-slate-400">
        {grooveTitle}
      </p>
    </div>
  );

  const renderEmailTab = () => (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Send this groove via email.
      </p>
      <Button onClick={handleEmailShare} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
        <Mail className="w-4 h-4 mr-2" />
        Open Email Client
      </Button>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'link': return renderLinkTab();
      case 'social': return renderSocialTab();
      case 'embed': return renderEmbedTab();
      case 'qr': return renderQRTab();
      case 'email': return renderEmailTab();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Groove
          </DialogTitle>
          <DialogDescription>
            Share your drum pattern with others.
          </DialogDescription>
        </DialogHeader>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 -mx-4 sm:-mx-6 px-4 sm:px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1 px-2 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex-1 min-w-0 ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline text-xs">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="py-4 min-h-[200px]">
          {renderTabContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

