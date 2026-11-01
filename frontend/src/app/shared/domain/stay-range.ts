//dates are ISO strings (YYYY-MM-DD), the backend's format; a stay occupies the nights [checkin, checkout)

const DAY_MS = 24 * 60 * 60 * 1000;
//genitive, as in "od soboty do wtorku"; index = Date.getUTCDay()
const WEEKDAYS_GENITIVE = ['niedzieli', 'poniedziałku', 'wtorku', 'środy', 'czwartku', 'piątku', 'soboty'];

function parse(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function format(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function nightsBetween(checkin: string, checkout: string): number {
  return Math.round((parse(checkout).getTime() - parse(checkin).getTime()) / DAY_MS);
}

//"1 noc", "3 noce", "5 nocy", "22 noce"
export function nightsLabel(nights: number): string {
  const lastDigit = nights % 10;
  const lastTwo = nights % 100;
  if (nights === 1) return '1 noc';
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${nights} noce`;
  return `${nights} nocy`;
}

//"3 noce, od soboty do wtorku"
export function stayHint(checkin: string, checkout: string): string {
  const nights = nightsBetween(checkin, checkout);
  if (nights <= 0) return '';
  const from = WEEKDAYS_GENITIVE[parse(checkin).getUTCDay()];
  const to = WEEKDAYS_GENITIVE[parse(checkout).getUTCDay()];
  return `${nightsLabel(nights)}, od ${from} do ${to}`;
}

//every night of the stay: checkin included, checkout excluded
export function nightsOf(checkin: string, checkout: string): string[] {
  const nights: string[] = [];
  for (let d = parse(checkin); d < parse(checkout); d = new Date(d.getTime() + DAY_MS)) {
    nights.push(format(d));
  }
  return nights;
}

/**
 * The backend's occupancy is a list of stays, each one a list of occupied nights.
 * Returns the first stay that shares a night with [checkin, checkout), or null when the range is free.
 */
export function firstConflict(checkin: string, checkout: string, occupiedStays: readonly string[][]): string[] | null {
  const wanted = new Set(nightsOf(checkin, checkout));
  return occupiedStays.find(stay => stay.some(night => wanted.has(night))) ?? null;
}

//leaves out the stay of the reservation being edited (its nights lie inside its own range)
export function withoutOwnStay(occupiedStays: readonly string[][], checkin: string, checkout: string): string[][] {
  const own = new Set(nightsOf(checkin, checkout));
  return occupiedStays.filter(stay => !stay.every(night => own.has(night)));
}

//"01.11 – 03.11" for a stay given as its nights (the last night + 1 day is the departure)
export function stayLabel(nights: readonly string[]): string {
  const dayMonth = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
  const departure = format(new Date(parse(nights[nights.length - 1]).getTime() + DAY_MS));
  return `${dayMonth(nights[0])} – ${dayMonth(departure)}`;
}

//the date `days` days later (negative: earlier), counted in UTC so DST changes do not shift it
export function addDays(iso: string, days: number): string {
  return format(new Date(parse(iso).getTime() + days * DAY_MS));
}
