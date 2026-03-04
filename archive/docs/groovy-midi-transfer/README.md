# Groovy MIDI Integration Package

This package contains all the files needed to add MIDI device support to Groovy Scribe, eliminating the need for an iframe and enabling direct MIDI-to-playback synchronization.

## 📦 Package Contents

### Code Modules (Copy to your Groovy project)

```
src/
├── config/
│   └── drum-kits.js                 # Drum kit MIDI note mappings
└── midi/
    ├── midi-access.js               # MIDI device management & initialization
    ├── midi-handler.js              # MIDI message processing
    ├── drum-mapping.js              # Drum name to Groovy voice mapping
    └── performance-tracker.js       # Real-time performance analysis (optional)
```

### Documentation

- **INTEGRATION_GUIDE.md** - Step-by-step integration instructions
- **UI_EXAMPLE.html** - HTML/CSS example for MIDI control panel
- **README.md** - This file

## 🚀 Quick Start

### 1. Copy Files to Your Groovy Project

Copy the directory structure to your Groovy project's `src` folder:

```
groovy-scribe-app/
├── src/
│   ├── config/
│   │   └── drum-kits.js
│   ├── midi/
│   │   ├── midi-access.js
│   │   ├── midi-handler.js
│   │   ├── drum-mapping.js
│   │   └── performance-tracker.js
│   └── ... (rest of Groovy code)
```

### 2. Read Integration Guide

Open **INTEGRATION_GUIDE.md** and follow these steps:

1. **Initialize MIDI** in your app startup code
2. **Add UI elements** using code from UI_EXAMPLE.html
3. **Implement device management** functions
4. **Connect to Groovy's voice playback** system
5. **Optional: Enable performance tracking**

### 3. Test Integration

Follow the testing checklist in INTEGRATION_GUIDE.md to verify everything works.

## 📋 What Each Module Does

### 1. **config/drum-kits.js**
- Defines MIDI note-to-drum-name mappings for Roland TD-17
- Maps drum names to Groovy voice identifiers (H, S, K, T1-T4, C, R)
- Easily extendable for other drum kits (Alesis, Yamaha, etc.)

### 2. **midi/midi-access.js**
- Handles Web MIDI API initialization
- Enumerates available MIDI input devices
- Manages device connections/disconnections
- Provides singleton instance for global access

**Key Methods:**
- `initialize()` - Request MIDI API access
- `getInputDevices()` - List available devices
- `bindInput(deviceId, handler)` - Connect to device
- `disconnect()` - Disconnect from device
- `getCurrentDevice()` - Get active device info

### 3. **midi/midi-handler.js**
- Processes incoming MIDI messages
- Parses note on/off and control change events
- Converts MIDI notes to drum names and Groovy voices
- Triggers callbacks for note events

**Key Methods:**
- `handleMessage(event)` - Main MIDI message processor
- `setNoteOnHandler(callback)` - Set note on callback
- `setNoteOffHandler(callback)` - Set note off callback
- `setControlChangeHandler(callback)` - Set CC callback

### 4. **midi/drum-mapping.js**
- Utility functions for MIDI-to-voice conversion
- Supports switching between drum kits
- Pure mapping functions (no state)

**Key Exports:**
- `getDrumNameFromNote(note)` - MIDI note → drum name
- `getGrooveVoiceFromNote(note)` - MIDI note → groove voice
- `getGrooveVoiceFromDrumName(name)` - drum name → groove voice
- `getAllVoices()` - Get all voices for current kit

### 5. **midi/performance-tracker.js** (Optional)
- Real-time performance analysis during playback
- Timing accuracy calculation
- Note accuracy verification
- Performance statistics collection

**Key Methods:**
- `enable(pattern, tempo, startTime)` - Start tracking
- `analyzeHit(voice, timestamp)` - Analyze single hit
- `getStats()` - Get performance summary

## 🎛️ Architecture Benefits

✅ **No iframe** - Direct integration eliminates cross-origin issues
✅ **Modular** - Each MIDI component is separate and testable
✅ **Uses Groovy's metronome** - No duplicate audio systems
✅ **Extensible** - Easy to add more drum kits
✅ **Optional features** - Performance tracking can be enabled/disabled
✅ **Zero dependencies** - Pure vanilla JavaScript

## 🔌 Integration Points

Your Groovy app needs to implement these functions to complete the integration:

1. **`playGrooveVoice(voice, velocity)`**
   - Trigger audio playback for a voice
   - Called when MIDI note is received

2. **`highlightDrumPad(voice)`**
   - Visual feedback for drum hit
   - Called after playback

3. **`onGroovyPlaybackStart(tempo, pattern)`**
   - Called when playback starts
   - Enables performance tracking

4. **`onGroovyPlaybackStop()`**
   - Called when playback stops
   - Disables performance tracking

See INTEGRATION_GUIDE.md for detailed examples.

## 🎵 Supported MIDI Mappings

### Roland TD-17 (Default)

| MIDI Note | Drum | Voice |
|-----------|------|-------|
| 36 | Kick | K |
| 38 | Snare Head | S |
| 42 | HH Closed | H |
| 46 | HH Open | H |
| 48-50 | Tom 1 | T1 |
| 45-47 | Tom 2 | T2 |
| 43 | Tom 3 | T3 |
| 41 | Tom 4 | T4 |
| 49, 55, 57, 52 | Crashes | C |
| 51, 59, 53 | Ride | R |

To add more kits, edit `config/drum-kits.js` and add to `DRUM_KITS` object.

## 🧪 Testing Checklist

- [ ] MIDI API initializes without errors
- [ ] Device dropdown populates with connected devices
- [ ] Can select different MIDI devices
- [ ] Connection status updates when device connects/disconnects
- [ ] Hitting drums triggers corresponding voice playback
- [ ] Visual feedback (highlighting) works correctly
- [ ] Performance tracking calculates timing accuracy
- [ ] Browser console shows MIDI messages without errors

## 🐛 Troubleshooting

### Web MIDI not supported
- Ensure Chrome/Edge browser
- Firefox requires `dom.webmidi.enabled` flag
- Safari has limited support

### No MIDI devices detected
- Verify USB connection
- Check device power
- Try reconnecting device
- Check browser console for errors

### No sound when hitting drums
- Verify `playGrooveVoice()` is implemented
- Check Groovy's audio system
- Verify velocity values are correct

### Performance tracking not working
- Ensure pattern is loaded
- Verify playback has started
- Check tempo is passed correctly

## 📚 Additional Resources

- [Web MIDI API Specification](https://www.w3.org/TR/webmidi/)
- [Web Audio API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MIDI Note Reference](https://en.wikipedia.org/wiki/Scientific_pitch_notation)

## 🔄 Future Enhancements

- [ ] Support for additional drum kits (Alesis, Yamaha, etc.)
- [ ] MIDI mapping customization UI
- [ ] Record MIDI performances as patterns
- [ ] Export performance statistics
- [ ] MIDI learn mode (auto-detect kit mapping)
- [ ] CC message handling for tempo/volume

## 📝 License

These modules are provided as part of the Groovy Scribe project.

---

**Ready to integrate?** Start with **INTEGRATION_GUIDE.md**
