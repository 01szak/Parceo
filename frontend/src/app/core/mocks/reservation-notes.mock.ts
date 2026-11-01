/*
 * MOCK: notes of a reservation ("Uwagi"). ReservationDto has no notes field and the reservation table
 * has no such column. Replace with a `notes` field of the reservation (see PLAN.md, "Mocki we frontendzie").
 *
 * The key is the camper place + the arrival date: creating a reservation returns no id, and two reservations
 * of one camper place can never start on the same day.
 */
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {readMock, writeMock} from './mock-storage';

const KEY = 'reservationNotes';

export function noteKey(camperPlaceId: number, checkin: string): string {
  return `${camperPlaceId}|${checkin}`;
}

export abstract class ReservationNotesApi {
  abstract get(key: string): Observable<string>;
  //`previousKey`: where the note was kept before the place or the arrival changed
  abstract save(key: string, notes: string, previousKey?: string): Observable<void>;
}

@Injectable()
export class ReservationNotesMockApi extends ReservationNotesApi {
  get(key: string): Observable<string> {
    return of(readMock<Record<string, string>>(KEY, {})[key] ?? '');
  }

  save(key: string, notes: string, previousKey?: string): Observable<void> {
    const all = readMock<Record<string, string>>(KEY, {});
    if (previousKey) delete all[previousKey];
    if (notes.trim()) all[key] = notes.trim(); else delete all[key];
    writeMock(KEY, all);
    return of(undefined);
  }
}
