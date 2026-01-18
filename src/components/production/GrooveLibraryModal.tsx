/**
 * GrooveLibraryModal
 *
 * Modal for browsing and loading built-in groove library.
 * Grooves are read-only but can be saved to My Groovies for editing.
 */

import { useState } from 'react';
import { Library, Play, Music, Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useGrooveLibrary, LibraryGroove } from '../../hooks/useGrooveLibrary';
import { GrooveData } from '../../types';
import { trackLibraryStyleSelect, trackLibraryGrooveLoad, trackLibraryGrooveSave } from '../../utils/analytics';

interface GrooveLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadGroove: (groove: GrooveData) => void;
  onSaveToMyGroovies: (groove: GrooveData, name: string) => void;
}

export function GrooveLibraryModal({
  isOpen,
  onClose,
  onLoadGroove,
  onSaveToMyGroovies,
}: GrooveLibraryModalProps) {
  const { styles, decodeGroove } = useGrooveLibrary();
  const [activeStyleId, setActiveStyleId] = useState<string>(styles[0]?.id ?? '');
  const [copiedGroove, setCopiedGroove] = useState<string | null>(null);

  const activeStyle = styles.find(s => s.id === activeStyleId);

  const handleStyleChange = (styleId: string) => {
    const style = styles.find(s => s.id === styleId);
    if (style) trackLibraryStyleSelect(style.name);
    setActiveStyleId(styleId);
  };

  const handleLoad = (libraryGroove: LibraryGroove) => {
    trackLibraryGrooveLoad(libraryGroove.name, activeStyle?.name ?? '');
    const grooveData = decodeGroove(libraryGroove);
    // Set the title to the library groove name
    grooveData.title = libraryGroove.name;
    onLoadGroove(grooveData);
    onClose();
  };

  const handleSaveToMyGroovies = (libraryGroove: LibraryGroove, e: React.MouseEvent) => {
    e.stopPropagation();
    trackLibraryGrooveSave(libraryGroove.name, activeStyle?.name ?? '');
    const grooveData = decodeGroove(libraryGroove);
    grooveData.title = libraryGroove.name;
    onSaveToMyGroovies(grooveData, libraryGroove.name);
    setCopiedGroove(libraryGroove.name);
    setTimeout(() => setCopiedGroove(null), 2000);
  };

  // Extract tempo from URL for display
  const getTempoFromUrl = (url: string): number => {
    const match = url.match(/Tempo=(\d+)/);
    return match ? parseInt(match[1], 10) : 120;
  };

  // Extract time signature from URL for display
  const getTimeSigFromUrl = (url: string): string => {
    const match = url.match(/TimeSig=([^&]+)/);
    return match ? match[1] : '4/4';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="w-5 h-5" />
            Groove Library
          </DialogTitle>
          <DialogDescription>
            Browse and load preset drum patterns. Click to load, or save to My Groovies for editing.
          </DialogDescription>
        </DialogHeader>

        {/* Style Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
          {styles.map((style) => (
            <Button
              key={style.id}
              variant={activeStyleId === style.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleStyleChange(style.id)}
              className={`flex-shrink-0 touch-target ${
                activeStyleId === style.id
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {style.name}
            </Button>
          ))}
        </div>

        {/* Groove List */}
        <div className="flex-1 overflow-y-auto py-2 -mx-6 px-6">
          <div className="space-y-2">
            {activeStyle?.grooves.map((groove) => (
              <div
                key={groove.name}
                onClick={() => handleLoad(groove)}
                className="group flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all touch-target"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white truncate">
                    {groove.name}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Music className="w-3 h-3" />
                      {getTimeSigFromUrl(groove.url)} • {getTempoFromUrl(groove.url)} BPM
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleSaveToMyGroovies(groove, e)}
                  className={`flex-shrink-0 text-xs gap-1 touch-target ${
                    copiedGroove === groove.name
                      ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
                      : 'text-slate-500 hover:text-purple-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                  } transition-all`}
                  title="Save to My Groovies for editing"
                >
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">{copiedGroove === groove.name ? 'Saved!' : 'Save Copy'}</span>
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Click a groove to load it. Save a copy to edit it.
          </p>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

