/**
 * Export utilities for Groovy
 * Handles file generation and download for various formats
 */

import { GrooveData } from '../types';

/** Export format types */
export type ExportFormat = 'json' | 'midi' | 'pdf' | 'png' | 'svg' | 'wav' | 'mp3';

/** JSON export options */
export interface JSONExportOptions {
  includeMetadata?: boolean;
  prettyPrint?: boolean;
}

/** Export file metadata */
export interface ExportMetadata {
  version: string;
  exportedAt: string;
  appName: string;
}

/**
 * Generate a filename for the export
 */
export function generateFilename(groove: GrooveData, format: ExportFormat): string {
  const baseName = groove.title?.trim() || 'groove';
  // Sanitize filename: remove special characters
  const sanitized = baseName.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
  return `${sanitized}.${format}`;
}

/**
 * Trigger a file download in the browser
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
 * Export groove data as JSON
 */
export function exportToJSON(
  groove: GrooveData,
  options: JSONExportOptions = {}
): Blob {
  const { includeMetadata = true, prettyPrint = true } = options;

  const exportData: { groove: GrooveData; metadata?: ExportMetadata } = {
    groove,
  };

  if (includeMetadata) {
    exportData.metadata = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'Groovy',
    };
  }

  const jsonString = prettyPrint
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData);

  return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Download groove as JSON file
 */
export function downloadAsJSON(
  groove: GrooveData,
  options: JSONExportOptions = {}
): void {
  const blob = exportToJSON(groove, options);
  const filename = generateFilename(groove, 'json');
  triggerDownload(blob, filename);
}

/**
 * Check if a format is currently supported
 */
export function isFormatSupported(format: ExportFormat): boolean {
  // Currently only JSON is fully implemented
  return format === 'json';
}

/**
 * Get format display information
 */
export function getFormatInfo(format: ExportFormat): {
  label: string;
  description: string;
  extension: string;
  supported: boolean;
} {
  const formats: Record<ExportFormat, { label: string; description: string; extension: string }> = {
    json: {
      label: 'JSON',
      description: 'Groovy project file - can be imported back into Groovy',
      extension: '.json',
    },
    midi: {
      label: 'MIDI',
      description: 'Standard MIDI file - import into DAWs like Ableton, Logic, FL Studio',
      extension: '.mid',
    },
    pdf: {
      label: 'PDF',
      description: 'Print-ready sheet music document',
      extension: '.pdf',
    },
    png: {
      label: 'PNG Image',
      description: 'High-quality image of the drum grid',
      extension: '.png',
    },
    svg: {
      label: 'SVG Image',
      description: 'Scalable vector image of the drum grid',
      extension: '.svg',
    },
    wav: {
      label: 'WAV Audio',
      description: 'Uncompressed audio file of the pattern',
      extension: '.wav',
    },
    mp3: {
      label: 'MP3 Audio',
      description: 'Compressed audio file of the pattern',
      extension: '.mp3',
    },
  };

  return {
    ...formats[format],
    supported: isFormatSupported(format),
  };
}

/** All available export formats */
export const ALL_EXPORT_FORMATS: ExportFormat[] = ['json', 'midi', 'pdf', 'png', 'svg', 'wav', 'mp3'];

