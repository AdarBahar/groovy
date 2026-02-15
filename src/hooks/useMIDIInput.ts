/**
 * useMIDIInput - React Hook for MIDI Input
 *
 * Manages MIDI device connection, configuration, and note handling.
 * Follows the same pattern as useGrooveEngine for consistency.
 *
 * This is the ONLY place where React-specific code interacts with the MIDI system.
 * The core MIDI modules have no knowledge of React.
 */

import { useState, useEffect, useCallback } from 'react';
import { midiAccess } from '../midi/MIDIAccess';
import { midiHandler } from '../midi/MIDIHandler';
import { midiDrumMapping } from '../midi/MIDIDrumMapping';
import { MIDIConfig, MIDIDeviceInfo } from '../midi/types';
import { loadMIDIConfig, saveMIDIConfig } from '../utils/midiStorage';
import { DrumSynth } from '../core/DrumSynth';

interface UseMIDIInputReturn {
  config: MIDIConfig;
  updateConfig: (updates: Partial<MIDIConfig>) => void;
  devices: MIDIDeviceInfo[];
  isConnected: boolean;
  currentDevice: MIDIDeviceInfo | null;
  connectDevice: (deviceId: string) => void;
  disconnect: () => void;
}

/**
 * React hook for MIDI input integration
 * @param synth - DrumSynth instance for audio playback
 * @returns MIDI state and control methods
 */
export function useMIDIInput(synth: DrumSynth): UseMIDIInputReturn {
  const [config, setConfig] = useState<MIDIConfig>(loadMIDIConfig);
  const [devices, setDevices] = useState<MIDIDeviceInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<MIDIDeviceInfo | null>(null);

  // Initialize MIDI on mount
  useEffect(() => {
    const initMIDI = async () => {
      const success = await midiAccess.initialize();

      if (success) {
        const initialDevices = midiAccess.getInputDevices();
        setDevices(initialDevices);

        // Auto-connect to saved device if available
        if (config.selectedDeviceId && initialDevices.some((d) => d.id === config.selectedDeviceId)) {
          connectDevice(config.selectedDeviceId);
        }
      }
    };

    initMIDI();

    return () => {
      midiAccess.disconnect();
    };
  }, []);

  // Handle device list changes and device disconnections
  useEffect(() => {
    midiAccess.onDeviceListChange = (updatedDevices) => {
      setDevices(updatedDevices);

      // If current device disconnected, clear connection
      if (isConnected && config.selectedDeviceId && !updatedDevices.some((d) => d.id === config.selectedDeviceId)) {
        setIsConnected(false);
        setCurrentDevice(null);
      }
    };

    // Cleanup: Reset callback on unmount
    return () => {
      midiAccess.onDeviceListChange = null;
    };
  }, [isConnected, config.selectedDeviceId]);

  // Handle drum kit changes
  useEffect(() => {
    midiDrumMapping.setKit(config.selectedKitName);
  }, [config.selectedKitName]);

  // Set up MIDI note handler
  useEffect(() => {
    midiHandler.setNoteOnHandler((note, velocity, _currentVoice, timestamp) => {
      const voice = midiDrumMapping.getVoiceFromNote(note);

      if (voice) {
        if (config.throughEnabled) {
          // Resume AudioContext if suspended (required for user interaction on Web Audio API)
          synth.resume();

          // Play sound immediately (time=0)
          synth.playDrum(voice, 0, velocity);
          console.log(`MIDI: Note ${note} → ${voice} (velocity: ${velocity})`);
        }

        // Emit event for UI feedback (always emit, independent of audio playback)
        window.dispatchEvent(
          new CustomEvent('midi-note-hit', {
            detail: { voice, velocity, timestamp },
          })
        );
      }
    });

    return () => {
      midiHandler.setNoteOnHandler(() => {});
    };
  }, [config.throughEnabled, synth]);

  const connectDevice = useCallback(
    (deviceId: string) => {
      const success = midiAccess.bindInput(deviceId, (event) => {
        midiHandler.handleMessage(event);
      });

      if (success) {
        setIsConnected(true);
        setCurrentDevice(midiAccess.getCurrentDevice());

        // Save config
        const updated = { ...config, selectedDeviceId: deviceId };
        setConfig(updated);
        saveMIDIConfig(updated);
      }
    },
    [config]
  );

  const disconnect = useCallback(() => {
    midiAccess.disconnect();
    setIsConnected(false);
    setCurrentDevice(null);
  }, []);

  const updateConfig = useCallback(
    (updates: Partial<MIDIConfig>) => {
      const updated = { ...config, ...updates };
      setConfig(updated);
      saveMIDIConfig(updated);
    },
    [config]
  );

  return {
    config,
    updateConfig,
    devices,
    isConnected,
    currentDevice,
    connectDevice,
    disconnect,
  };
}
