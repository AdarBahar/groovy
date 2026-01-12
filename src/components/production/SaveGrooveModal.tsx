/**
 * SaveGrooveModal
 *
 * Modal for saving the current groove with a name.
 * Handles duplicate name detection and offers overwrite or rename options.
 */

import { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SavedGroove } from '../../core';

interface SaveGrooveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, existingId?: string) => void;
  initialName?: string;
  findByName: (name: string) => SavedGroove | undefined;
}

export function SaveGrooveModal({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  findByName,
}: SaveGrooveModalProps) {
  const [name, setName] = useState(initialName);
  const [existingGroove, setExistingGroove] = useState<SavedGroove | null>(null);
  const [wantsOverwrite, setWantsOverwrite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setExistingGroove(null);
      setWantsOverwrite(false);
      setIsSaving(false);
      // Focus input after a short delay (after dialog animation)
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialName]);

  // Check for duplicates when name changes (but not while saving)
  useEffect(() => {
    if (isSaving) return; // Don't check duplicates during save

    if (name.trim()) {
      const found = findByName(name.trim());
      setExistingGroove(found || null);
      setWantsOverwrite(false); // Reset overwrite when name changes
    } else {
      setExistingGroove(null);
      setWantsOverwrite(false);
    }
  }, [name, findByName, isSaving]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (existingGroove && !wantsOverwrite) return; // Blocked by duplicate

    // Mark as saving to prevent duplicate warning from flashing
    setIsSaving(true);

    // Save (with existing ID if overwriting)
    onSave(trimmedName, wantsOverwrite ? existingGroove?.id : undefined);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && (!existingGroove || wantsOverwrite)) {
      handleSave();
    }
  };

  const canSave = name.trim() && (!existingGroove || wantsOverwrite);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Save a Groovie
          </DialogTitle>
          <DialogDescription>
            Give your drum pattern a name to save it locally.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <div className="space-y-2">
            <label htmlFor="groove-name" className="text-sm font-medium text-slate-900 dark:text-white">
              Groovie Name
            </label>
            <Input
              ref={inputRef}
              id="groove-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a name for your groovie..."
              className={`w-full ${existingGroove && !wantsOverwrite && !isSaving ? 'border-amber-500 focus-visible:ring-amber-500' : ''}`}
            />
          </div>

          {/* Duplicate name warning - shown below input (hidden during save) */}
          {existingGroove && !wantsOverwrite && !isSaving && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm flex-1">
                <p className="text-amber-800 dark:text-amber-200">
                  A groovie with this name already exists.
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  Change the name or{' '}
                  <button
                    type="button"
                    onClick={() => setWantsOverwrite(true)}
                    className="font-medium underline hover:no-underline text-amber-800 dark:text-amber-200"
                  >
                    overwrite the existing groovie
                  </button>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Overwrite confirmation */}
          {existingGroove && wantsOverwrite && (
            <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <Save className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-purple-800 dark:text-purple-200">
                  The existing groovie will be overwritten.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {wantsOverwrite ? 'Overwrite' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

