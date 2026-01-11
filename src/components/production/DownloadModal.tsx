import { useState } from 'react';
import { Download, FileJson, Music, FileText, Image, FileAudio, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { GrooveData } from '../../types';
import {
  ExportFormat,
  ALL_EXPORT_FORMATS,
  getFormatInfo,
  downloadAsJSON,
  isFormatSupported,
} from '../../core';

interface DownloadModalProps {
  groove: GrooveData;
  isOpen: boolean;
  onClose: () => void;
}

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  json: <FileJson className="w-5 h-5" />,
  midi: <Music className="w-5 h-5" />,
  pdf: <FileText className="w-5 h-5" />,
  png: <Image className="w-5 h-5" />,
  svg: <Image className="w-5 h-5" />,
  wav: <FileAudio className="w-5 h-5" />,
  mp3: <FileAudio className="w-5 h-5" />,
};

export function DownloadModal({ groove, isOpen, onClose }: DownloadModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      switch (selectedFormat) {
        case 'json':
          downloadAsJSON(groove, { includeMetadata: true, prettyPrint: true });
          break;
        default:
          // Other formats not yet implemented
          console.warn(`Format ${selectedFormat} not yet implemented`);
          break;
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatInfo = getFormatInfo(selectedFormat);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Pattern
          </DialogTitle>
          <DialogDescription>
            Export your drum pattern to a file format of your choice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900 dark:text-white">
              Select Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_EXPORT_FORMATS.map((format) => {
                const info = getFormatInfo(format);
                const isSelected = selectedFormat === format;
                const isSupported = isFormatSupported(format);

                return (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    disabled={!isSupported}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                      ${isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }
                      ${!isSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className={`${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {FORMAT_ICONS[format]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-slate-900 dark:text-white'}`}>
                        {info.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {info.extension}
                      </div>
                    </div>
                    {!isSupported && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">Soon</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format Description */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {formatInfo.description}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isDownloading || !isFormatSupported(selectedFormat)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Downloaded!
              </>
            ) : isDownloading ? (
              'Generating...'
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download {formatInfo.extension}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

