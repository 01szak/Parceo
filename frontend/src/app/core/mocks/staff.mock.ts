/*
 * MOCK: people with access to the camping. The backend returns only the logged in user (GET /user);
 * there is no list of users and registration is commented out. Invitations are kept in this browser only.
 * Replace with a users endpoint and invitations (see PLAN.md, "Mocki we frontendzie").
 */
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {readMock, writeMock} from './mock-storage';

export type StaffRole = 'ADMIN' | 'REGULAR';

export interface Invitation {
  email: string;
  role: StaffRole;
  //YYYY-MM-DD
  sentOn: string;
}

const KEY = 'invitations';

export abstract class StaffApi {
  abstract invitations(): Observable<Invitation[]>;
  abstract invite(invitation: Invitation): Observable<Invitation[]>;
  abstract cancel(email: string): Observable<Invitation[]>;
}

@Injectable()
export class StaffMockApi extends StaffApi {
  invitations(): Observable<Invitation[]> {
    return of(readMock<Invitation[]>(KEY, []));
  }

  invite(invitation: Invitation): Observable<Invitation[]> {
    const list = [...readMock<Invitation[]>(KEY, []).filter(i => i.email !== invitation.email), invitation];
    writeMock(KEY, list);
    return of(list);
  }

  cancel(email: string): Observable<Invitation[]> {
    const list = readMock<Invitation[]>(KEY, []).filter(i => i.email !== email);
    writeMock(KEY, list);
    return of(list);
  }
}
