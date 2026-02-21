import { useState, useEffect } from 'react';
import { TimeSignature } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface TimeSignatureSelectorModalProps {
  timeSignature: TimeSignature;
  isOpen: boolean;
  onClose: () => void;
  onTimeSignatureChange: (ts: TimeSignature) => void;
}

export function TimeSignatureSelectorModal({
  timeSignature,
  isOpen,
  onClose,
  onTimeSignatureChange,
}: TimeSignatureSelectorModalProps) {
  const [tempBeats, setTempBeats] = useState(timeSignature.beats);
  const [tempNoteValue, setTempNoteValue] = useState(timeSignature.noteValue);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setTempBeats(timeSignature.beats);
      setTempNoteValue(timeSignature.noteValue);
    }
  }, [isOpen, timeSignature]);

  const handleApply = () => {
    onTimeSignatureChange({ beats: tempBeats, noteValue: tempNoteValue });
    onClose();
  };

  const beatOptions = Array.from({ length: 14 }, (_, i) => i + 2); // 2-15

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Time Signature</DialogTitle>
          <DialogDescription>
            Choose the time signature for your groove.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selectors */}
          <div className="flex items-center justify-center gap-4">
            <select
              value={tempBeats}
              onChange={(e) => setTempBeats(Number(e.target.value))}
              className="text-2xl font-bold p-2 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              {beatOptions.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <span className="text-3xl font-bold text-slate-400">/</span>

            <select
              value={tempNoteValue}
              onChange={(e) => setTempNoteValue(Number(e.target.value) as 4 | 8 | 16)}
              className="text-2xl font-bold p-2 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={16}>16</option>
            </select>
          </div>

          {/* Preview */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {tempBeats}/{tempNoteValue} time signature
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {tempBeats} {tempNoteValue === 4 ? 'quarter' : tempNoteValue === 8 ? 'eighth' : 'sixteenth'} notes per measure
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleApply} className="bg-purple-600 hover:bg-purple-700 text-white">Apply</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
