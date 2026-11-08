import {ReservationDto} from '../../api';
import {addDays, nightsBetween} from './stay-range';
import {showsUnpaidBadge, stayStatus} from './stay-status';

export type BarTone = 'arrive' | 'stay' | 'leave' | 'unpaid' | 'late';

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  weekday: string;
  weekend: boolean;
  today: boolean;
  //Monday starts a week: the grid draws a stronger line before it
  weekStart: boolean;
}

/**
 * A reservation drawn in a camper place row. The grid has two columns per day, so a bar starts in the middle
 * of the arrival day and ends in the middle of the departure day; two guests changing on one day touch, not overlap.
 */
export interface CalendarBar {
  reservation: ReservationDto;
  //half-day columns, 0-based, end exclusive
  startHalf: number;
  endHalf: number;
  //the stay goes on before / after the visible range
  cutStart: boolean;
  cutEnd: boolean;
  tone: BarTone;
}

const WEEKDAYS = ['nd', 'pon', 'wt', 'śr', 'czw', 'pt', 'sob'];

function weekday(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function calendarDays(from: string, count: number, today: string): CalendarDay[] {
  return Array.from({length: count}, (_, i) => {
    const date = addDays(from, i);
    const day = weekday(date);
    return {
      date,
      dayOfMonth: Number(date.slice(8, 10)),
      weekday: WEEKDAYS[day],
      weekend: day === 0 || day === 6,
      today: date === today,
      weekStart: day === 1,
    };
  });
}

//the color of a bar: a guest on site who has not paid yet stands out, everything else follows the stay status
export function barTone(reservation: ReservationDto, today: string): BarTone {
  const status = stayStatus(reservation, today);
  if (status === 'late') return 'late';
  if (showsUnpaidBadge(reservation, today) && (status === 'stay' || status === 'leave')) return 'unpaid';
  return status === 'ended' ? 'leave' : status;
}

/** Bars of one camper place inside [from, from + days); reservations outside the range are left out. */
export function calendarBars(reservations: readonly ReservationDto[], from: string, days: number, today: string): CalendarBar[] {
  const lastHalf = days * 2;
  return reservations
    .filter(r => r.checkin && r.checkout)
    .map(r => {
      const start = nightsBetween(from, r.checkin!) * 2 + 1;
      const end = nightsBetween(from, r.checkout!) * 2 + 1;
      return {
        reservation: r,
        startHalf: Math.max(start, 0),
        endHalf: Math.min(end, lastHalf),
        cutStart: start < 0,
        cutEnd: end > lastHalf,
        tone: barTone(r, today),
      };
    })
    .filter(bar => bar.endHalf > bar.startHalf)
    .sort((a, b) => a.startHalf - b.startHalf);
}
