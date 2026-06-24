import { GrooveData } from '../../types';
import { ExportMetadata, JSONExportOptions, generateFilename, triggerDownload } from './helpers';

export function exportToJSON(groove: GrooveData, options: JSONExportOptions = {}): Blob {
  const { includeMetadata = true, prettyPrint = true } = options;

  const exportData: { groove: GrooveData; metadata?: ExportMetadata } = { groove };

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

export function downloadAsJSON(groove: GrooveData, options: JSONExportOptions = {}): void {
  const blob = exportToJSON(groove, options);
  triggerDownload(blob, generateFilename(groove, 'json'));
}
