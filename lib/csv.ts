// Shared CSV primitives used by the recipe and inventory import/export paths.

export const escapeCell = (v: string): string =>
  /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

/**
 * Parse CSV text into rows of string cells. Handles quoted fields, escaped
 * quotes ("") and embedded commas / newlines.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const s = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Detect the delimiter from the first line — Excel exports ';' or tab in
  // some locales instead of ','.
  const firstLine = s.split('\n', 1)[0] ?? '';
  const delim = firstLine.includes('\t') ? '\t' : firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(cell); cell = '';
    } else if (c === '\n') {
      row.push(cell); cell = '';
      rows.push(row); row = [];
    } else {
      cell += c;
    }
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

/** Build CSV text from a header row and already-stringified data rows. */
export function toCSV(header: readonly string[], rows: string[][]): string {
  return [header.join(','), ...rows.map(r => r.map(escapeCell).join(','))].join('\r\n');
}

/** Trigger a browser download of CSV text. */
export function download(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Case/space-insensitive lookup of a column, so hand-edited headers still work. */
export function columnIndex(header: string[], name: string): number {
  const want = name.toLowerCase().replace(/[\s_]/g, '');
  return header.findIndex(h => h.trim().toLowerCase().replace(/[\s_]/g, '') === want);
}
