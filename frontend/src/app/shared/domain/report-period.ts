import {addDays, nightsBetween} from './stay-range';
import {ReportPeriod} from './reports';

export type PeriodKind = 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

export interface NamedPeriod extends ReportPeriod {
  //"W październiku", "W 2026 roku", "Od 01.10 do 15.10"
  phrase: string;
  //used in "niż we wrześniu", "niż w 2025 roku"
  comparison: string;
}

//locative ("w październiku"), index = month - 1
const MONTHS_LOCATIVE = ['styczniu', 'lutym', 'marcu', 'kwietniu', 'maju', 'czerwcu', 'lipcu', 'sierpniu', 'wrześniu', 'październiku', 'listopadzie', 'grudniu'];

function monthPeriod(year: number, month: number): ReportPeriod {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  return {from, to: next};
}

//"w" becomes "we" before words starting with w + consonant ("we wrześniu")
function inMonth(month: number): string {
  const word = MONTHS_LOCATIVE[month - 1];
  return `${/^w[^aeiouy]/.test(word) ? 'we' : 'w'} ${word}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function namedMonth(year: number, month: number): NamedPeriod {
  const previousMonth = month === 1 ? 12 : month - 1;
  return {...monthPeriod(year, month), phrase: capitalize(inMonth(month)), comparison: inMonth(previousMonth)};
}

function dayMonth(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
}

/** The period chosen in Raporty; `custom` takes [from, to) from the date picker. */
export function reportPeriod(kind: PeriodKind, today: string, custom?: ReportPeriod): NamedPeriod {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  switch (kind) {
    case 'lastMonth':
      return month === 1 ? namedMonth(year - 1, 12) : namedMonth(year, month - 1);
    case 'thisYear':
      return {from: `${year}-01-01`, to: `${year + 1}-01-01`, phrase: `W ${year} roku`, comparison: `w ${year - 1} roku`};
    case 'custom': {
      const range = custom ?? {from: today, to: addDays(today, 1)};
      const days = nightsBetween(range.from, range.to);
      return {...range, phrase: `Od ${dayMonth(range.from)} do ${dayMonth(addDays(range.to, -1))}`, comparison: `w poprzednich ${days} dniach`};
    }
    default:
      return namedMonth(year, month);
  }
}

//the period of the same kind right before (the previous month, year or the same number of days)
export function previousPeriod(kind: PeriodKind, period: ReportPeriod): ReportPeriod {
  if (kind === 'thisYear') {
    const year = Number(period.from.slice(0, 4)) - 1;
    return {from: `${year}-01-01`, to: `${year + 1}-01-01`};
  }
  if (kind === 'thisMonth' || kind === 'lastMonth') {
    const year = Number(period.from.slice(0, 4));
    const month = Number(period.from.slice(5, 7));
    return month === 1 ? monthPeriod(year - 1, 12) : monthPeriod(year, month - 1);
  }
  const days = nightsBetween(period.from, period.to);
  return {from: addDays(period.from, -days), to: period.from};
}
