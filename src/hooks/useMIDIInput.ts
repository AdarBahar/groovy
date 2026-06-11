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
import { trackMIDIDeviceDisconnected } from '../utils/analytics';
import { logger } from '../utils/logger';

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
 * @param synth - DrumSynth instance for audio playback (optional, creates one if not provided)
 * @returns MIDI state and control methods
 */
export function useMIDIInput(synth?: DrumSynth): UseMIDIInputReturn {
  // Lazy-init: only create a fallback DrumSynth once, and only when no synth is provided.
  // Using null as initial value avoids constructing DrumSynth on every render when synth
  // is undefined (the eager `synth || new DrumSynth()` ran new DrumSynth() each render).
  const synthRef = useRef<DrumSynth | null>(synth ?? null);
  if (synthRef.current === null) {
    // First render with no synth provided — construct the fallback exactly once
    synthRef.current = new DrumSynth();
  }

  // Adopt a late-provided synth (e.g. parent renders the synth after the hook mounts)
  useEffect(() => {
    if (synth && synthRef.current !== synth) {
      synthRef.current = synth;
    }
  }, [synth]);

  const [config, setConfig] = useState<MIDIConfig>(loadMIDIConfig);
  const [devices, setDevices] = useState<MIDIDeviceInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<MIDIDeviceInfo | null>(null);

  // MIDI filtering
  const velocityFilterRef = useRef<VelocityFilter>(new VelocityFilter());
  const doubleTriggerFilterRef = useRef<DoubleTriggerFilter>(new DoubleTriggerFilter());

  // Refs for stable listener attachment (prevents dependency churn)
  const configRef = useRef<MIDIConfig>(config);
  const stateRef = useRef<{ isConnected: boolean; selectedDeviceId: string | null; currentDevice: MIDIDeviceInfo | null }>({
    isConnected,
    selectedDeviceId: config.selectedDeviceId,
    currentDevice,
  });

  // Sync refs whenever state changes (cheap operation, no listener re-attachment)
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    stateRef.current = { isConnected, selectedDeviceId: config.selectedDeviceId, currentDevice };
  }, [isConnected, config.selectedDeviceId, currentDevice]);

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
          logger.log('🎹 Auto-connecting to fake MIDI device (localhost)');
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
      const state = stateRef.current;
      setDevices(updatedDevices);

      // If current device disconnected, clear connection
      if (state.isConnected && state.selectedDeviceId && !updatedDevices.some((d) => d.id === state.selectedDeviceId)) {
        const disconnectedDevice = state.currentDevice;
        setIsConnected(false);
        setCurrentDevice(null);

        // Track device disconnection
        if (disconnectedDevice) {
          trackMIDIDeviceDisconnected(disconnectedDevice.name, disconnectedDevice.id);
        }
      }
    };

    // Cleanup: Reset callback on unmount
    return () => {
      midiAccess.onDeviceListChange = null;
    };
  }, []);

  // Update drum kit and filters when config changes
  useEffect(() => {
    midiDrumMapping.setKit(config.selectedKitName);
    velocityFilterRef.current.setThresholds(config.velocityThresholds || {});
    doubleTriggerFilterRef.current.setWindows(config.doubleTriggerWindows || {});
  }, [config.selectedKitName, config.velocityThresholds, config.doubleTriggerWindows]);

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

    logger.log('🎹 Keyboard MIDI simulator enabled (localhost)');
    logger.log('Key bindings: K=Kick, S=Snare, H=Hi-hat (Space=play/pause)');

    return () => {
      keyboardMIDISimulator.stop();
    };
  }, []);

  // Set up MIDI note handler with filtering
  useEffect(() => {
    midiHandler.setNoteOnHandler((note, velocity, _currentVoice, timestamp) => {
      const config = configRef.current;

      // Apply velocity filtering
      if (!velocityFilterRef.current.isValid(note, velocity)) {
        return;
      }

      // Apply double-trigger filtering
      if (!doubleTriggerFilterRef.current.isValid(note, timestamp)) {
        return;
      }

      const voice = midiDrumMapping.getVoiceFromNote(note);

      if (voice) {
        // Apply latency compensation if enabled
        let compensatedTimestamp = timestamp;

        if (config.latencyCompensation?.enabled && config.latencyCompensation?.offsetMs) {
          compensatedTimestamp = timestamp - config.latencyCompensation.offsetMs;
        }

        if (config.throughEnabled) {
          // Resume AudioContext if suspended (required for user interaction on Web Audio API)
          // synthRef.current is guaranteed non-null by the lazy init guard above
          synthRef.current!.resume();

          // Play sound immediately (time=0)
          synthRef.current!.playDrum(voice, 0, velocity);
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
  }, []);

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

        // Save config with device-specific settings
        const updated: MIDIConfig = {
          ...configRef.current,
          selectedDeviceId: deviceId,
          latencyCompensation: latencyConfig || configRef.current.latencyCompensation,
        };
        setConfig(updated);
        saveMIDIConfig(updated);

        // Clear double-trigger history for new device
        doubleTriggerFilterRef.current.clearHistory();
      }
    },
    []
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
