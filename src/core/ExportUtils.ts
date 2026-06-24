/**
 * Re-export shim — all export logic lives in src/core/exporters/.
 * This file preserves the original import path for existing callers.
 */
export type {
  ExportProgress,
  ExportFormat,
  JSONExportOptions,
  ImageExportOptions,
  AudioExportOptions,
  ExportMetadata,
} from './exporters';
export {
  yieldToMain,
  sanitizeSVG,
  escapeXml,
  generateFilename,
  triggerDownload,
  isFormatSupported,
  getFormatInfo,
  ALL_EXPORT_FORMATS,
  exportToJSON,
  downloadAsJSON,
  generateSheetMusicSVG,
  exportToSVG,
  downloadAsSVG,
  exportToPNG,
  downloadAsPNG,
  exportToPDF,
  downloadAsPDF,
  DRUM_SAMPLE_FILES,
  exportToMIDI,
  downloadAsMIDI,
  exportToMP3,
  downloadAsMP3,
} from './exporters';
