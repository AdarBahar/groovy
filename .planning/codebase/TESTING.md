# Testing Patterns

**Analysis Date:** 2026-05-14

## Test Framework

**Runner:**
- Vitest v4.0.16
- Config: `vitest.config.ts` (root)
- Environment: Node (headless, no DOM)
- Globals enabled: `describe`, `it`, `expect`, `beforeEach` available without imports

**Assertion Library:**
- Vitest built-in expect API (compatible with Jest)
- No external assertion library needed

**Run Commands:**
```bash
npm run test              # Run all tests once
npm run test:watch       # Run in watch mode (re-run on file changes)
npm run test:ui          # Open Vitest UI dashboard
```

**Test Discovery:**
- Pattern: `src/**/*.test.ts` and `src/**/*.test.tsx`
- Current test files:
  - `src/midi/MIDIDrumMapping.test.ts` (MIDI voice mapping)
  - `src/midi/MIDIHandler.test.ts` (MIDI event parsing)
  - `src/midi/PerformanceTracker.test.ts` (Performance analysis with swing quantization)
  - `src/midi/midi.integration.test.ts` (Integration between MIDI modules)
  - `src/utils/midiStorage.test.ts` (localStorage persistence)

## Test File Organization

**Location:**
- Co-located with source: `src/utils/midiStorage.ts` paired with `src/utils/midiStorage.test.ts`
- Tests in same directory as source files
- Single test file per module

**Naming:**
- Test file suffix: `.test.ts` or `.test.tsx`
- Describe blocks named after module: `describe('PerformanceTracker', () => { ... })`
- Test names are full sentences: `it('returns null when tracking disabled', () => { ... })`

**Directory Structure:**
```
src/
├── midi/
│   ├── MIDIDrumMapping.ts
│   ├── MIDIDrumMapping.test.ts
│   ├── MIDIHandler.ts
│   ├── MIDIHandler.test.ts
│   ├── PerformanceTracker.ts
│   ├── PerformanceTracker.test.ts
│   └── midi.integration.test.ts
├── utils/
│   ├── midiStorage.ts
│   └── midiStorage.test.ts
└── components/
    └── (no tests yet - requires @testing-library/react)
```

## Test Structure

**Suite Organization:**
```typescript
/**
 * Tests for [Module Name]
 * 
 * Verifies [what this module does]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { functionUnderTest } from './module';
import type { TypesNeeded } from './types';

describe('ModuleName', () => {
  // Setup shared state
  let mockData: SomeType;

  // Reset before each test
  beforeEach(() => {
    mockData = createDefaultMockData();
    // Reset module state if needed
    functionUnderTest.reset?.();
  });

  // Group related tests in nested describes
  describe('functionName', () => {
    it('description of expected behavior', () => {
      // Arrange
      const input = prepareInput();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expectedValue);
    });

    it('handles edge case: empty input', () => {
      // test for empty/null/undefined
    });

    it('returns correct type', () => {
      // test return type/structure
    });
  });

  describe('anotherFunction', () => {
    // more tests
  });
});
```

**Example from Codebase:**
```typescript
describe('MIDIDrumMapping', () => {
  beforeEach(() => {
    midiDrumMapping.setKit('TD-17');
  });

  describe('getVoiceFromNote', () => {
    it('returns a DrumVoice for valid MIDI notes', () => {
      const voice = midiDrumMapping.getVoiceFromNote(36);
      expect(voice).toBeTruthy();
      expect(typeof voice === 'string').toBe(true);
    });

    it('returns null for unmapped MIDI notes', () => {
      const voice = midiDrumMapping.getVoiceFromNote(127);
      expect(voice).toBeNull();
    });

    it('maps kick to MIDI note 36', () => {
      const voice = midiDrumMapping.getVoiceFromNote(36);
      expect(voice).toBe('kick');
    });
  });
});
```

## Test Structure Patterns

**Arrange-Act-Assert (AAA):**
```typescript
it('calculates timing accuracy correctly', () => {
  // Arrange: set up test data
  const mockGroove = createMockGroove({ division: 8, tempo: 120 });
  const startTime = performance.now();
  performanceTracker.enable(mockGroove, startTime);

  // Act: call the function
  const result = performanceTracker.analyzeHit('kick', startTime);

  // Assert: verify the result
  expect(result).toBeTruthy();
  expect(result!.timingAccuracy).toBeGreaterThanOrEqual(0);
  expect(result!.timingAccuracy).toBeLessThanOrEqual(100);
});
```

