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
import { MIDIConfig, MIDIDeviceInfo } from '../../midi/types';
import { getAllDrumKitNames } from '../../midi/config/drumKits';

interface MIDISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MIDIConfig;
  onConfigChange: (updates: Partial<MIDIConfig>) => void;
  devices: MIDIDeviceInfo[];
  currentDevice: MIDIDeviceInfo | null;
  onConnectDevice: (deviceId: string) => void;
}

export function MIDISettingsModal({
  isOpen,
  onClose,
  config,
  onConfigChange,
  devices,
  currentDevice,
  onConnectDevice,
}: MIDISettingsModalProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(config.selectedDeviceId || '');
  const [throughEnabled, setThroughEnabled] = useState(config.throughEnabled);
  const [selectedKit, setSelectedKit] = useState<string>(config.selectedKitName);
  const drumKitNames = getAllDrumKitNames();

  // Update local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDeviceId(config.selectedDeviceId || '');
      setThroughEnabled(config.throughEnabled);
      setSelectedKit(config.selectedKitName);
    }
  }, [isOpen, config]);

  const handleConnect = () => {
    if (selectedDeviceId) {
      onConnectDevice(selectedDeviceId);
    }
  };

  const handleThroughToggle = () => {
    const newValue = !throughEnabled;
    setThroughEnabled(newValue);
    onConfigChange({ throughEnabled: newValue });
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
            <label htmlFor="midi-device-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              MIDI Device
            </label>
            <select
              id="midi-device-select"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            >
              <option value="">Select a device...</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                  {device.manufacturer ? ` (${device.manufacturer})` : ''}
                </option>
              ))}
            </select>
            {devices.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No MIDI devices detected. Connect your device and try again.
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
            <label htmlFor="midi-kit-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Drum Kit Mapping
            </label>
            <select
              id="midi-kit-select"
              value={selectedKit}
              onChange={(e) => {
                setSelectedKit(e.target.value);
                onConfigChange({ selectedKitName: e.target.value });
              }}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            >
              {drumKitNames.map((kitName) => (
                <option key={kitName} value={kitName}>
                  {kitName}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select the drum kit that matches your hardware
            </p>
          </div>

          {/* Through Toggle */}
          <div className="space-y-2">
            <label htmlFor="midi-through-toggle" className="flex items-center gap-3 cursor-pointer">
              <input
                id="midi-through-toggle"
                type="checkbox"
                checked={throughEnabled}
                onChange={handleThroughToggle}
                className="w-4 h-4 rounded border-slate-300 text-purple-600 cursor-pointer"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Play sounds when hitting MIDI pads
              </span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 ml-7">
              When enabled, hitting your MIDI drum pads will trigger Groovy sounds
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
            <Button onClick={handleConnect} className="bg-purple-600 hover:bg-purple-700">
              Connect
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
