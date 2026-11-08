import {addDays, nightsBetween} from './stay-range';

/*
 * The calendar scrolls without end: it keeps a window of loaded days that grows by one block at the edge
 * the user scrolls to and is trimmed by a block on the far side, so the page never holds more than a few blocks.
 * A block has as many days as the grid shows at once; blocks are also the units reservations are loaded in.
 */

export interface CalendarWindow {
  //first loaded day, YYYY-MM-DD
  from: string;
  //number of loaded days, always a multiple of the block size
  days: number;
}

export interface WindowChange {
  window: CalendarWindow;
  //days added (+) or removed (−) before the old first day; the grid moves its scroll position by this many days
  shiftedDays: number;
}

//blocks on each side of the block with today, so today can be centred with room to scroll both ways
const INITIAL_SIDE_BLOCKS = 1;
//the window never holds more blocks than this
export const MAX_BLOCKS = 5;

/** The block with the day in the middle plus one block on each side; the day ends up in the middle of the window. */
export function initialWindow(today: string, blockDays: number): CalendarWindow {
  const half = Math.floor(blockDays / 2);
  return {
    from: addDays(today, -half - INITIAL_SIDE_BLOCKS * blockDays),
    days: (1 + 2 * INITIAL_SIDE_BLOCKS) * blockDays,
  };
}

export function windowEnd(window: CalendarWindow): string {
  return addDays(window.from, window.days);
}

export function containsDay(window: CalendarWindow, day: string): boolean {
  return day >= window.from && day < windowEnd(window);
}

/** One block more before the first day; the last block is dropped when the window gets too long. */
export function extendBackward(window: CalendarWindow, blockDays: number): WindowChange {
  const days = Math.min(window.days + blockDays, MAX_BLOCKS * blockDays);
  return {window: {from: addDays(window.from, -blockDays), days}, shiftedDays: blockDays};
}

/** One block more after the last day; the first block is dropped when the window gets too long. */
export function extendForward(window: CalendarWindow, blockDays: number): WindowChange {
  if (window.days + blockDays <= MAX_BLOCKS * blockDays) {
    return {window: {from: window.from, days: window.days + blockDays}, shiftedDays: 0};
  }
  return {window: {from: addDays(window.from, blockDays), days: window.days}, shiftedDays: -blockDays};
}

//the first days of the blocks of the window; each block is loaded with one request
export function blockStarts(window: CalendarWindow, blockDays: number): string[] {
  return Array.from({length: Math.ceil(window.days / blockDays)}, (_, i) => addDays(window.from, i * blockDays));
}

//index of the day in the window (may be outside of [0, days) for days that are not loaded)
export function dayIndex(window: CalendarWindow, day: string): number {
  return nightsBetween(window.from, day);
}

const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Listopad 2026", "Październik – listopad 2026", "Grudzień 2026 – styczeń 2027" for the visible days. */
export function visibleMonthsTitle(first: string, last: string): string {
  const [fromYear, fromMonth] = [Number(first.slice(0, 4)), Number(first.slice(5, 7))];
  const [toYear, toMonth] = [Number(last.slice(0, 4)), Number(last.slice(5, 7))];
  if (fromYear === toYear && fromMonth === toMonth) return `${capitalize(MONTHS[fromMonth - 1])} ${fromYear}`;
  if (fromYear === toYear) return `${capitalize(MONTHS[fromMonth - 1])} – ${MONTHS[toMonth - 1]} ${toYear}`;
  return `${capitalize(MONTHS[fromMonth - 1])} ${fromYear} – ${MONTHS[toMonth - 1]} ${toYear}`;
}
