import { Download, Printer, Share2, Save } from 'lucide-react';
import { Button } from '../ui/button';

interface BottomToolbarProps {
  onShare?: () => void;
  onSave?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
}

export function BottomToolbar({ onShare, onSave, onDownload, onPrint }: BottomToolbarProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 md:px-6 py-3 md:py-4">
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
        {/* Copyright - hidden on very small screens */}
        <div className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm hidden sm:block">
          Groovy by Adar Bahar © 2026
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex flex-col items-center gap-1 h-auto py-2 px-3 sm:px-4 touch-target"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs uppercase">Download</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onPrint}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex flex-col items-center gap-1 h-auto py-2 px-3 sm:px-4 touch-target"
          >
            <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs uppercase">Print</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex flex-col items-center gap-1 h-auto py-2 px-3 sm:px-4 touch-target"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs uppercase">Share</span>
          </Button>

          <Button
            size="sm"
            onClick={onSave}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 h-auto py-2 sm:py-3 px-4 sm:px-6 ml-2 sm:ml-4 touch-target"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="uppercase font-semibold text-xs sm:text-sm">Save</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

