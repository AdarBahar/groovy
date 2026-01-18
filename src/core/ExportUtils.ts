/**
 * Export utilities for Groovy
 * Handles file generation and download for various formats
 *
 * NOTE: Heavy dependencies (jspdf, midi-writer-js, lamejs, qrcode) are
 * dynamically imported to reduce initial bundle size. They are only loaded
 * when the user actually triggers an export.
 */

import DOMPurify from 'dompurify';
import { GrooveData, DrumVoice, ALL_DRUM_VOICES, getFlattenedNotes } from '../types';
import { grooveToABC } from './ABCTranscoder';
import { renderABC } from './ABCRenderer';
import { getShareableURL } from './GrooveURLCodec';
import { GrooveUtils } from './GrooveUtils';

// Lazy-loaded heavy dependencies (loaded on demand)
// These are dynamically imported to reduce initial bundle size
let jsPDFModule: typeof import('jspdf') | null = null;
let QRCodeModule: typeof import('qrcode') | null = null;
let MidiWriterModule: typeof import('midi-writer-js') | null = null;
let LamejsModule: typeof import('@breezystack/lamejs') | null = null;

async function getJsPDF() {
  if (!jsPDFModule) {
    jsPDFModule = await import('jspdf');
  }
  return jsPDFModule.jsPDF;
}

async function getQRCode() {
  if (!QRCodeModule) {
    QRCodeModule = await import('qrcode');
  }
  return QRCodeModule;
}

async function getMidiWriter() {
  if (!MidiWriterModule) {
    MidiWriterModule = await import('midi-writer-js');
  }
  return MidiWriterModule.default;
}

async function getMp3Encoder() {
  if (!LamejsModule) {
    LamejsModule = await import('@breezystack/lamejs');
  }
  return LamejsModule.Mp3Encoder;
}

/** Export format types */
export type ExportFormat = 'json' | 'midi' | 'pdf' | 'png' | 'svg' | 'wav' | 'mp3';

/** JSON export options */
export interface JSONExportOptions {
  includeMetadata?: boolean;
  prettyPrint?: boolean;
}

/** Image export options */
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

