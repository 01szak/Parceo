//Polish Excel expects ";" between columns; the BOM makes it read the file as UTF-8 (ą, ę, ż…)
const SEPARATOR = ';';
const BOM = '﻿';

function cell(value: string | number): string {
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: readonly string[], rows: readonly (readonly (string | number)[])[]): string {
  return BOM + [header, ...rows].map(row => row.map(cell).join(SEPARATOR)).join('\r\n');
}
