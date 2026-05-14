# Coding Conventions

**Analysis Date:** 2026-05-14

## Naming Patterns

**Files:**
- PascalCase for React components: `PlaybackControls.tsx`, `DrumGridDark.tsx`
- camelCase for utilities and services: `midiStorage.ts`, `latencyStorage.ts`, `logger.ts`
- camelCase for hooks: `useGrooveEngine.ts`, `useMIDIInput.ts`, `useMIDITracking.ts`
- SCREAMING_SNAKE_CASE for constants: `DEFAULT_MIDI_CONFIG`, `MAX_MEASURES`, `FAKE_MIDI_DEVICE_ID`
- `.test.ts` or `.test.tsx` suffix for test files: `PerformanceTracker.test.ts`, `MIDIDrumMapping.test.ts`

**Functions & Variables:**
- camelCase for all function names (including React components that are functions): `createEmptyNotesRecord()`, `getVoiceFromNote()`, `loadMIDIConfig()`
- Private class methods prefix with underscore: `buildMIDIToVoiceMap()`, `buildOffsetGrid()`
- Boolean variables prefix with `is` or `has`: `isPlaying`, `hasError`, `isEnabled()`
- Callback handlers suffix with Handler: `setNoteOnHandler()`, `setControlChangeHandler()`

**Types:**
- PascalCase for all types and interfaces: `DrumVoice`, `MIDIDeviceInfo`, `GrooveData`, `HitAnalysis`
- Record types for mappings: `Record<DrumVoice, boolean[]>`, `Record<number, DrumVoice>`
- Use specific type names over generic `any`: `DrumVoice | null` not `any`

**Constants:**
- SCREAMING_SNAKE_CASE for module-level constants: `DEFAULT_GROOVE`, `DEFAULT_MIDI_CONFIG`, `MIN_PLAY_INTERVAL_AUDIO_TIME`
- Config objects follow the pattern `DEFAULT_*`: `DEFAULT_VELOCITY_THRESHOLDS`, `DEFAULT_KEYBOARD_MIDI_CONFIG`
- Storage keys use kebab-case: `'groovy-debug-mode'`, `'groovy-midi-config'`, `'groovy-theme'`

## Code Style

**Formatting:**
- Prettier configured implicitly (no `.prettierrc` file found, using defaults)
- 2-space indentation (inferred from codebase)
- Semicolons required (TypeScript strict mode enforces)
- Single quotes in most cases, double quotes for JSX attributes
- Line length appears to be ~100 characters (files don't exceed this significantly)

**Linting:**
- ESLint with `@eslint/js` and `typescript-eslint`
- React plugin with hooks recommended rules: `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- TypeScript strict mode enabled: `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- File configuration: `.eslintignore` covers `dist`, `node_modules`, `.vite`

**Import/Export Style:**
- Named exports preferred for utility functions and classes: `export function loadMIDIConfig()`, `export class DrumSynth`
- Export objects for namespaced functionality: `export const ABCTranscoder = { ... }`
- Default exports for React components: `export default function HomePage()`
- Re-exports for barrel files: `export { GrooveEngine, DrumSynth } from './core'` in `src/core/index.ts`

## Import Organization

**Order (consistent across codebase):**
1. External React/library imports: `import { useState } from 'react'`
2. Internal core/type imports: `import { GrooveData, DrumVoice } from '../types'`
3. Utility/helper imports: `import { logger } from '../utils/logger'`
4. Style imports: `import '../styles/midi.css'`
5. Component imports (for page files): `import { DrumGridDark } from '../components/production/DrumGridDark'`

**Path Aliases:**
- Relative imports used throughout (`../types`, `../utils`, `../components`)
- No path aliases configured (no `jsconfig.json` or `tsconfig.json` paths)
- Shallow relative imports preferred: `import from '../types'` not `import from '../../../../types'`

**Example Import Block:**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { GrooveData, DrumVoice, TimeSignature } from '../types';
import { GrooveEngine } from '../core';
import { logger } from '../utils/logger';
import { midiDrumMapping } from '../midi/MIDIDrumMapping';
import '../styles/midi.css';
```

## Error Handling

**Patterns:**
- Try-catch blocks for async operations and external API calls: Used in `DrumSynth.ts` for audio loading
- Graceful degradation: Log errors but continue execution. Example: `GrooveStorage.ts` catches JSON parse errors and returns default
- Error reporting: Use `logger.error()` which always logs (unlike `logger.log()` which respects debug mode)
- Error Boundary for React tree: `ErrorBoundary.tsx` catches component errors and shows fallback UI
- Return objects for error states: `{ success: boolean; error?: string }` pattern in `GrooveStorage.ts`

**Error Handling Examples:**
```typescript
// Pattern 1: Try-catch with graceful fallback
try {
  const response = await fetch(soundPath);
  if (!response.ok) return;
  // process response
} catch (error) {
  logger.warn(`Failed to load sample: ${error}`);
  // continue without this sample
}

// Pattern 2: Return result object with error
const result = safeStorage.setItem(key, value);
if (!result.success) {
  return { success: false, error: 'Storage quota exceeded' };
}

// Pattern 3: Validate before use
try {
  const grooves = loadAllGrooves(); // can throw if invalid JSON
  return grooves;
} catch (error) {
  logger.error('Failed to load grooves:', error);
  return []; // return empty array, not null
}

// Pattern 4: Error Boundary in React
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('ErrorBoundary caught error:', error);
  }
}
```

## Logging

**Framework:** Console logging via custom `Logger` class in `src/utils/logger.ts`

**Patterns:**
- Debug logging: `logger.log()` - only visible when debug mode enabled via UI or localStorage
- Warning logging: `logger.warn()` - debug mode only, for non-critical issues
- Error logging: `logger.error()` - always visible, for critical issues
- Toggle debug mode: Click "Adar Bahar" in About modal, stored in `groovy-debug-mode` localStorage key

**Usage:**
```typescript
import { logger } from '../utils/logger';