/** Audio/MIDI export options */
export interface AudioExportOptions {
  /** Number of times to loop the groove (default: 1) */
  loops?: number;
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
 * Generate the sheet music SVG content only (without header/footer)
 * Returns sanitized SVG content
 */
function renderSheetMusicToSVG(groove: GrooveData, width: number): string {
  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = `${width}px`;
  document.body.appendChild(container);

  try {
    // Generate ABC notation and render to SVG (no title - we add it in header)
    const abc = grooveToABC(groove, { title: undefined });
    renderABC(abc, container, {
      staffWidth: width - 40,
      scale: 1.0,
      responsive: false,
      padding: 20,
      foregroundColor: '#000000',
    });

    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      throw new Error('Failed to generate SVG');
    }

    // Sanitize the SVG content before returning
    return sanitizeSVG(svgElement.outerHTML);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generate complete SVG document with header, sheet music, and footer
 * Matches the print preview structure: title, metadata, sheet music, QR code, URL
 */
export async function generateSheetMusicSVG(
  groove: GrooveData,
  options: ImageExportOptions = {}
): Promise<string> {
  const { width = 800 } = options;
  const shareableURL = getShareableURL(groove);

  // Generate sheet music SVG
  const sheetMusicSVG = renderSheetMusicToSVG(groove, width);

  // Generate QR code as data URL (lazy load qrcode library)
  const QRCode = await getQRCode();
  const qrDataURL = await QRCode.toDataURL(shareableURL, {
    width: 64,
    margin: 0,
    color: { dark: '#000000', light: '#ffffff' },
  });

  // Parse the sheet music SVG to get dimensions
  const parser = new DOMParser();
  const sheetDoc = parser.parseFromString(sheetMusicSVG, 'image/svg+xml');
  const sheetSvg = sheetDoc.querySelector('svg');
  const sheetHeight = sheetSvg ? parseFloat(sheetSvg.getAttribute('height') || '200') : 200;

  // Calculate total dimensions
  const headerHeight = 60;
  const footerHeight = 90;
  const padding = 20;
  const totalHeight = headerHeight + sheetHeight + footerHeight + padding * 2;

  // Build metadata text
  const metaItems = [
    `Tempo: ${groove.tempo} BPM`,
    `Time: ${groove.timeSignature.beats}/${groove.timeSignature.noteValue}`,
    `Measures: ${groove.measures.length}`,
  ];
  if (groove.author) metaItems.push(`Author: ${groove.author}`);

  // Create the complete SVG document
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
  <defs>
    <style>
      .title { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 700; fill: #1e293b; }
      .meta { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: #64748b; }
      .url { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: #64748b; }
      .branding { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: #94a3b8; }
      .divider { stroke: #e2e8f0; stroke-width: 1; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="white"/>

  <!-- Header -->
  <text x="${padding}" y="${padding + 24}" class="title">${escapeXml(groove.title || 'Untitled Groove')}</text>
  <text x="${padding}" y="${padding + 45}" class="meta">${metaItems.join('  •  ')}</text>
  <line x1="${padding}" y1="${headerHeight}" x2="${width - padding}" y2="${headerHeight}" class="divider"/>

  <!-- Sheet Music -->
  <g transform="translate(0, ${headerHeight})">
    ${sheetMusicSVG.replace(/<\?xml[^?]*\?>/, '').replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}
  </g>

  <!-- Footer -->
  <line x1="${padding}" y1="${headerHeight + sheetHeight + padding}" x2="${width - padding}" y2="${headerHeight + sheetHeight + padding}" class="divider"/>
  <g transform="translate(${padding}, ${headerHeight + sheetHeight + padding + 10})">
    <!-- QR Code -->
    <image x="0" y="0" width="64" height="64" xlink:href="${qrDataURL}"/>
    <!-- URL Text -->
    <text x="80" y="20" class="url">${escapeXml(shareableURL.substring(0, 80))}</text>
    ${shareableURL.length > 80 ? `<text x="80" y="35" class="url">${escapeXml(shareableURL.substring(80, 160))}</text>` : ''}
    <!-- Branding -->
    <text x="${width - padding * 2 - 120}" y="40" class="branding">Created with Groovy</text>
  </g>
</svg>`;

  return svg;
}

/**
 * Helper to escape XML special characters
 * Handles all XML special chars plus control characters that could cause issues
 */
function escapeXml(str: string): string {
  if (!str || typeof str !== 'string') return '';

  return str
    // Remove null bytes and control characters (except tab, newline, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Escape XML special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Escape backticks to prevent template literal injection
    .replace(/`/g, '&#96;');
}

/**
 * Sanitize SVG content using DOMPurify
 * Removes potentially dangerous elements and attributes
 */
function sanitizeSVG(svgContent: string): string {
  return DOMPurify.sanitize(svgContent, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use'],
    ADD_ATTR: ['xlink:href'],
  });
}

/**
 * Export groove as SVG file
 */
export async function exportToSVG(groove: GrooveData, options: ImageExportOptions = {}): Promise<Blob> {
  const svgString = await generateSheetMusicSVG(groove, options);
  return new Blob([svgString], { type: 'image/svg+xml' });
}

/**
 * Download groove as SVG file
 */
export async function downloadAsSVG(groove: GrooveData, options: ImageExportOptions = {}): Promise<void> {
  const blob = await exportToSVG(groove, options);
  const filename = generateFilename(groove, 'svg');
  triggerDownload(blob, filename);
}

/**
 * Export groove as PNG file
 */
export async function exportToPNG(
  groove: GrooveData,
  options: ImageExportOptions = {}
): Promise<Blob> {
  const { backgroundColor = '#ffffff' } = options;
  const svgString = await generateSheetMusicSVG(groove, options);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Create canvas with appropriate dimensions
      const canvas = document.createElement('canvas');
      const scale = 2; // 2x for higher resolution
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scale for higher resolution
      ctx.scale(scale, scale);

      // Draw the SVG image
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(url);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        },
        'image/png',
        1.0
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG for PNG conversion'));
    };

    img.src = url;
  });
}

/**
 * Download groove as PNG file
 */
export async function downloadAsPNG(
  groove: GrooveData,
  options: ImageExportOptions = {}
): Promise<void> {
  const blob = await exportToPNG(groove, options);
  const filename = generateFilename(groove, 'png');
  triggerDownload(blob, filename);
}

/**
 * Export groove as PDF file
 * Uses the complete SVG (with header, sheet music, footer, QR code, URL)
 */
export async function exportToPDF(
  groove: GrooveData,
  options: ImageExportOptions = {}
): Promise<Blob> {
  // Generate the complete SVG with all elements
  const svgString = await generateSheetMusicSVG(groove, options);

  // Lazy load jsPDF
  const jsPDF = await getJsPDF();

  // Create PDF document (A4 size, landscape for better fit)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 30;

  // Convert SVG to image and add to PDF
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Calculate scaling to fit page
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;
      const scale = Math.min(availableWidth / img.width, availableHeight / img.height, 1.5);
      const imgWidth = img.width * scale;
      const imgHeight = img.height * scale;

      // Center the image
      const xPos = (pageWidth - imgWidth) / 2;
      const yPos = (pageHeight - imgHeight) / 2;

      // Create canvas to convert SVG to data URL (2x for quality)
      const canvas = document.createElement('canvas');
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(url);

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);

