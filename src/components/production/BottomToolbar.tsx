import { Download, Github, Printer, Share2, Save } from 'lucide-react';
import { Button } from '../ui/button';

interface BottomToolbarProps {
  onShare?: () => void;
  onSave?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
}

export function BottomToolbar({ onShare, onSave, onDownload, onPrint }: BottomToolbarProps) {
  const hasActions = Boolean(onShare || onSave || onDownload || onPrint);

  return (
    <footer className="bg-surface-0 border-t border-line px-4 md:px-6 py-3">
      <div className={`flex ${hasActions ? 'flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0' : 'items-center justify-center'}`}>
        {/* Copyright - hidden on very small screens */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-ink-3 text-xs">
          <span><span translate="no">Groovy</span> by <span translate="no">Adar Bahar</span> ©{'\u00A0'}2026</span>
          <a
            href="https://github.com/AdarBahar/groovy/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 underline underline-offset-4 decoration-line-strong hover:text-ink-1 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span translate="no">AdarBahar/groovy</span>
          </a>
        </div>

        {/* Action buttons */}
        {hasActions && (
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 font-normal flex items-center gap-2 h-9 px-3 has-[>svg]:px-3 touch-target"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Download</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onPrint}
            className="text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 font-normal flex items-center gap-2 h-9 px-3 has-[>svg]:px-3 touch-target"
          >
            <Printer className="w-4 h-4" />
            <span className="text-sm">Print</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 font-normal flex items-center gap-2 h-9 px-3 has-[>svg]:px-3 touch-target"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </Button>

          <Button
            size="sm"
            onClick={onSave}
            className="bg-ink-1 hover:bg-ink-1/90 text-surface-1 flex items-center gap-2 h-9 px-4 has-[>svg]:px-4 ml-2 touch-target"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">Save</span>
          </Button>
        </div>
        )}
      </div>
    </footer>
  );
}
