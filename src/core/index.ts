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

// ABC Notation
export { ABCTranscoder, grooveToABC, hasHandsNotes, hasFeetNotes } from './ABCTranscoder';
export type { ABCTranscoderOptions } from './ABCTranscoder';
export {
  ABC_SYMBOLS,
  ABC_DECORATIONS,
  URL_TAB_CHARS,
  HANDS_VOICES,
  FEET_VOICES,
  ABC_BOILERPLATE,
  ABC_REST,
  generateABCHeader,
  getNoteDurationSuffix,
  isTripletDivision,
} from './ABCConstants';

// ABC Rendering
export { ABCRenderer, renderABC, renderABCToString, clearRenderedABC } from './ABCRenderer';
export type { ABCRenderOptions, ABCRenderResult } from './ABCRenderer';

// URL Encoding
export {
  GrooveURLCodec,
  encodeGrooveToURL,
  decodeURLToGroove,
  getShareableURL,
  getShareableURLWithValidation,
  canShareGroove,
  validateURLLength,
  hasGrooveParams,
  URL_LENGTH_LIMITS,
} from './GrooveURLCodec';
export type { URLValidationResult } from './GrooveURLCodec';

// Export Utilities
export {
  exportToJSON,
  downloadAsJSON,
  exportToSVG,
  downloadAsSVG,
  exportToPNG,
  downloadAsPNG,
  exportToPDF,
  downloadAsPDF,
  exportToMIDI,
  downloadAsMIDI,
  exportToMP3,
  downloadAsMP3,
  generateSheetMusicSVG,
  triggerDownload,
  generateFilename,
  isFormatSupported,
  getFormatInfo,
  ALL_EXPORT_FORMATS,
} from './ExportUtils';
export type { ExportFormat, JSONExportOptions, ImageExportOptions, AudioExportOptions, ExportMetadata } from './ExportUtils';

// Groove Storage (My Grooves persistence)
export {
  saveGroove,
  loadAllGrooves,
  loadGrooveById,
  decodeGroove,
  deleteGroove,
  clearAllGrooves,
  grooveNameExists,
  exportGrooves,
} from './GrooveStorage';
export type { SavedGroove, SaveResult } from './GrooveStorage';
