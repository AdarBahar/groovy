import { GrooveData } from '../../types';
import { grooveToABC } from '../ABCTranscoder';
import { renderABC } from '../ABCRenderer';
import { hasVisibleStickings, layoutStickingAndCountRows } from '../SVGAnnotationLayout';
import { getShareableURL } from '../GrooveURLCodec';
import { ExportProgress, ImageExportOptions, yieldToMain, sanitizeSVG, escapeXml, generateFilename, triggerDownload, getQRCode, getJsPDF } from './helpers';

function renderSheetMusicToSVG(groove: GrooveData, width: number): string {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = `${width}px`;
  document.body.appendChild(container);

  try {
    const abc = grooveToABC(groove, { title: undefined });
    renderABC(abc, container, {
      staffWidth: width - 40,
      scale: 1.0,
      responsive: false,
      padding: 20,
      paddingTop: hasVisibleStickings(groove) ? 46 : 20,
      foregroundColor: '#000000',
    });

    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      throw new Error('Failed to generate SVG');
    }
    layoutStickingAndCountRows(svgElement, groove);

    return sanitizeSVG(svgElement.outerHTML);
  } finally {
    document.body.removeChild(container);
  }
}

export async function generateSheetMusicSVG(
  groove: GrooveData,
  options: ImageExportOptions = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<string> {
  const { width = 800 } = options;

  onProgress?.({ stage: 'preparing', percent: 0, message: 'Preparing export...' });
  await yieldToMain();

  const shareableURL = getShareableURL(groove, undefined, 'embed');

  onProgress?.({ stage: 'generating', percent: 20, message: 'Generating sheet music...' });
  await yieldToMain();

  const sheetMusicSVG = renderSheetMusicToSVG(groove, width);

  onProgress?.({ stage: 'rendering', percent: 50, message: 'Creating QR code...' });
  await yieldToMain();

  const QRCode = await getQRCode();
  const qrDataURL = await QRCode.toDataURL(shareableURL, {
    width: 64,
    margin: 0,
    color: { dark: '#000000', light: '#ffffff' },
  });

  onProgress?.({ stage: 'finalizing', percent: 80, message: 'Finalizing SVG...' });
  await yieldToMain();

  const parser = new DOMParser();
  const sheetDoc = parser.parseFromString(sheetMusicSVG, 'image/svg+xml');
  const sheetSvg = sheetDoc.querySelector('svg');
  const sheetHeight = sheetSvg ? parseFloat(sheetSvg.getAttribute('height') || '200') : 200;

  const headerHeight = 60;
  const footerHeight = 90;
  const padding = 20;
  const totalHeight = headerHeight + sheetHeight + footerHeight + padding * 2;

  const metaItems = [
    `Tempo: ${groove.tempo} BPM`,
    `Time: ${groove.timeSignature.beats}/${groove.timeSignature.noteValue}`,
    `Measures: ${groove.measures.length}`,
  ];
  if (groove.author) metaItems.push(`Author: ${groove.author}`);

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

  onProgress?.({ stage: 'finalizing', percent: 100, message: 'Complete!' });

  return svg;
}

export async function exportToSVG(groove: GrooveData, options: ImageExportOptions = {}): Promise<Blob> {
  const svgString = await generateSheetMusicSVG(groove, options);
  return new Blob([svgString], { type: 'image/svg+xml' });
}

export async function downloadAsSVG(groove: GrooveData, options: ImageExportOptions = {}): Promise<void> {
  const blob = await exportToSVG(groove, options);
  triggerDownload(blob, generateFilename(groove, 'svg'));
}

export async function exportToPNG(
  groove: GrooveData,
  options: ImageExportOptions = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const { backgroundColor = '#ffffff' } = options;

  onProgress?.({ stage: 'generating', percent: 0, message: 'Generating SVG...' });
  const svgString = await generateSheetMusicSVG(groove, options, onProgress);

  onProgress?.({ stage: 'encoding', percent: 70, message: 'Converting to PNG...' });
  await yieldToMain();

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            onProgress?.({ stage: 'finalizing', percent: 100, message: 'Complete!' });
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

export async function downloadAsPNG(groove: GrooveData, options: ImageExportOptions = {}): Promise<void> {
  const blob = await exportToPNG(groove, options);
  triggerDownload(blob, generateFilename(groove, 'png'));
}

export async function exportToPDF(
  groove: GrooveData,
  options: ImageExportOptions = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  onProgress?.({ stage: 'generating', percent: 0, message: 'Generating SVG...' });

  const svgString = await generateSheetMusicSVG(groove, options, onProgress);

  onProgress?.({ stage: 'rendering', percent: 60, message: 'Loading PDF library...' });
  await yieldToMain();

  const jsPDF = await getJsPDF();

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 30;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;
      const scale = Math.min(availableWidth / img.width, availableHeight / img.height, 1.5);
      const imgWidth = img.width * scale;
      const imgHeight = img.height * scale;

      const xPos = (pageWidth - imgWidth) / 2;
      const yPos = (pageHeight - imgHeight) / 2;

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

      onProgress?.({ stage: 'encoding', percent: 80, message: 'Creating PDF...' });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);

      const pdfBlob = pdf.output('blob');
      onProgress?.({ stage: 'finalizing', percent: 100, message: 'Complete!' });
      resolve(pdfBlob);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG for PDF conversion'));
    };

    img.src = url;
  });
}

export async function downloadAsPDF(groove: GrooveData, options: ImageExportOptions = {}): Promise<void> {
  const blob = await exportToPDF(groove, options);
  triggerDownload(blob, generateFilename(groove, 'pdf'));
}
