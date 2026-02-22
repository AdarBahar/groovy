# Groovy URL Structure Documentation

## Overview

Groovy encodes drum patterns in URLs using a query parameter format that's compatible with GrooveScribe. The URL contains all the information needed to reconstruct a complete drum groove including BPM, time signature, drum parts, and metadata.

## Basic URL Format

```
https://your-domain.com/path/?TimeSig=4/4&Div=16&Tempo=120&Measures=1&H=|x-x-x-x-|&S=|----o---|&K=|o-------|
```

## URL Parameters

### Core Parameters

| Parameter | Description | Example | Valid Values |
|-----------|-------------|---------|--------------|
| `TimeSig` | Time signature | `4/4`, `3/4`, `7/8` | `beats/noteValue` (beats: 1-16, noteValue: 4,8,16) |
| `Div` | Subdivision/Division | `16` | 4, 8, 12, 16, 24, 32, 48 |
| `Tempo` | BPM (Beats Per Minute) | `120` | 20-400 |
| `Measures` | Number of measures | `2` | 1-32 |
| `Swing` | Swing percentage | `15` | 0-100 (optional, default: 0) |

### Metadata Parameters (Optional)

| Parameter | Description | Max Length |
|-----------|-------------|------------|
| `Title` | Song/groove title | 200 chars |
| `Author` | Author/creator name | 100 chars |
| `Comments` | Additional notes | 1000 chars |

### Drum Voice Parameters

Each drum voice group uses a single-letter parameter with pipe-delimited patterns:

| Parameter | Drum Parts | Character Encoding |
|-----------|------------|-------------------|
| `H` | Hi-Hat variations | `x`=closed, `o`=open, `X`=accent, `+`=foot, `m`=metronome, `M`=metronome accent, `c`=cross stick |
| `S` | Snare variations | `o`=normal, `O`=accent, `g`=ghost, `x`=cross-stick, `f`=flam, `r`=rim, `d`=drag, `b`=buzz |
| `K` | Kick drum | `o`=kick |
| `T1` | Rack tom | `o`=tom |
| `T2` | Floor tom | `o`=tom |
| `T3` | 10" tom | `o`=tom |
| `T4` | 16" tom | `o`=tom |
| `C` | Crash cymbal | `o`=crash |
| `R` | Ride cymbal | `o`=ride, `b`=ride bell |

## Pattern Encoding

### Format
- Patterns are enclosed in pipes: `|pattern|` for single measure, `|pattern1|pattern2|` for multiple measures
- Each character represents one subdivision (based on `Div` parameter)
- `-` represents a rest (no hit)
- Different characters represent different articulations/voices

### Calculating Pattern Length
The number of characters per measure is calculated as:
```
notesPerMeasure = (division / noteValue) * beats
```

Examples:
- 4/4 time with 16th notes: `(16/4) * 4 = 16` characters per measure
- 3/4 time with 8th notes: `(8/4) * 3 = 6` characters per measure
- 7/8 time with 16th notes: `(16/8) * 7 = 14` characters per measure

### Pattern Examples

**Single measure 16th notes (Div=16, TimeSig=4/4):**
```
H=|x-x-x-x-x-x-|    # Closed hi-hat on 1, e, 3, e, 1, e (16 characters)
S=|----o-------o---|    # Snare on beat 3 and 4+ (16 characters)  
K=|o-------o-------|    # Kick on beat 1 and 3+ (16 characters)
```

**Two measures:**
```
H=|x-x-x-x-x-x-|x-x-o-x-x-x-|    # Different hi-hat patterns per measure
S=|----o-------o---|----o-------o---|    # Snare backbeats in both measures
```

**8th note subdivisions (Div=8, TimeSig=4/4):**
```
H=|x-x-x-x-|    # 4/4 time with 8th note hi-hats (8 characters)
```

## Complete Example URL

```
https://groovy.com/?TimeSig=4/4&Div=16&Tempo=140&Measures=2&Swing=10&Title=My%20Groove&H=|x-x-x-x-x-x-|x-x-o-x-x-x-|&S=|----o-------o---|----o-------o---|&K=|o-------o-------|o---------------|
```

This represents:
- 4/4 time signature
- 16th note subdivisions  
- 140 BPM
- 2 measures
- 10% swing
- Title: "My Groove"
- Hi-hat: closed hits with one open hi-hat in measure 2
- Snare: backbeats (beat 3 and 4+) in both measures
- Kick: syncopated pattern

## Processing URLs in External Applications

### 1. Parse URL Parameters

