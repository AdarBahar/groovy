/**
 * useMIDIInput - React Hook for MIDI Input
 *
 * Manages MIDI device connection, configuration, and note handling.
 * Integrates velocity filtering, double-trigger suppression, and latency compensation.
 * Follows the same pattern as useGrooveEngine for consistency.
 *
 * This is the ONLY place where React-specific code interacts with the MIDI system.
 * The core MIDI modules have no knowledge of React.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { midiAccess } from '../midi/MIDIAccess';
import { midiHandler } from '../midi/MIDIHandler';
import { midiDrumMapping } from '../midi/MIDIDrumMapping';
import { MIDIConfig, MIDIDeviceInfo } from '../midi/types';
import { loadMIDIConfig, saveMIDIConfig } from '../utils/midiStorage';
import { loadLatencyConfig } from '../utils/latencyStorage';
import { DrumSynth } from '../core/DrumSynth';
import { VelocityFilter } from '../midi/VelocityFilter';
import { DoubleTriggerFilter } from '../midi/DoubleTriggerFilter';
import { keyboardMIDISimulator } from '../midi/KeyboardMIDISimulator';
import { FAKE_MIDI_DEVICE_ID_EXPORT } from '../midi/MIDIAccess';

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

  // MIDI filtering
  const velocityFilterRef = useRef<VelocityFilter>(new VelocityFilter());
  const doubleTriggerFilterRef = useRef<DoubleTriggerFilter>(new DoubleTriggerFilter());

  // Initialize MIDI on mount
  useEffect(() => {
    const initMIDI = async () => {
      const success = await midiAccess.initialize();

      if (success) {
        const initialDevices = midiAccess.getInputDevices();
        setDevices(initialDevices);

        // On localhost, auto-connect to fake keyboard device for testing
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost && initialDevices.some((d) => d.id === FAKE_MIDI_DEVICE_ID_EXPORT)) {
          console.log('🎹 Auto-connecting to fake MIDI device (localhost)');
          connectDevice(FAKE_MIDI_DEVICE_ID_EXPORT);
          return;
        }

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

  // Update filters when config changes
  useEffect(() => {
    velocityFilterRef.current.setThresholds(config.velocityThresholds || {});
    doubleTriggerFilterRef.current.setWindows(config.doubleTriggerWindows || {});
  }, [config.velocityThresholds, config.doubleTriggerWindows]);

  // Set up keyboard MIDI simulator for debugging (localhost only)
  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) return;

    // Send MIDI message through fake device when keyboard is pressed
    const handleKeyboardMIDI = (note: number, velocity: number, timestamp: number) => {
      // Send through fake MIDI device
      midiAccess.sendFakeMIDIMessage(note, velocity, timestamp);
    };

    // Start keyboard simulator on localhost
    keyboardMIDISimulator.setEnabled(true);
    keyboardMIDISimulator.start(handleKeyboardMIDI);

    console.log('🎹 Keyboard MIDI simulator enabled (localhost)');
    console.log('📝 Key bindings: K=Kick, S=Snare, Space=Hi-hat');

    return () => {
      keyboardMIDISimulator.stop();
    };
  }, []);

  // Set up MIDI note handler with filtering
  useEffect(() => {
    midiHandler.setNoteOnHandler((note, velocity, _currentVoice, timestamp) => {
      console.log(`🎵 MIDI Note Handler called: note=${note}, velocity=${velocity}, timestamp=${timestamp}`);

      // Apply velocity filtering
      if (!velocityFilterRef.current.isValid(note, velocity)) {
        console.log(
          `MIDI: Note ${note} velocity ${velocity} filtered (threshold: ${velocityFilterRef.current.getThreshold(note)})`
        );
        return;
      }
      console.log(`✅ Velocity filter passed for note ${note}`);

      // Apply double-trigger filtering
      if (!doubleTriggerFilterRef.current.isValid(note, timestamp)) {
        console.log(`MIDI: Note ${note} filtered (double-trigger within ${doubleTriggerFilterRef.current.getWindow(note)}ms)`);
        return;
      }
      console.log(`✅ Double-trigger filter passed for note ${note}`);

      const voice = midiDrumMapping.getVoiceFromNote(note);
      console.log(`🎼 Voice mapping result: note=${note} → voice=${voice}`);

      if (voice) {
        // Apply latency compensation if enabled
        let compensatedTimestamp = timestamp;

        // Debug: Log config to see what's being used
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔧 Config latency: enabled=${config.latencyCompensation?.enabled}, offset=${config.latencyCompensation?.offsetMs}ms`);
        }

        if (config.latencyCompensation?.enabled && config.latencyCompensation?.offsetMs) {
          compensatedTimestamp = timestamp - config.latencyCompensation.offsetMs;
          console.log(`✅ Latency compensation APPLIED: -${config.latencyCompensation.offsetMs}ms`);
        }

        if (config.throughEnabled) {
          // Resume AudioContext if suspended (required for user interaction on Web Audio API)
          synth.resume();

          // Play sound immediately (time=0)
          synth.playDrum(voice, 0, velocity);
          console.log(
            `MIDI: Note ${note} → ${voice} (velocity: ${velocity}${config.latencyCompensation?.enabled ? `, latency: -${config.latencyCompensation.offsetMs}ms` : ''})`
          );
        }

        // Emit event for UI feedback (always emit, independent of audio playback)
        window.dispatchEvent(
          new CustomEvent('midi-note-hit', {
            detail: { voice, velocity, timestamp: compensatedTimestamp },
          })
        );
      }
    });

    return () => {
      midiHandler.setNoteOnHandler(() => {});
    };
  }, [config.throughEnabled, config.latencyCompensation, synth]);

  const connectDevice = useCallback(
    (deviceId: string) => {
      const success = midiAccess.bindInput(deviceId, (event) => {
        midiHandler.handleMessage(event);
      });

      if (success) {
        setIsConnected(true);
        setCurrentDevice(midiAccess.getCurrentDevice());

        // Load device-specific latency config if available
        const latencyConfig = loadLatencyConfig(deviceId);
        console.log(`📦 Device latency config loaded:`, latencyConfig);
        console.log(`📦 Config latencyCompensation before device connect:`, config.latencyCompensation);

        // Save config with device-specific settings
        const updated: MIDIConfig = {
          ...config,
          selectedDeviceId: deviceId,
          latencyCompensation: latencyConfig || config.latencyCompensation,
        };
        console.log(`📦 Final latencyCompensation after device connect:`, updated.latencyCompensation);
        setConfig(updated);
        saveMIDIConfig(updated);

        // Clear double-trigger history for new device
        doubleTriggerFilterRef.current.clearHistory();

        console.log(`Connected to device ${deviceId}${latencyConfig ? ` with latency offset ${latencyConfig.offsetMs}ms` : ''}`);
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
