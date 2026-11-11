/**
 * MIDISettingsModal - MIDI Configuration Dialog
 *
 * Modal for selecting MIDI devices and configuring MIDI playthrough settings.
 * Follows the same pattern as SaveGrooveModal using Radix Dialog.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { MIDIAvailability, MIDIConfig, MIDIDeviceInfo } from '../../midi/types';
import { getAllDrumKitNames } from '../../midi/config/drumKits';
import { trackMIDISettingsOpen, trackMIDIDeviceSelected, trackMIDIDrumKitSelected, trackMIDIDeviceConnected } from '../../utils/analytics';

interface MIDISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MIDIConfig;
  onConfigChange: (updates: Partial<MIDIConfig>) => void;
  devices: MIDIDeviceInfo[];
  currentDevice: MIDIDeviceInfo | null;
  onConnectDevice: (deviceId: string) => void;
  availability: MIDIAvailability;
}

const NO_DEVICES_MESSAGE = 'No MIDI devices detected. Connect your device and try again.';

/** Fixed messages for each state in which MIDI cannot be used. */
const AVAILABILITY_MESSAGES: Record<Exclude<MIDIAvailability, 'available'>, string> = {
  pending: 'Checking MIDI…',
  unsupported: 'Web MIDI is not available in this browser. Use Chrome or Edge.',
  denied:
    'MIDI access was blocked. Allow MIDI access for this site in the browser settings, then reload the page.',
  error: 'MIDI could not start. Reload the page and try again.',
};

export function MIDISettingsModal({
  isOpen,
  onClose,
  config,
  onConfigChange,
  devices,
  currentDevice,
  onConnectDevice,
  availability,
}: MIDISettingsModalProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(config.selectedDeviceId || '');
  const [selectedKit, setSelectedKit] = useState<string>(config.selectedKitName);
  const drumKitNames = getAllDrumKitNames();
  // Only fixed strings are shown. The raw browser error is never rendered.
  const statusMessage =
    availability === 'available'
      ? devices.length === 0
        ? NO_DEVICES_MESSAGE
        : null
      : AVAILABILITY_MESSAGES[availability];
  const isProblem =
    availability === 'unsupported' || availability === 'denied' || availability === 'error';

  // Update local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDeviceId(config.selectedDeviceId || '');
      setSelectedKit(config.selectedKitName);
      trackMIDISettingsOpen();
    }
  }, [isOpen, config]);

  const handleConnect = () => {
    if (selectedDeviceId) {
      const selectedDevice = devices.find(d => d.id === selectedDeviceId);
      if (selectedDevice) {
        trackMIDIDeviceConnected(selectedDevice.name);
      }
      onConnectDevice(selectedDeviceId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>MIDI Settings</DialogTitle>
          <DialogDescription>Configure your MIDI input device and playback options</DialogDescription>
        </DialogHeader>

        {/* Beta Notice */}
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">⚠️ Beta Feature:</span> MIDI support is experimental. Please report any issues you encounter.
          </p>
        </div>

        <div className="space-y-4">
          {/* Device Selector */}
          <div className="space-y-2">
            <label htmlFor="midi-device-select" className="text-sm font-medium text-ink-2">
              MIDI Device
            </label>
            <select
              id="midi-device-select"
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                const selectedDevice = devices.find(d => d.id === e.target.value);
                if (selectedDevice) {
                  trackMIDIDeviceSelected(selectedDevice.name);
                }
              }}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-ink-1 text-sm"
            >
              <option value="">Select a device...</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                  {device.manufacturer ? ` (${device.manufacturer})` : ''}
                </option>
              ))}
            </select>
            {statusMessage && (
              <p
                role="status"
                className={
                  isProblem
                    ? 'text-xs text-amber-700 dark:text-amber-400'
                    : 'text-xs text-ink-3'
                }
              >
                {statusMessage}
              </p>
            )}
          </div>

          {/* Connection Status */}
          {currentDevice && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  Connected to {currentDevice.name}
                </span>
              </div>
            </div>
          )}

          {/* Drum Kit Selector */}
          <div className="space-y-2">
            <label htmlFor="midi-kit-select" className="text-sm font-medium text-ink-2">
              Drum Kit Mapping
            </label>
            <select
              id="midi-kit-select"
              value={selectedKit}
              onChange={(e) => {
                setSelectedKit(e.target.value);
                onConfigChange({ selectedKitName: e.target.value });
                trackMIDIDrumKitSelected(e.target.value);
              }}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-ink-1 text-sm"
            >
              {drumKitNames.map((kitName) => (
                <option key={kitName} value={kitName}>
                  {kitName}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-3">
              Select the drum kit that matches your hardware
            </p>
          </div>

          {/* Browser Compatibility Warning */}
          {!navigator.requestMIDIAccess && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Web MIDI API not supported in this browser. Use Chrome or Edge for MIDI support.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {selectedDeviceId && selectedDeviceId !== config.selectedDeviceId && (
            <Button onClick={handleConnect} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Connect
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
