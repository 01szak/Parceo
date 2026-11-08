/*
 * MOCK: display settings of the logged in user. They are meant to be stored per user in the database;
 * the backend has no endpoint for them yet, so they are kept in this browser.
 * Replace with GET / PUT of the user's display settings (see PLAN.md, "Mocki we frontendzie").
 */
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {readMock, writeMock} from './mock-storage';

export interface DisplaySettings {
  //how many days the calendar grid shows at once
  calendarDays: number;
  //how many days the calendar arrows scroll
  calendarScrollDays: number;
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  calendarDays: 30,
  calendarScrollDays: 7,
};

const KEY = 'displaySettings';

export abstract class DisplaySettingsApi {
  abstract get(): Observable<DisplaySettings>;
  abstract save(settings: DisplaySettings): Observable<DisplaySettings>;
}

@Injectable()
export class DisplaySettingsMockApi extends DisplaySettingsApi {
  get(): Observable<DisplaySettings> {
    return of({...DEFAULT_DISPLAY_SETTINGS, ...readMock<Partial<DisplaySettings>>(KEY, {})});
  }

  save(settings: DisplaySettings): Observable<DisplaySettings> {
    writeMock(KEY, settings);
    return of(settings);
  }
}