```javascript
// Example parsing code
function parseGrooveURL(url) {
  const params = new URLSearchParams(url.split('?')[1]);
  
  // Extract basic parameters
  const timeSig = params.get('TimeSig') || '4/4';
  const [beats, noteValue] = timeSig.split('/').map(Number);
  const division = parseInt(params.get('Div')) || 16;
  const tempo = parseInt(params.get('Tempo')) || 120;
  const measures = parseInt(params.get('Measures')) || 1;
  const swing = parseInt(params.get('Swing')) || 0;
  
  // Calculate notes per measure
  const notesPerMeasure = (division / noteValue) * beats;
  
  return {
    timeSig: { beats, noteValue },
    division,
    tempo,
    measures,
    swing,
    notesPerMeasure,
    patterns: {
      hihat: params.get('H'),
      snare: params.get('S'), 
      kick: params.get('K'),
      tom1: params.get('T1'),
      tom2: params.get('T2'),
      tom3: params.get('T3'),
      tom4: params.get('T4'),
      crash: params.get('C'),
      ride: params.get('R')
    },
    metadata: {
      title: params.get('Title'),
      author: params.get('Author'),
      comments: params.get('Comments')
    }
  };
}
```

### 2. Decode Pattern Strings

```javascript
function decodePattern(patternString, notesPerMeasure) {
  if (!patternString) return [];
  
  // Remove pipes and split into measures
  let cleanPattern = patternString;
  if (cleanPattern.startsWith('|')) cleanPattern = cleanPattern.slice(1);
  if (cleanPattern.endsWith('|')) cleanPattern = cleanPattern.slice(0, -1);
  
  const measures = cleanPattern.split('|');
  
  return measures.map(measure => {
    const hits = [];
    for (let i = 0; i < Math.min(measure.length, notesPerMeasure); i++) {
      const char = measure[i];
      hits.push({
        position: i,
        isHit: char !== '-',
        articulation: char,
        velocity: getVelocityForChar(char)
      });
    }
    return hits;
  });
}

function getVelocityForChar(char) {
  const velocityMap = {
    // Hi-hat
    'x': 100,   // closed
    'o': 100,   // open  
    'X': 120,   // accent
    '+': 100,   // foot
    'm': 80,    // metronome
    'M': 80,    // metronome accent
    'c': 100,   // cross stick
    
    // Snare
    'O': 120,   // accent
    'g': 50,    // ghost
    'f': 100,   // flam
    'r': 100,   // rim
    'd': 100,   // drag
    'b': 100,   // buzz
    
    // Default
    'o': 100    // normal hit
  };
  return velocityMap[char] || 100;
}
```

### 3. Convert to MIDI

```javascript
function convertGrooveToMIDI(groove) {
  const midiTracks = [];
  const ticksPerBeat = 480;
  const ticksPerNote = ticksPerBeat * 4 / groove.division;
  
  // Voice to MIDI note mapping
  const voiceToMidi = {
    kick: 36,           // Bass Drum 1
    snare: 38,          // Acoustic Snare  
    hihat: 42,          // Closed Hi-Hat
    hihatOpen: 46,      // Open Hi-Hat
    crash: 49,          // Crash Cymbal 1
    ride: 51,           // Ride Cymbal 1
    tom1: 48,           // Hi Mid Tom
    tom2: 43,           // High Floor Tom
    tom3: 50,           // High Tom
    tom4: 45            // Low Tom
  };
  
  Object.entries(groove.patterns).forEach(([voiceType, pattern]) => {
    if (pattern) {
      const measures = decodePattern(pattern, groove.notesPerMeasure);
      measures.forEach((measure, measureIndex) => {
        measure.forEach(note => {
          if (note.isHit) {
            const tick = (measureIndex * groove.notesPerMeasure + note.position) * ticksPerNote;
            const midiNote = getMidiNoteForVoice(voiceType, note.articulation);
            
            midiTracks.push({
              time: tick,
              type: 'noteOn',
              note: midiNote,
              velocity: note.velocity,
              channel: 9  // MIDI channel 10 (0-indexed as 9) for drums
            });
          }
        });
      });
    }
  });
  
  return midiTracks;
}

function getMidiNoteForVoice(voiceType, articulation) {
  const baseMidi = {
    kick: 36,
    snare: 38,
    hihat: 42,
    tom1: 48,
    tom2: 43, 
    tom3: 50,
    tom4: 45,
    crash: 49,
    ride: 51
  };
  
  // Handle articulation variations
  if (voiceType === 'hihat') {
    switch (articulation) {
      case 'o': return 46;  // Open hi-hat
      case '+': return 44;  // Hi-hat foot
      default: return 42;   // Closed hi-hat
    }
  }
  
  if (voiceType === 'snare' && articulation === 'x') {
    return 37;  // Cross stick
  }
  
  if (voiceType === 'ride' && articulation === 'b') {
    return 53;  // Ride bell
  }
  
  return baseMidi[voiceType] || 38;
}
```

## URL Validation

Groovy includes built-in URL length validation with these limits:

