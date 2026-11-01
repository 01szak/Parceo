/*
 * MOCK: the camping's data. The backend has an Organisation entity (name, address) but no endpoint for it.
 * Replace with GET / PATCH of the organisation (see PLAN.md, "Mocki we frontendzie").
 */
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {readMock, writeMock} from './mock-storage';

export interface Organisation {
  name: string;
  address: string;
  phone: string;
  email: string;
  //"14:00"
  checkinFrom: string;
  checkoutUntil: string;
}

export const DEFAULT_ORGANISATION: Organisation = {
  name: 'Mój kemping',
  address: '',
  phone: '',
  email: '',
  checkinFrom: '14:00',
  checkoutUntil: '11:00',
};

const KEY = 'organisation';

export abstract class OrganisationApi {
  abstract get(): Observable<Organisation>;
  abstract save(organisation: Organisation): Observable<Organisation>;
}

@Injectable()
export class OrganisationMockApi extends OrganisationApi {
  get(): Observable<Organisation> {
    return of({...DEFAULT_ORGANISATION, ...readMock<Partial<Organisation>>(KEY, {})});
  }

  save(organisation: Organisation): Observable<Organisation> {
    writeMock(KEY, organisation);
    return of(organisation);
  }
}