      // Return as blob
      const pdfBlob = pdf.output('blob');
      resolve(pdfBlob);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG for PDF conversion'));
    };

    img.src = url;
  });
}

/**
 * Download groove as PDF file
 */
export async function downloadAsPDF(
  groove: GrooveData,
  options: ImageExportOptions = {}
): Promise<void> {
  const blob = await exportToPDF(groove, options);
  const filename = generateFilename(groove, 'pdf');
  triggerDownload(blob, filename);
}

// ============================================================================
// MIDI Export
// ============================================================================

/**
 * General MIDI drum note mapping
 * Channel 10 (index 9) is the standard drum channel
 */
const DRUM_VOICE_TO_MIDI: Record<DrumVoice, number> = {
  // Hi-Hat variations
  'hihat-closed': 42, // Closed Hi-Hat
  'hihat-open': 46, // Open Hi-Hat
  'hihat-accent': 42, // Closed Hi-Hat (with higher velocity)
  'hihat-foot': 44, // Pedal Hi-Hat
  'hihat-metronome-normal': 37, // Side Stick (as metronome click)
  'hihat-metronome-accent': 37, // Side Stick (as metronome accent)
  'hihat-cross': 42, // Closed Hi-Hat
  // Snare variations
  'snare-normal': 38, // Acoustic Snare
  'snare-accent': 38, // Acoustic Snare (with higher velocity)
  'snare-ghost': 38, // Acoustic Snare (with lower velocity)
  'snare-cross-stick': 37, // Side Stick
  'snare-flam': 38, // Acoustic Snare
  'snare-rim': 37, // Side Stick
  'snare-drag': 38, // Acoustic Snare
  'snare-buzz': 38, // Acoustic Snare
  // Kick
  kick: 36, // Bass Drum 1
  // Toms
  'tom-rack': 48, // Hi-Mid Tom
  'tom-floor': 43, // Low Floor Tom
  'tom-10': 45, // Low Tom
  'tom-16': 41, // Low Floor Tom
  // Cymbals
  crash: 49, // Crash Cymbal 1
  ride: 51, // Ride Cymbal 1
  'ride-bell': 53, // Ride Bell
  // Percussion
  cowbell: 56, // Cowbell
  stacker: 52, // Chinese Cymbal (closest to stacker)
};

/**
 * Get velocity for drum voice (0-127)
 */
function getVelocityForVoice(voice: DrumVoice): number {
  if (voice.includes('ghost')) return 50;
  if (voice.includes('accent')) return 120;
  if (voice.includes('metronome')) return 80;
  return 100;
}

/**
 * Export groove as MIDI file
 */