| Limit Type | Characters | Status |
|------------|------------|--------|
| Safe limit | 2000 | Broad browser compatibility |
| Warning threshold | 1500 | Recommend compression |
| Maximum | 8000 | May fail in some browsers |

External apps should validate:
- URL length stays within limits
- Pattern characters match valid articulations  
- Pattern length matches calculated `notesPerMeasure`
- Parameter values are within valid ranges

## MIDI Note Mapping

### Complete Drum Voice to MIDI Mapping

| Voice | Articulation | MIDI Note | GM Instrument |
|-------|-------------|-----------|---------------|
| **Kick** | o | 36 | Bass Drum 1 |
| **Snare** | o (normal) | 38 | Acoustic Snare |
| **Snare** | O (accent) | 38 | Acoustic Snare (high velocity) |
| **Snare** | g (ghost) | 38 | Acoustic Snare (low velocity) |
| **Snare** | x (cross-stick) | 37 | Side Stick |
| **Snare** | r (rim) | 37 | Side Stick |
| **Hi-Hat** | x (closed) | 42 | Closed Hi-Hat |
| **Hi-Hat** | o (open) | 46 | Open Hi-Hat |
| **Hi-Hat** | + (foot) | 44 | Pedal Hi-Hat |
| **Hi-Hat** | m (metronome) | 37 | Side Stick |
| **Crash** | o | 49 | Crash Cymbal 1 |
| **Ride** | o | 51 | Ride Cymbal 1 |
| **Ride** | b (bell) | 53 | Ride Bell |
| **Tom 1** | o | 48 | Hi Mid Tom |
| **Tom 2** | o | 43 | High Floor Tom |
| **Tom 3** | o | 50 | High Tom |
| **Tom 4** | o | 45 | Low Tom |

## Error Handling

When parsing Groovy URLs, handle these potential issues:

1. **Missing Parameters**: Use defaults (4/4 time, 120 BPM, 16th divisions)
2. **Invalid Values**: Clamp to valid ranges or use defaults
3. **Malformed Patterns**: Skip invalid characters, truncate if too long
4. **URL Too Long**: Warn user or refuse to process
5. **Empty Patterns**: Treat as rests (no drum hits)

## Embedding URL Format

Groovy supports embedding grooves in external websites using a minimal view optimized for iframe display. Add the `embed=true` parameter to any Groovy URL to enable embed mode.

### Basic Embedding Format

```
https://your-domain.com/path/?[groove-parameters]&embed=true
```

### Complete Embedding Example

```
https://groovy.com/?TimeSig=4/4&Div=16&Tempo=140&Measures=2&H=|x-x-x-x-|&S=|----o---|&K=|o-------|&embed=true
```

### Embed vs. Regular View

| Feature | Regular View | Embed View |
|---------|-------------|------------|
| **Full Editor UI** | ✅ Complete interface | ❌ Hidden |
| **Drum Grid Editor** | ✅ Full editing capabilities | ❌ Not available |
| **Playback Controls** | ✅ Full controls + editing | ✅ Play/pause, tempo, swing only |
| **Sheet Music** | ✅ Interactive display | ✅ Read-only display |
| **Header** | ✅ Full navigation | ✅ Minimal title + "Open in Groovy" link |
| **Size** | Full page | Optimized for iframe |

### HTML Embed Code

```html
<iframe 
  src="https://groovy.com/?TimeSig=4/4&Div=16&Tempo=140&H=|x-x-x-x-|&S=|----o---|&K=|o-------|&embed=true" 
  width="600" 
  height="400" 
  frameborder="0" 
  title="Drum Groove">
</iframe>
```

### Recommended Iframe Dimensions

| Layout | Width | Height | Use Case |
|--------|-------|--------|----------|
| **Standard** | 600px | 400px | Blog posts, articles |
| **Wide** | 800px | 500px | Full-width content areas |
| **Compact** | 500px | 350px | Sidebar widgets |
| **Mobile-responsive** | 100% | 400px | Responsive design |

### Responsive Iframe Example

```html
<div style="position: relative; width: 100%; height: 0; padding-bottom: 66.67%;">
  <iframe 
    src="https://groovy.com/?embed=true&TimeSig=4/4&Tempo=140&H=|x-x-x-x-|&S=|----o---|&K=|o-------| 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    frameborder="0" 
    title="Drum Groove">
  </iframe>
</div>
```

## Compatibility Notes

- URLs are compatible with GrooveScribe format
- Character encoding uses URL-safe characters only
- Patterns support multiple measures separated by `|`
- Swing parameter affects playback timing but not pattern encoding
- All drum voices are optional - missing voices are treated as silent
- Embed mode provides minimal UI suitable for iframe display
- The `embed=true` parameter can be combined with any groove parameters

This comprehensive URL structure allows external applications to fully reconstruct, process, and embed Groovy drum patterns with all their musical detail intact.