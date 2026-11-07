import {CamperPlaceDto, ReservationDto} from '../../api';
import {addDays, nightsBetween, nightsOf} from './stay-range';

/*
 * Reports are computed in the browser from the reservations overlapping the period.
 * A reservation's price is spread evenly over its nights, so a stay crossing the border of the period
 * counts only with the nights inside it.
 */

export interface ReportPeriod {
  //YYYY-MM-DD, end exclusive
  from: string;
  to: string;
}

export interface RevenueBucket {
  //the first day of the bucket (a day or a month)
  start: string;
  amount: number;
}

export interface TypeReport {
  typeId: number;
  typeName: string;
  places: number;
  nights: number;
  revenue: number;
  //0–1, sold nights / (places × days)
  occupancy: number;
}

export interface CountryCount {
  country: string;
  guests: number;
}

export interface Report {
  revenue: number;
  nights: number;
  occupancy: number;
  unpaidAmount: number;
  unpaidReservations: number;
  buckets: RevenueBucket[];
  bucketUnit: 'day' | 'month';
  byType: TypeReport[];
  countries: CountryCount[];
}

//periods longer than this are shown month by month
const DAILY_LIMIT = 62;
const UNKNOWN_COUNTRY = '';

interface Share {
  reservation: ReservationDto;
  nights: string[];
  amount: number;
}

//the nights of a reservation inside the period and the part of its price that falls on them
function shareInPeriod(r: ReservationDto, period: ReportPeriod): Share | null {
  if (!r.checkin || !r.checkout) return null;
  const all = nightsOf(r.checkin, r.checkout);
  if (all.length === 0) return null;
  const nights = all.filter(night => night >= period.from && night < period.to);
  if (nights.length === 0) return null;
  return {reservation: r, nights, amount: (r.price ?? 0) * nights.length / all.length};
}

function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function emptyBuckets(period: ReportPeriod, unit: 'day' | 'month'): RevenueBucket[] {
  const buckets: RevenueBucket[] = [];
  for (let day = period.from; day < period.to; day = addDays(day, 1)) {
    const start = unit === 'day' ? day : monthStart(day);
    if (buckets[buckets.length - 1]?.start !== start) buckets.push({start, amount: 0});
  }
  return buckets;
}

export function buildReport(reservations: readonly ReservationDto[], places: readonly CamperPlaceDto[], period: ReportPeriod): Report {
  const days = nightsBetween(period.from, period.to);
  const shares = reservations.map(r => shareInPeriod(r, period)).filter((s): s is Share => s !== null);

  const bucketUnit = days > DAILY_LIMIT ? 'month' : 'day';
  const buckets = emptyBuckets(period, bucketUnit);
  const bucketIndex = new Map(buckets.map((b, i) => [b.start, i]));
  shares.forEach(share => {
    const perNight = share.amount / share.nights.length;
    share.nights.forEach(night => {
      buckets[bucketIndex.get(bucketUnit === 'day' ? night : monthStart(night))!].amount += perNight;
    });
  });

  const typeOf = (place?: CamperPlaceDto) => place?.camperPlaceType;
  const byTypeMap = new Map<number, TypeReport>();
  places.forEach(place => {
    const type = typeOf(place);
    if (type?.id === undefined) return;
    const entry = byTypeMap.get(type.id) ?? {typeId: type.id, typeName: type.typeName, places: 0, nights: 0, revenue: 0, occupancy: 0};
    entry.places++;
    byTypeMap.set(type.id, entry);
  });
  shares.forEach(share => {
    const entry = byTypeMap.get(typeOf(share.reservation.camperPlace)?.id ?? -1);
    if (!entry) return;
    entry.nights += share.nights.length;
    entry.revenue += share.amount;
  });
  const byType = [...byTypeMap.values()].map(t => ({...t, occupancy: t.places && days ? t.nights / (t.places * days) : 0}));

  const guestsByCountry = new Map<string, Set<number | string>>();
  shares.forEach(({reservation}) => {
    const country = reservation.guest?.country ?? UNKNOWN_COUNTRY;
    const guests = guestsByCountry.get(country) ?? new Set();
    guests.add(reservation.guest?.id ?? `reservation-${reservation.id}`);
    guestsByCountry.set(country, guests);
  });
  const countries = [...guestsByCountry.entries()]
    .map(([country, guests]) => ({country, guests: guests.size}))
    .sort((a, b) => b.guests - a.guests);

  const unpaid = shares.filter(s => !s.reservation.paid);
  const nights = shares.reduce((sum, s) => sum + s.nights.length, 0);

  return {
    revenue: shares.reduce((sum, s) => sum + s.amount, 0),
    nights,
    occupancy: places.length && days ? nights / (places.length * days) : 0,
    unpaidAmount: unpaid.reduce((sum, s) => sum + s.amount, 0),
    unpaidReservations: unpaid.length,
    buckets,
    bucketUnit,
    byType,
    countries,
  };
}

//relative change in percent, rounded; null when there is nothing to compare with
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round((current - previous) / previous * 100);
}

//up to `limit - 1` biggest countries keep their own slice, the rest is summed into one (a pie stays readable)
export function topCountries(countries: readonly CountryCount[], limit: number): { country: string | null, guests: number }[] {
  if (countries.length < limit) return [...countries];
  const top = countries.slice(0, limit - 1);
  const rest = countries.slice(limit - 1).reduce((sum, c) => sum + c.guests, 0);
  return [...top, {country: null, guests: rest}];
}
