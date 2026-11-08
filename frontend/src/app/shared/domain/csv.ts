//Polish Excel expects ";" between columns; the BOM makes it read the file as UTF-8 (ą, ę, ż…)
const SEPARATOR = ';';
const BOM = '﻿';

//Excel runs a cell starting with = + - @ (or a tab / CR) as a formula, e.g. a guest named "=HYPERLINK(…)"
const FORMULA_START = /^[=+\-@\t\r]/;
//numbers stay numbers: "-12,50", "1 250,00"
const NUMBER = /^[-+]?\d[\d \u00a0]*([.,]\d+)?$/;

function cell(value: string | number): string {
  let text = String(value);
  if (typeof value === 'string' && FORMULA_START.test(text) && !NUMBER.test(text)) text = `'${text}`;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: readonly string[], rows: readonly (readonly (string | number)[])[]): string {
  return BOM + [header, ...rows].map(row => row.map(cell).join(SEPARATOR)).join('\r\n');
}
