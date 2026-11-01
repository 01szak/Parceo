import {addDays} from './stay-range';

//a reservation reduced to what matters for occupancy; dates in YYYY-MM-DD
export interface Stay {
  camperPlaceId: number;
  checkin: string;
  checkout: string;
}

export interface DayAvailability {
  date: string;
  freePlaceIds: number[];
}

//the stay takes the night that starts on `day` (the departure day itself is free again)
export function occupiesNight(stay: Stay, day: string): boolean {
  return stay.checkin <= day && day < stay.checkout;
}

export function freePlaceIdsOn(placeIds: readonly number[], stays: readonly Stay[], day: string): number[] {
  const taken = new Set(stays.filter(s => occupiesNight(s, day)).map(s => s.camperPlaceId));
  return placeIds.filter(id => !taken.has(id));
}

//free camper places for each night of [from, from + days)
export function availabilityPerDay(placeIds: readonly number[], stays: readonly Stay[], from: string, days: number): DayAvailability[] {
  return Array.from({length: days}, (_, i) => {
    const date = addDays(from, i);
    return {date, freePlaceIds: freePlaceIdsOn(placeIds, stays, date)};
  });
}

//how many nights in a row the place stays free starting with `day` (at most `limit`)
export function freeNightsInARow(placeId: number, stays: readonly Stay[], day: string, limit: number): number {
  const own = stays.filter(s => s.camperPlaceId === placeId);
  let nights = 0;
  while (nights < limit && !own.some(s => occupiesNight(s, addDays(day, nights)))) nights++;
  return nights;
}
