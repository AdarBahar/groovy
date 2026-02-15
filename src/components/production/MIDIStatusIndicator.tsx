/**
 * MIDIStatusIndicator - Connection Status Badge
 *
 * Displays a simple badge showing MIDI device connection status.
 * Located in Header or Sidebar for always-visible feedback.
 */

import { MIDIDeviceInfo } from '../../midi/types';

interface MIDIStatusIndicatorProps {
  device: MIDIDeviceInfo | null;
}

export function MIDIStatusIndicator({ device }: MIDIStatusIndicatorProps) {
  if (!device) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
      <span className="text-xs font-medium text-purple-700 dark:text-purple-300 truncate max-w-[120px]">
        MIDI: {device.name}
      </span>
    </div>
  );
}
