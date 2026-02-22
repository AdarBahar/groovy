# MIDI Integration Guide for Groovy Scribe

This guide walks you through integrating the MIDI modules into your Groovy Scribe application.

## Prerequisites

- All 5 MIDI modules created in your project:
  - `config/drum-kits.js`
  - `midi/midi-access.js`
  - `midi/midi-handler.js`
  - `midi/drum-mapping.js`
  - `midi/performance-tracker.js` (optional)

## Step 1: Initialize MIDI on App Load

Add this code to Groovy's main entry point / app initialization file (e.g., `src/main.js` or your app bootstrap):

```javascript
import { midiAccess } from './midi/midi-access.js';
import { midiHandler } from './midi/midi-handler.js';
import { getGrooveVoiceFromNote } from './midi/drum-mapping.js';
import { performanceTracker } from './midi/performance-tracker.js';

// On app load
async function initializeMIDI() {
  const success = await midiAccess.initialize();

  if (success) {
    console.log('MIDI initialized');

    // Set up MIDI message handler
    midiHandler.setNoteOnHandler((note, velocity, drumName, grooveVoice, timestamp) => {
      // Trigger Groovy's voice playback
      playGrooveVoice(grooveVoice, velocity);

      // Visual feedback
      highlightDrumPad(grooveVoice);

      // Optional: Performance tracking
      if (performanceTracker.enabled) {
        const analysis = performanceTracker.analyzeHit(grooveVoice, timestamp);
        showPerformanceFeedback(analysis);
      }
    });

    // Populate device list in UI
    updateMIDIDeviceList();
  }
}

// Call this on app startup
initializeMIDI();
```

## Step 2: Add MIDI Device Selector to UI

Add this HTML to your Groovy interface where you want the MIDI controls:

```html
<div class="midi-panel">
  <h3>MIDI Input</h3>

  <div class="midi-device-selector">
    <label for="midi-device-select">Device:</label>
    <select id="midi-device-select">
      <option>Detecting devices...</option>
    </select>
  </div>

  <div class="midi-status">
    <span class="status-indicator"></span>
    <span class="status-text">Not connected</span>
  </div>

  <div class="midi-performance">
    <label>
      <input type="checkbox" id="performance-tracking-toggle">
      Enable performance tracking
    </label>
    <div class="performance-stats" style="display:none;">
      <span>Accuracy: <strong id="accuracy-display">0%</strong></span>
    </div>
  </div>
</div>
```

Add the CSS from `UI_EXAMPLE.html` to your stylesheets.

## Step 3: Implement Device Management Functions

Add these functions to your Groovy app:

```javascript
import { midiAccess } from './midi/midi-access.js';

function updateMIDIDeviceList() {
  const devices = midiAccess.getInputDevices();
  const selectElement = document.getElementById('midi-device-select');

  // Clear existing options
  selectElement.innerHTML = '';

  if (devices.length === 0) {
    selectElement.innerHTML = '<option>No MIDI devices found</option>';
    selectElement.disabled = true;
    return;
  }

  // Add device options
  devices.forEach(device => {
    const option = document.createElement('option');
    option.value = device.id;
    option.textContent = device.name;
    selectElement.appendChild(option);
  });

  selectElement.disabled = false;

  // Auto-select first device
  if (devices.length > 0) {
    bindMIDIDevice(devices[0].id);
  }

  // Listen for device list changes
  midiAccess.onDeviceListChange = (updatedDevices) => {
    updateMIDIDeviceList();
  };
}

function bindMIDIDevice(deviceId) {
  midiAccess.bindInput(deviceId, (event) => {
    midiHandler.handleMessage(event);
  });

  // Update connection status UI
  updateConnectionStatus();
}

function updateConnectionStatus() {
  const device = midiAccess.getCurrentDevice();
  const indicator = document.querySelector('.status-indicator');
  const statusText = document.querySelector('.status-text');

  if (device) {
    indicator.classList.add('connected');
    statusText.textContent = `Connected: ${device.name}`;
  } else {
    indicator.classList.remove('connected');
    statusText.textContent = 'Not connected';
  }
}

// Add device selector change listener
document.getElementById('midi-device-select').addEventListener('change', (e) => {
  if (e.target.value) {
    bindMIDIDevice(e.target.value);
  }
});
```

## Step 4: Connect MIDI to Groovy's Voice Playback

Implement these functions based on your Groovy's audio system:

```javascript
/**
 * Play a groove voice with the given velocity
 * @param {string} grooveVoice - Voice identifier (H/S/K/T1-T4/C/R)
 * @param {number} velocity - MIDI velocity (0-127)
 */
function playGrooveVoice(grooveVoice, velocity) {
  // TODO: Implement based on your Groovy audio system
  // Example: this might call Groovy's audio playback methods
  // Groovy.playVoice(grooveVoice, velocity);
  console.log(`Play voice: ${grooveVoice}, velocity: ${velocity}`);
}

/**
 * Highlight a drum pad in the UI
 * @param {string} grooveVoice - Voice to highlight
 */
function highlightDrumPad(grooveVoice) {
  // TODO: Implement based on your Groovy UI structure
  // Example: Find the element and add animation class
  const element = document.querySelector(`[data-voice="${grooveVoice}"]`);
  if (element) {
    element.classList.add('midi-hit');
    setTimeout(() => element.classList.remove('midi-hit'), 200);
  }
}

/**
 * Show performance feedback
 * @param {Object} analysis - Result from performanceTracker.analyzeHit()
 */
function showPerformanceFeedback(analysis) {
  if (!analysis) return;

  console.log('Performance:', {
    timing: analysis.timingAccuracy,
    note: analysis.noteAccuracy,
    overall: analysis.overall,
    feedback: analysis.feedback
  });

  // TODO: Update UI with performance feedback
  // const accuracyDisplay = document.getElementById('accuracy-display');
  // accuracyDisplay.textContent = `${Math.round(analysis.overall)}%`;
}
```

## Step 5: Sync with Groovy's Metronome (Optional)

If you want to enable performance tracking with Groovy's metronome:

```javascript
import { performanceTracker } from './midi/performance-tracker.js';

/**
 * Call this when Groovy's metronome/playback starts
 * @param {number} tempo - BPM
 * @param {Object} currentPattern - Loaded groove pattern
 */
function onGroovyPlaybackStart(tempo, currentPattern) {
  const startTime = performance.now();

  // Enable performance tracking if a pattern is loaded
  if (currentPattern) {
    performanceTracker.enable(currentPattern, tempo, startTime);
  }
}

/**
 * Call this when Groovy's playback stops
 */
function onGroovyPlaybackStop() {
  performanceTracker.disable();

  // Optionally show performance summary
  const stats = performanceTracker.getStats();
  console.log('Performance Summary:', stats);
}
```

## Step 6: Enable/Disable Performance Tracking Toggle

```javascript
document.getElementById('performance-tracking-toggle').addEventListener('change', (e) => {
  if (e.target.checked) {
    // Enable performance tracking
    // TODO: Make sure a pattern is loaded and playback is active
    performanceTracker.enable(currentPattern, currentTempo, performance.now());
  } else {
    performanceTracker.disable();
  }
});
```

## Testing

1. **MIDI Initialization**
   - [ ] Open Groovy in browser
   - [ ] Check console for "MIDI initialized" message
   - [ ] Verify no errors in console

2. **Device Selection**
   - [ ] Connect MIDI drum kit via USB
   - [ ] Verify device appears in dropdown
   - [ ] Select device from dropdown
   - [ ] Check console for "Connected to MIDI input" message

3. **MIDI Input**
   - [ ] Hit a drum pad (e.g., snare)
   - [ ] Verify console logs: "MIDI Note ON: ..."
   - [ ] Verify drum name and groove voice are correct
   - [ ] Check that sound plays in Groovy

4. **Visual Feedback**
   - [ ] Hit different drums
   - [ ] Verify corresponding voices highlight in Groovy UI
   - [ ] Verify flash animation plays

5. **Performance Tracking** (if enabled)
   - [ ] Load a groove pattern
   - [ ] Start Groovy playback
   - [ ] Play along with MIDI drums
   - [ ] Verify timing accuracy is calculated
   - [ ] Verify note accuracy is checked
   - [ ] Check performance stats display

## Troubleshooting

### Web MIDI API not supported
- Ensure you're using Chrome/Edge (best support)
- For Firefox, enable `dom.webmidi.enabled` in about:config
- Safari has limited support

### MIDI device not detected
- Check USB connection
- Verify device is turned on
- Try reconnecting the device
- Check browser console for errors

### No sound when hitting drums
- Verify `playGrooveVoice()` is implemented correctly
- Check Groovy's audio system initialization
- Verify velocity values are being passed correctly

### Performance tracking not working
- Ensure `onGroovyPlaybackStart()` is called with correct tempo
- Verify pattern data is being passed correctly
- Check that performance tracking is enabled via checkbox

## Next Steps

1. Implement the TODO functions for your specific Groovy setup
2. Test with your MIDI drum controller
3. Customize visual feedback based on your UI design
4. Optionally implement additional drum kit mappings in `drum-kits.js`