**Setup & Teardown:**
```typescript
beforeEach(() => {
  // Run before EACH test
  performanceTracker.disable();
  performanceTracker.resetStats();
  // Mock localStorage
  mockStorage = {};
  global.localStorage = { ... };
});

// No afterEach in this codebase yet
// (Vitest cleans up automatically in most cases)
```

**Grouping Tests:**
```typescript
describe('PerformanceTracker', () => {
  // Top-level setup
  beforeEach(() => {
    performanceTracker.disable();
  });

  describe('enable/disable', () => {
    it('enables performance tracking with groove', () => { ... });
    it('disables performance tracking', () => { ... });
    it('starts with tracking disabled', () => { ... });
  });

  describe('analyzeHit', () => {
    beforeEach(() => {
      // Additional setup for this group only
      performanceTracker.enable(mockGroove, performance.now());
    });

    it('returns null when tracking disabled', () => { ... });
    it('returns null when voice is null', () => { ... });
    it('analyzes hit with valid voice', () => { ... });
  });
});
```

## Mocking

**Framework:** Vitest built-in `vi` object (compatible with Jest)

**localStorage Mocking Pattern:**
Used in `src/utils/midiStorage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('MIDI Storage', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    global.localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; },
      key: (index: number) => {
        const keys = Object.keys(mockStorage);
        return keys[index] || null;
      },
      length: 0,
    } as any;
  });

  it('persists config to mocked storage', () => {
    saveMIDIConfig(config);
    const stored = localStorage.getItem('groovy-midi-config');
    expect(stored).toBeTruthy();
  });
});
```

**Function Mocking (vi.fn):**
Used in `src/midi/MIDIHandler.test.ts`:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MIDI Handler', () => {
  beforeEach(() => {
    midiHandler.setNoteOnHandler(() => {});
    midiHandler.setNoteOffHandler(() => {});
  });

  describe('Note On messages', () => {
    it('calls noteOn handler when message received', () => {
      const handler = vi.fn();
      midiHandler.setNoteOnHandler(handler);

      const midiData = new Uint8Array([0x90, 60, 100]);
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);
      expect(handler).toHaveBeenCalledWith(60, 100);
    });
  });
});
```

**Mock Data Creation:**
Create helper functions for consistent test data:
```typescript
const mockGroove: GrooveData = {
  division: 8,
  swing: 0,
  timeSignature: { beats: 4, noteValue: 4 },
  tempo: 120,
  measures: [
    {
      notes: {
        'kick': [true, false, true, false, true, false, true, false],
        'snare-normal': [false, true, false, true, false, true, false, true],
        'hihat-closed': [true, true, true, true, true, true, true, true],
      } as any,
    },
  ],
};
```

**What to Mock:**
- localStorage: Always mock to avoid test pollution
- MIDI API events: Mock `MIDIMessageEvent` objects
- Callbacks: Use `vi.fn()` to track calls and arguments
- Date/time: Use `performance.now()` which is available in Node test environment

**What NOT to Mock:**
- Core logic functions: Test them directly, don't mock
- Pure utility functions: Test with real implementation
- Type definitions: Never mock types

## Fixtures and Factories

**Test Data Creation:**
```typescript
// Direct object creation for simple data
const mockGroove: GrooveData = {
  division: 8,
  tempo: 120,
  // ... rest of properties
};

// Spread patterns for variations
const mockGrooveWithSwing = {
  ...mockGroove,
  swing: 50, // Override one property
};

// Factory pattern for complex setup
function createMockGroove(overrides?: Partial<GrooveData>): GrooveData {
  return {
    division: 8,
    tempo: 120,
    swing: 0,
    timeSignature: { beats: 4, noteValue: 4 },
    measures: [{ notes: createEmptyNotesRecord(8) }],
    ...overrides, // Allow customization
  };
}
```

**Location:**
- Test fixtures defined at top of test file or in `beforeEach`
- No separate fixtures directory (keep tests self-contained)
- Reusable mocks kept in test file with comment: `// Mock GrooveData with swing-aware configuration`

## Coverage

**Requirements:**
- No coverage threshold enforced in `vitest.config.ts`
- No coverage reports generated (no `npm run test:coverage` script)

**Current State:**
- Tests exist for core MIDI logic: `MIDIDrumMapping`, `MIDIHandler`, `PerformanceTracker`
- Tests for utils: `midiStorage` localStorage tests
- Integration tests: `midi.integration.test.ts` tests module interaction
- **Gap:** No React component tests (would require `@testing-library/react`)

