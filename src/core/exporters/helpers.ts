/**
 * Shared helpers for export modules:
 * progress types, lazy-loader caches, yieldToMain, sanitizeSVG, escapeXml,
 * generateFilename, triggerDownload, isFormatSupported, getFormatInfo, ALL_EXPORT_FORMATS.
 */

import DOMPurify from 'dompurify';
import { GrooveData } from '../../types';

// ==========================================================================
// Types
// ==========================================================================

export interface ExportProgress {
  stage: 'preparing' | 'generating' | 'rendering' | 'encoding' | 'finalizing';
  percent: number;
  message?: string;
}

export type ExportFormat = 'json' | 'midi' | 'pdf' | 'png' | 'svg' | 'wav' | 'mp3';

export interface JSONExportOptions {
  includeMetadata?: boolean;
  prettyPrint?: boolean;
}

export interface ImageExportOptions {
  /** Width in pixels (default: 800) */
  width?: number;
  /** Include title header (default: true) */
  includeHeader?: boolean;
  /** Include metadata (tempo, time signature) (default: true) */
  includeMetadata?: boolean;
  /** Background color (default: white) */
  backgroundColor?: string;
}

export interface AudioExportOptions {
  /** Number of times to loop the groove (default: 1) */
  loops?: number;
}

export interface ExportMetadata {
  version: string;
  exportedAt: string;
  appName: string;
}

// ==========================================================================
// Lazy-load caches
// ==========================================================================

let jsPDFModule: typeof import('jspdf') | null = null;
let QRCodeModule: typeof import('qrcode') | null = null;
let MidiWriterModule: typeof import('midi-writer-js') | null = null;
let LamejsModule: typeof import('@breezystack/lamejs') | null = null;

export async function getJsPDF() {
  if (!jsPDFModule) {
    jsPDFModule = await import('jspdf');
  }
  return jsPDFModule.jsPDF;
}

export async function getQRCode() {
  if (!QRCodeModule) {
    QRCodeModule = await import('qrcode');
  }
  return QRCodeModule;
}

export async function getMidiWriter() {
  if (!MidiWriterModule) {
    MidiWriterModule = await import('midi-writer-js');
  }
  return MidiWriterModule.default;
}

export async function getMp3Encoder() {
  if (!LamejsModule) {
    LamejsModule = await import('@breezystack/lamejs');
  }
  return LamejsModule.Mp3Encoder;
}

// ==========================================================================
// Utilities
// ==========================================================================

/**
 * Yield to the main thread to keep UI responsive during heavy exports.
 * Uses requestIdleCallback when available, falls back to setTimeout.
 */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => resolve(), { timeout: 50 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Sanitize SVG content using DOMPurify to remove potentially dangerous elements.
 */
export function sanitizeSVG(svgContent: string): string {
  return DOMPurify.sanitize(svgContent, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use'],
    ADD_ATTR: ['xlink:href'],
  });
}

/**
 * Escape XML special characters for safe embedding in SVG/XML output.
 *
 * Security notes:
 * - Converts raw text to XML-safe text entities
 * - Does NOT remove all special characters, only escapes them
 * - Result is safe to embed in SVG text elements
 * - NOT suitable for use outside of XML/SVG contexts
 */
export function escapeXml(str: string): string {
  if (!str || typeof str !== 'string') return '';

  return str
    // Remove null bytes and control characters (except tab, newline, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Escape backticks to prevent template literal injection
    .replace(/`/g, '&#96;');
}

/**
 * Generate a sanitized filename for the given groove and format.
 */
export function generateFilename(groove: GrooveData, format: ExportFormat): string {
  const baseName = groove.title?.trim() || 'groove';
  const sanitized = baseName.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
  return `${sanitized}.${format}`;
}

/**
 * Trigger a file download in the browser.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Check if a format is currently supported.
 */
export function isFormatSupported(format: ExportFormat): boolean {
  const supportedFormats: ExportFormat[] = ['json', 'pdf', 'png', 'svg', 'midi', 'mp3'];
  return supportedFormats.includes(format);
}

/**
 * Get display information for an export format.
 */
export function getFormatInfo(format: ExportFormat): {
  label: string;
  description: string;
  extension: string;
  supported: boolean;
} {
  const formats: Record<ExportFormat, { label: string; description: string; extension: string }> = {
    json: { label: 'JSON', description: 'Groovy project file - can be imported back into Groovy', extension: '.json' },
    midi: { label: 'MIDI', description: 'Standard MIDI file - import into DAWs like Ableton, Logic, FL Studio', extension: '.mid' },
    pdf: { label: 'PDF', description: 'Print-ready sheet music document', extension: '.pdf' },
    png: { label: 'PNG Image', description: 'High-quality image of the drum grid', extension: '.png' },
    svg: { label: 'SVG Image', description: 'Scalable vector image of the drum grid', extension: '.svg' },
    wav: { label: 'WAV Audio', description: 'Uncompressed audio file of the pattern', extension: '.wav' },
    mp3: { label: 'MP3 Audio', description: 'Compressed audio file of the pattern', extension: '.mp3' },
  };

  return { ...formats[format], supported: isFormatSupported(format) };
}

/** All available export formats */
export const ALL_EXPORT_FORMATS: ExportFormat[] = ['json', 'midi', 'pdf', 'png', 'svg', 'wav', 'mp3'];