logger.log('This is only visible in debug mode');
logger.warn('Something unexpected but not critical');
logger.error('This error is always visible');

// Check if debug is enabled
if (logger.isDebugMode()) {
  // conditional logging
}

// Toggle via code
logger.toggleDebugMode();
```

## Comments

**When to Comment:**
- File headers explain module purpose: Every test file starts with `/** Tests for X */`
- Complex business logic: Commented in `PerformanceTracker.ts` swing-aware quantization
- Non-obvious algorithms: Swing offset calculation in `GrooveEngine.ts` includes explanation
- Avoid redundant comments: If code is clear, no comment needed
- TODO/FIXME comments mark known issues (use sparingly, prefer issues on GitHub)

**JSDoc/TSDoc:**
- Function documentation includes:
  - Purpose: `/** Initialize Web MIDI API access */`
  - Parameters: `@param timeSignature - The time signature`
  - Return types: `@returns Promise<boolean> Success status`
  - Examples in complex functions
- Interface/Type documentation explains intent: `/** MIDI device information */`
- No parameter type tags needed (TypeScript already has types): Use JSDoc for intent only

**Example JSDoc:**
```typescript
/**
 * Analyze a MIDI hit and return performance metrics
 * 
 * @param voice - The drum voice that was hit (e.g., 'kick', 'snare-normal')
 * @param timestamp - Time of the hit (from MIDI event or performance.now())
 * @returns HitAnalysis with accuracy scores 0-100, or null if tracking disabled
 */
function analyzeHit(voice: DrumVoice | null, timestamp: number): HitAnalysis | null {
  // ...
}
```

## Function Design

**Size:**
- Most functions are 5-30 lines
- Complex algorithms broken into private helper methods: `buildOffsetGrid()` helper in `PerformanceTracker.ts`
- Pure functions preferred (no side effects): `createEmptyNotesRecord()`, `getArticulationsByCategory()`
- Single responsibility: Classes and functions do one thing well

**Parameters:**
- Maximum 3-4 parameters; use destructured objects for more: `{ voice, velocity, timestamp }` in `MIDINoteEvent`
- Options/config params as objects: `ABCRenderOptions { staffWidth?, scale?, padding? }`
- No default parameters in function signatures (use in body or let calling code decide)

**Return Values:**
- Explicit return types required (TypeScript strict mode): `string | null`, `HitAnalysis | null`
- Use `null` not `undefined` for "no value": `getVoiceFromNote()` returns `DrumVoice | null`
- Return objects for multiple values: `{ success: boolean; error?: string }`
- Return empty arrays not `null` for collections: `loadPatterns()` returns `CustomPattern[]`

## Module Design

**Exports:**
- Each module exports what it "owns": `MIDIDrumMapping.ts` exports the mapping, not the voices
- Avoid re-exporting everything: `src/core/index.ts` is the only barrel file, re-exports key items
- Class instances as singletons: `export const performanceTracker = new PerformanceTracker()`
- Core modules are framework-agnostic: No React imports in `src/core/`, `src/midi/`, `src/utils/`

**Barrel Files:**
- Only `src/core/index.ts` acts as a barrel file
- Pattern: Re-export all public classes, functions, and types from module subdirectories
- Imports use barrel file: `import { GrooveEngine, DrumSynth } from '../core'`

**Module Separation:**
```
src/core/          # Framework-agnostic logic (GrooveEngine, DrumSynth, ExportUtils)
src/midi/          # MIDI input, mapping, filtering (no React)
src/hooks/         # React hooks wrapping core/midi
src/components/    # React components
src/utils/         # Utilities (logger, storage, analytics)
src/types.ts       # Shared type definitions
```

## React Component Conventions

**Props Pattern:**
```typescript
interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  tempo: number;
  onTempoChange: (tempo: number) => void;
  // Optional props
  isEmbedded?: boolean;
  masterVolume?: number;
}

export function PlaybackControls({
  isPlaying,
  onPlay,
  tempo,
  onTempoChange,
  isEmbedded = false,
}: PlaybackControlsProps) {
  // component body
}
```

**Hook Integration:**
- Hooks imported from `src/hooks/`: `import { useGrooveEngine, useMIDIInput } from '../hooks'`
- Each hook is a separate file: `useGrooveEngine.ts`, `useMIDITracking.ts`, `useMIDIInput.ts`
- Hooks return objects with state and callbacks: `{ config, updateConfig, devices, isConnected }`
- Event handlers inline in component: `onTempoChange={(tempo) => setTempo(tempo)}`

## Type Safety

**Validation:**
- Zod schemas for runtime validation: `SavedGrooveSchema`, `MIDI_CONFIG` validation in storage functions
- Type guards for discriminated unions: `voice === null` checks before using voice
- Exhaustive type checks: TypeScript's `noFallthroughCasesInSwitch` ensures all switch cases covered

**Examples:**
```typescript
// Zod validation
const SavedGrooveSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  tempo: z.number().min(20).max(400),
});

// Type guards
function isValidVoice(voice: string): voice is DrumVoice {
  return ALL_DRUM_VOICES.includes(voice as DrumVoice);
}

// Null checks
const voice = midiDrumMapping.getVoiceFromNote(note);
if (voice) {
  analyzeHit(voice, timestamp);
}
```

---

*Convention analysis: 2026-05-14*