**View Coverage:**
```bash
# To enable coverage (not currently configured):
# Add to vitest.config.ts:
# coverage: { provider: 'v8' }
# Then run:
npm run test -- --coverage
```

## Test Types

**Unit Tests:**
- Scope: Single function or class method
- Pattern: Test input → output
- Examples:
  - `MIDIDrumMapping.test.ts`: Tests mapping logic in isolation
  - `midiStorage.test.ts`: Tests localStorage load/save/clear operations
  - `PerformanceTracker.test.ts`: Tests performance analysis calculations
- Approach: Mock external dependencies, focus on the function's behavior

**Integration Tests:**
- Scope: Multiple modules working together
- Pattern: Arrange module interactions, verify end-to-end behavior
- Examples:
  - `midi.integration.test.ts`: Tests MIDI message → DrumVoice mapping chain
- Approach: Use real module implementations, mock only external APIs (like localStorage)

**E2E Tests:**
- Framework: Not used
- No end-to-end test suite for full application flow
- Would require browser environment (Playwright, Cypress)

## Common Patterns

**Async Testing:**
```typescript
it('loads groove from storage asynchronously', async () => {
  // Vitest supports async test functions
  const result = await loadGrooveAsync(id);
  expect(result).toBeTruthy();
});

// For MIDI-based timing tests:
it('analyzes hit with realistic timing', () => {
  performanceTracker.enable(mockGroove, performance.now());
  
  // Simulate timing (millisecond delay)
  const startTime = performance.now();
  const hitTime = startTime + 10; // 10ms later
  
  const result = performanceTracker.analyzeHit('kick', hitTime);
  expect(result!.timingErrorMs).toBeCloseTo(10, 1); // Within 1ms
});
```

**Error Testing:**
```typescript
// Test error handling
it('handles corrupted localStorage gracefully', () => {
  localStorage.setItem('groovy-midi-config', 'invalid-json-{]');
  
  const config = loadMIDIConfig();
  
  // Should return default config instead of crashing
  expect(config).toEqual(DEFAULT_MIDI_CONFIG);
});

// Test null/undefined handling
it('returns null when voice is null', () => {
  const result = performanceTracker.analyzeHit(null, performance.now());
  expect(result).toBeNull();
});

// Test boundary conditions
it('handles minimum velocity (1)', () => {
  const filter = new VelocityFilter();
  expect(filter.isValid('kick', 1)).toBe(true); // Global minimum is 1
});

it('rejects zero velocity', () => {
  const filter = new VelocityFilter();
  expect(filter.isValid('kick', 0)).toBe(false);
});
```

**Spying on Methods:**
```typescript
it('tracks statistics across multiple hits', () => {
  performanceTracker.enable(mockGroove, performance.now());
  
  performanceTracker.analyzeHit('kick', performance.now());
  performanceTracker.analyzeHit('snare-normal', performance.now());
  
  const stats = performanceTracker.getStats();
  expect(stats.totalHits).toBe(2);
});
```

**State Management Testing:**
```typescript
describe('enable/disable state', () => {
  it('starts with tracking disabled', () => {
    expect(performanceTracker.isEnabled()).toBe(false);
  });

  it('enables and disables correctly', () => {
    performanceTracker.enable(mockGroove, performance.now());
    expect(performanceTracker.isEnabled()).toBe(true);
    
    performanceTracker.disable();
    expect(performanceTracker.isEnabled()).toBe(false);
  });
});
```

## Test Execution

**Running Tests:**
```bash
# Run all tests
npm run test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run specific test file
npm run test -- MIDIDrumMapping.test.ts

# Run with UI dashboard
npm run test:ui

# Run with verbose output
npm run test -- --reporter=verbose
```

**Expected Output:**
Tests should pass in CI/CD. Current test count: 93 total tests across 5 test files.

## Testing Best Practices

**Do:**
- Use descriptive test names: `it('returns null when tracking disabled', () => { ... })`
- Arrange-Act-Assert pattern for clarity
- Reset state in `beforeEach` to isolate tests
- Mock external dependencies (localStorage, MIDI events)
- Test edge cases (null, empty, boundary values)
- Group related tests with `describe` blocks
- Use meaningful assertion messages

**Don't:**
- Test implementation details (mock internal calls unnecessarily)
- Rely on test execution order (each test should be independent)
- Create circular test dependencies
- Test framework features (Vitest, expect) themselves
- Skip testing error paths
- Use `any` type in test code (defeats TypeScript safety)

---

*Testing analysis: 2026-05-14*
