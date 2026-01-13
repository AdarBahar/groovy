import { useState } from 'react';
import { Download, FileJson, Music, FileText, Image, FileAudio, Check, AlertCircle } from 'lucide-react';
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
  downloadAsSVG,
  downloadAsPNG,
  downloadAsPDF,
  downloadAsMIDI,
  downloadAsMP3,
  isFormatSupported,
} from '../../core';
import { trackDownload } from '../../utils/analytics';

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

// Default loop counts for audio formats
const DEFAULT_LOOPS: Partial<Record<ExportFormat, number>> = {
  midi: 2,
  mp3: 4,
  wav: 4,
};

export function DownloadModal({ groove, isOpen, onClose }: DownloadModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [loopCount, setLoopCount] = useState(4);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if selected format supports loop count
  const supportsLoops = selectedFormat === 'midi' || selectedFormat === 'mp3' || selectedFormat === 'wav';

  // Update loop count when format changes
  const handleFormatChange = (format: ExportFormat) => {
    setSelectedFormat(format);
    if (DEFAULT_LOOPS[format]) {
      setLoopCount(DEFAULT_LOOPS[format]);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);
    setError(null);

    try {
      switch (selectedFormat) {
        case 'json':
          downloadAsJSON(groove, { includeMetadata: true, prettyPrint: true });
          break;
        case 'svg':
          await downloadAsSVG(groove);
          break;
        case 'png':
          await downloadAsPNG(groove);
          break;
        case 'pdf':
          await downloadAsPDF(groove);
          break;
        case 'midi':
          downloadAsMIDI(groove, { loops: loopCount });
          break;
        case 'mp3':
          await downloadAsMP3(groove, { loops: loopCount });
          break;
        default:
          // Other formats not yet implemented
          console.warn(`Format ${selectedFormat} not yet implemented`);
          setError(`${selectedFormat.toUpperCase()} export is coming soon!`);
          return;
      }
      trackDownload(selectedFormat);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error('Download failed:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
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
                    onClick={() => handleFormatChange(format)}
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

          {/* Loop Count (for audio formats) */}
          {supportsLoops && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900 dark:text-white">
                Number of Loops
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={16}
                  value={loopCount}
                  onChange={(e) => setLoopCount(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <span className="w-8 text-center text-sm font-medium text-slate-900 dark:text-white">
                  {loopCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The groove will repeat {loopCount} time{loopCount > 1 ? 's' : ''} in the exported file
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
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

