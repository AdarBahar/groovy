/**
 * Core Groovy Engine
 * 
 * This module contains all the core logic for drum playback, timing, and audio synthesis.
 * It is completely UI-agnostic and can be used with any framework (React, Vue, Svelte, etc.)
 * or even vanilla JavaScript.
 * 
 * Key principles:
 * - No UI dependencies (no React, no DOM manipulation)
 * - Event-based communication (observer pattern)
 * - Pure TypeScript/JavaScript
 * - Framework-agnostic
 */

export { GrooveEngine } from './GrooveEngine';
export type { GrooveEngineEvents, SyncMode } from './GrooveEngine';
export { DrumSynth } from './DrumSynth';
export { GrooveUtils } from './GrooveUtils';
export { ARTICULATION_CONFIG, getArticulationMeta, getArticulationsByCategory } from './ArticulationConfig';
export type { ArticulationMeta, InstrumentCategory } from './ArticulationConfig';
export { HI_HAT_PATTERNS, SNARE_PATTERNS, KICK_PATTERNS } from './BulkPatterns';
export type { BulkPattern } from './BulkPatterns';
export { PatternManager } from './PatternManager';
export type { CustomPattern } from './PatternManager';