export async function exportToMIDI(
  groove: GrooveData,
  options: AudioExportOptions = {}
): Promise<Blob> {
  const { loops = 1 } = options;

  // Lazy load midi-writer-js
  const MidiWriter = await getMidiWriter();

  // Create a new MIDI track
  const track = new MidiWriter.Track();

  // Set tempo
  track.setTempo(groove.tempo);

  // Set time signature (4 args: numerator, denominator, midiclockspertick, notespermidiclock)
  // Standard values: 24 MIDI clocks per tick, 8 32nd notes per quarter note
  track.setTimeSignature(groove.timeSignature.beats, groove.timeSignature.noteValue, 24, 8);

  // Calculate tick duration for one subdivision
  // MIDI uses 128 ticks per beat by default in midi-writer-js
  const ticksPerBeat = 128;
  const ticksPerSubdivision = (ticksPerBeat * 4) / groove.division;

  // Get flattened notes for processing
  const flatNotes = getFlattenedNotes(groove);
  const totalPositions = GrooveUtils.getTotalPositions(groove);

  // Add notes for each loop
  for (let loop = 0; loop < loops; loop++) {
    for (let pos = 0; pos < totalPositions; pos++) {
      const absoluteTick = (loop * totalPositions + pos) * ticksPerSubdivision;

      // Check each voice for notes at this position
      ALL_DRUM_VOICES.forEach((voice) => {
        if (flatNotes[voice]?.[pos]) {
          // Skip metronome voices in export
          if (voice.includes('metronome')) return;

          const midiNote = DRUM_VOICE_TO_MIDI[voice];
          const velocity = getVelocityForVoice(voice);

          track.addEvent(
            new MidiWriter.NoteEvent({
              pitch: [midiNote],
              duration: 'T' + ticksPerSubdivision, // Duration in ticks
              velocity: velocity,
              startTick: absoluteTick,
              channel: 10, // Drum channel
            })
          );
        }
      });
    }
  }

  // Create the MIDI file
  const writer = new MidiWriter.Writer([track]);
  const midiData = writer.buildFile();

  return new Blob([midiData], { type: 'audio/midi' });
}

/**
 * Download groove as MIDI file
 */
export async function downloadAsMIDI(
  groove: GrooveData,
  options: AudioExportOptions = {}
): Promise<void> {
  const blob = await exportToMIDI(groove, options);
  const filename = generateFilename(groove, 'midi');
  triggerDownload(blob, filename);
}

// ============================================================================
// MP3 Export
// ============================================================================

// Map drum voices to sample file paths
const DRUM_SAMPLE_FILES: Record<DrumVoice, string> = {
  'hihat-closed': 'Hi Hat Normal.mp3',
  'hihat-open': 'Hi Hat Open.mp3',
  'hihat-accent': 'Hi Hat Accent.mp3',
  'hihat-foot': 'Hi Hat Foot.mp3',
  'hihat-metronome-normal': 'metronomeClick.mp3',
  'hihat-metronome-accent': 'metronome1Count.mp3',
  'hihat-cross': 'Hi Hat Normal.mp3',
  'snare-normal': 'Snare Normal.mp3',
  'snare-accent': 'Snare Accent.mp3',
  'snare-ghost': 'Snare Ghost.mp3',
  'snare-cross-stick': 'Snare Cross Stick.mp3',
  'snare-flam': 'Snare Flam.mp3',
  'snare-rim': 'Rim.mp3',
  'snare-drag': 'Drag.mp3',
  'snare-buzz': 'Buzz.mp3',
  kick: 'Kick.mp3',
  'tom-rack': 'Rack Tom.mp3',
  'tom-floor': 'Floor Tom.mp3',
  'tom-10': '10 Tom.mp3',
  'tom-16': '16 Tom.mp3',
  crash: 'Crash.mp3',
  ride: 'Ride.mp3',
  'ride-bell': 'Bell.mp3',
  cowbell: 'Cowbell.mp3',
  stacker: 'Stacker.mp3',
};

/**
 * Load audio samples for offline rendering
 */
