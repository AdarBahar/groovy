import { useState, useCallback } from 'react';
import { Download, Printer, Share2, Save, Check, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { URLValidationResult } from '../../core/GrooveURLCodec';

interface BottomToolbarProps {
  onShare: () => Promise<{ success: boolean; validation: URLValidationResult }>;
  onSave?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
}

export function BottomToolbar({ onShare, onSave, onDownload, onPrint }: BottomToolbarProps) {
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'warning'>('idle');

  const handleShare = useCallback(async () => {
    const result = await onShare();
    if (result.success) {
      if (result.validation.status === 'warning' || result.validation.status === 'error') {
        setShareStatus('warning');
        // Show warning briefly, then reset
        setTimeout(() => setShareStatus('idle'), 3000);
      } else {
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      }
    }
  }, [onShare]);

  const getShareIcon = () => {
    switch (shareStatus) {
      case 'copied':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Share2 className="w-5 h-5" />;
    }
  };

  const getShareLabel = () => {
    switch (shareStatus) {
      case 'copied':
        return 'Copied!';
      case 'warning':
        return 'Long URL';
      default:
        return 'Share';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-slate-500 dark:text-slate-400 text-sm">
          Groovy by Adar Bahar © 2026
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex flex-col items-center gap-1 h-auto py-2 px-4"
          >
            <Download className="w-5 h-5" />
            <span className="text-xs uppercase">Download</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onPrint}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex flex-col items-center gap-1 h-auto py-2 px-4"
          >
            <Printer className="w-5 h-5" />
            <span className="text-xs uppercase">Print</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
              shareStatus === 'copied'
                ? 'text-green-500'
                : shareStatus === 'warning'
                  ? 'text-amber-500'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {getShareIcon()}
            <span className="text-xs uppercase">{getShareLabel()}</span>
          </Button>

          <Button
            size="sm"
            onClick={onSave}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 h-auto py-3 px-6 ml-4"
          >
            <Save className="w-5 h-5" />
            <span className="uppercase font-semibold">Save</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

