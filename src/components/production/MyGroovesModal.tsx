/**
 * MyGroovesModal
 * 
 * Modal for viewing, loading, and deleting saved grooves.
 */

import { useState } from 'react';
import { FolderOpen, Trash2, Play, Clock, Music } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { SavedGroove } from '../../core';

interface MyGroovesModalProps {
  isOpen: boolean;
  onClose: () => void;
  grooves: SavedGroove[];
  onLoadGroove: (groove: SavedGroove) => void;
  onDeleteGroove: (id: string) => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export function MyGroovesModal({
  isOpen,
  onClose,
  grooves,
  onLoadGroove,
  onDeleteGroove,
}: MyGroovesModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId === id) {
      // Second click = confirm delete
      onDeleteGroove(id);
      setDeletingId(null);
    } else {
      // First click = show confirmation
      setDeletingId(id);
      // Reset after 3 seconds if not confirmed
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleLoad = (groove: SavedGroove) => {
    onLoadGroove(groove);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            My Groovies
          </DialogTitle>
          <DialogDescription>
            Your saved drum patterns. Click to load into the editor.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 -mx-6 px-6">
          {grooves.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No saved groovies yet</p>
              <p className="text-sm">
                Create a pattern and click "Save" to save it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {grooves.map((groove) => (
                <div
                  key={groove.id}
                  onClick={() => handleLoad(groove)}
                  className="group flex items-center gap-3 p-3 sm:p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all touch-target"
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
                        {groove.timeSignature} • {groove.tempo} BPM
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(groove.modifiedAt)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(groove.id, e)}
                    className={`flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-target ${
                      deletingId === groove.id
                        ? 'text-red-600 bg-red-100 dark:bg-red-900/30 opacity-100'
                        : 'text-slate-400 hover:text-red-600'
                    }`}
                    title={deletingId === groove.id ? 'Click again to confirm delete' : 'Delete groove'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Groovies are saved locally in your browser.
          </p>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