async function loadSamplesForOffline(
  offlineCtx: OfflineAudioContext
): Promise<Map<DrumVoice, AudioBuffer>> {
  const samples = new Map<DrumVoice, AudioBuffer>();
  const basePath = import.meta.env.BASE_URL || '/';

  await Promise.all(
    ALL_DRUM_VOICES.map(async (voice) => {
      // Skip metronome voices for export
      if (voice.includes('metronome')) return;

      const fileName = DRUM_SAMPLE_FILES[voice];
      const soundPath = `${basePath}sounds/${fileName}`;

      try {
        const response = await fetch(soundPath);
        if (!response.ok) return;

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
        samples.set(voice, audioBuffer);
      } catch {
        console.warn(`Failed to load sample for ${voice}`);
      }
    })
  );

  return samples;
}

/**
 * Export groove as MP3 file
 */
export async function exportToMP3(
  groove: GrooveData,
  options: AudioExportOptions = {}
): Promise<Blob> {
  const { loops = 1 } = options;

  // Calculate duration
  const beatDuration = 60 / groove.tempo;
  const noteDuration = beatDuration / (groove.division / 4);
  const totalPositions = GrooveUtils.getTotalPositions(groove);
  const loopDuration = totalPositions * noteDuration;
  const totalDuration = loopDuration * loops + 2; // +2s for sample tails

  // Create offline audio context (stereo, 44.1kHz)
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * totalDuration, sampleRate);

  // Load samples
  const samples = await loadSamplesForOffline(offlineCtx);

  // Get flattened notes
  const flatNotes = getFlattenedNotes(groove);

  // Schedule all notes
  for (let loop = 0; loop < loops; loop++) {
    for (let pos = 0; pos < totalPositions; pos++) {
      const time = (loop * totalPositions + pos) * noteDuration;

      ALL_DRUM_VOICES.forEach((voice) => {
        if (flatNotes[voice]?.[pos] && !voice.includes('metronome')) {
          const sample = samples.get(voice);
          if (!sample) return;

          const source = offlineCtx.createBufferSource();
          source.buffer = sample;

          const gainNode = offlineCtx.createGain();
          gainNode.gain.value = getVelocityForVoice(voice) / 127;

          source.connect(gainNode);
          gainNode.connect(offlineCtx.destination);
          source.start(time);
        }
      });
    }
  }

  // Render audio
  const renderedBuffer = await offlineCtx.startRendering();

  // Lazy load lamejs and encode to MP3
  const Mp3Encoder = await getMp3Encoder();
  const mp3encoder = new Mp3Encoder(2, sampleRate, 128);

  const leftChannel = renderedBuffer.getChannelData(0);
  const rightChannel = renderedBuffer.getChannelData(1);

  // Convert float32 to int16
  const sampleBlockSize = 1152;
  const mp3Data: Uint8Array[] = [];

  for (let i = 0; i < leftChannel.length; i += sampleBlockSize) {
    const leftChunk = leftChannel.subarray(i, i + sampleBlockSize);
    const rightChunk = rightChannel.subarray(i, i + sampleBlockSize);

    const leftInt16 = new Int16Array(leftChunk.length);
    const rightInt16 = new Int16Array(rightChunk.length);

    for (let j = 0; j < leftChunk.length; j++) {
      leftInt16[j] = Math.max(-32768, Math.min(32767, leftChunk[j] * 32767));
      rightInt16[j] = Math.max(-32768, Math.min(32767, rightChunk[j] * 32767));
    }

    const mp3buf = mp3encoder.encodeBuffer(leftInt16, rightInt16);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  // Flush remaining data
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Download groove as MP3 file
 */
export async function downloadAsMP3(
  groove: GrooveData,
  options: AudioExportOptions = {}
): Promise<void> {
  const blob = await exportToMP3(groove, options);
  const filename = generateFilename(groove, 'mp3');
  triggerDownload(blob, filename);
}

/**
 * Check if a format is currently supported
 */
export function isFormatSupported(format: ExportFormat): boolean {
  const supportedFormats: ExportFormat[] = ['json', 'pdf', 'png', 'svg', 'midi', 'mp3'];
  return supportedFormats.includes(format);
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

