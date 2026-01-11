/**
 * PrintPreviewModal Component
 *
 * Displays a print preview of the sheet music notation.
 * Allows the user to see exactly what will be printed before committing.
 * Only the sheet music notation is printed, not the entire UI.
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Printer, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { GrooveData } from '../../types';
import { grooveToABC, renderABC, getShareableURL } from '../../core';
import './PrintPreviewModal.css';

interface PrintPreviewModalProps {
  groove: GrooveData;
  isOpen: boolean;
  onClose: () => void;
  onAddTitle?: () => void;
}

export function PrintPreviewModal({ groove, isOpen, onClose, onAddTitle }: PrintPreviewModalProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);
  const sheetMusicRef = useRef<HTMLDivElement>(null);

  // Check if groove has no title
  const isUntitled = !groove.title || groove.title.trim() === '';

  // Generate shareable URL
  const shareableURL = useMemo(() => getShareableURL(groove), [groove]);

  // Function to render the sheet music
  const renderSheetMusic = useCallback(() => {
    if (!sheetMusicRef.current) return;

    // Generate ABC notation
    const abc = grooveToABC(groove, { title: groove.title });

    // Render at optimal width for printing (wider than screen display)
    // Use black foreground color for print-friendly output
    renderABC(abc, sheetMusicRef.current, {
      staffWidth: 700,
      scale: 1.0,
      responsive: false, // Fixed size for consistent print output
      padding: 10,
      foregroundColor: '#000000', // Black notes for printing
    });
  }, [groove]);

  // Render the sheet music when modal opens (with delay to ensure DOM is ready)
  useEffect(() => {
    if (!isOpen) return;

    // Use requestAnimationFrame to ensure DOM is painted
    const frameId = requestAnimationFrame(() => {
      // Add small timeout to ensure Dialog content is fully rendered
      const timeoutId = setTimeout(renderSheetMusic, 50);
      return () => clearTimeout(timeoutId);
    });

    return () => cancelAnimationFrame(frameId);
  }, [isOpen, renderSheetMusic]);

  const handlePrint = () => {
    if (!sheetMusicRef.current) return;

    // Get the sheet music SVG
    const svgElement = sheetMusicRef.current.querySelector('svg');
    const svgContent = svgElement ? svgElement.outerHTML : '';

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return;
    }

    // Build print document
    const printDocument = `
<!DOCTYPE html>
<html>
<head>
  <title>${groove.title || 'Groove'} - Groovy</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 10mm;
      background: white;
      color: #000;
    }
    .print-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .print-title {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .print-meta {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: #64748b;
    }
    .sheet-music {
      display: flex;
      justify-content: center;
      padding: 16px 0;
    }
    .sheet-music svg {
      max-width: 100%;
      height: auto;
    }
    .print-footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .footer-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .qr-code svg {
      width: 64px;
      height: 64px;
    }
    .url-text {
      font-size: 10px;
      color: #64748b;
      max-width: 400px;
      word-break: break-all;
    }
    .footer-right {
      font-size: 12px;
      color: #94a3b8;
    }
    @page { margin: 10mm; }
  </style>
</head>
<body>
  <div class="print-header">
    <div class="print-title">${groove.title || 'Untitled Groove'}</div>
    <div class="print-meta">
      <span><strong>Tempo:</strong> ${groove.tempo} BPM</span>
      <span><strong>Time:</strong> ${groove.timeSignature.beats}/${groove.timeSignature.noteValue}</span>
      <span><strong>Measures:</strong> ${groove.measures.length}</span>
      ${groove.author ? `<span><strong>Author:</strong> ${groove.author}</span>` : ''}
    </div>
  </div>
  <div class="sheet-music">
    ${svgContent}
  </div>
  <div class="print-footer">
    <div class="footer-left">
      <div class="qr-code" id="qr-placeholder"></div>
      <div class="url-text">${shareableURL}</div>
    </div>
    <div class="footer-right">Created with Groovy</div>
  </div>
</body>
</html>
    `;

    iframeDoc.open();
    iframeDoc.write(printDocument);
    iframeDoc.close();

    // Generate QR code in iframe
    const qrPlaceholder = iframeDoc.getElementById('qr-placeholder');
    if (qrPlaceholder) {
      // Create a simple QR code using the same library's SVG output
      const qrContainer = document.createElement('div');
      qrContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"></svg>`;

      // Copy the QR code from our preview
      const qrSvg = printContainerRef.current?.querySelector('.flex.items-center.gap-4 svg');
      if (qrSvg) {
        qrPlaceholder.innerHTML = qrSvg.outerHTML;
      }
    }

    // Wait for content to load, then print
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        // Remove iframe after print dialog closes
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 100);
    };

    // Trigger load for browsers that don't fire onload for about:blank iframes
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 200);
  };

  const handleAddTitle = () => {
    onClose();
    // Small delay to let modal close, then focus title input
    setTimeout(() => {
      onAddTitle?.();
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col print-preview-modal"
        aria-describedby={undefined}
      >
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Print Preview
          </DialogTitle>
        </DialogHeader>

        {/* Untitled groove warning */}
        {isUntitled && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg print:hidden">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="text-sm text-amber-800 dark:text-amber-200">
              Would you like to add a title to your groove?
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTitle}
              className="ml-auto text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/30"
            >
              Add Title
            </Button>
          </div>
        )}

        {/* Print preview container - this is what gets printed */}
        <div
          ref={printContainerRef}
          className="flex-1 overflow-auto bg-white rounded-lg border border-slate-200 dark:border-slate-700 print:border-0 print:overflow-visible print-content"
        >
          <div className="p-6 print:p-0">
            {/* Header - what will be printed */}
            <div className="mb-4 pb-3 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {groove.title || 'Untitled Groove'}
              </h2>
              <div className="flex gap-6 mt-2 text-sm text-slate-600">
                <span><strong>Tempo:</strong> {groove.tempo} BPM</span>
                <span><strong>Time:</strong> {groove.timeSignature.beats}/{groove.timeSignature.noteValue}</span>
                <span><strong>Measures:</strong> {groove.measures.length}</span>
                {groove.author && <span><strong>Author:</strong> {groove.author}</span>}
              </div>
            </div>

            {/* Sheet music notation */}
            <div
              ref={sheetMusicRef}
              className="flex justify-center py-4"
            />

            {/* Footer with QR code and URL */}
            <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <QRCodeSVG
                  value={shareableURL}
                  size={64}
                  level="M"
                  className="flex-shrink-0"
                />
                <div className="text-xs text-slate-500 max-w-md break-all">
                  {shareableURL}
                </div>
              </div>
              <div className="text-xs text-slate-400 text-right">
                Created with Groovy
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons - hidden when printing */}
        <div className="flex justify-end gap-3 pt-4 print:hidden">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

