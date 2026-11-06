import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {Observable, Subject} from "rxjs";
import {CalendarReservationsLoader} from './calendar-reservations-loader';
import {ResourceType, ServiceFacade} from '@core/services/openApiWrappers/service-facade.service';
import {DataVersionService} from '@core/services/openApiWrappers/data-version.service';
import {CalendarWindow} from '@shared/domain/calendar-window';
import {ReservationDto, SearchRequest} from '../../api';

describe('CalendarReservationsLoader', () => {
  const reservation = (id: number): ReservationDto =>
    ({id, checkin: '2026-11-01', checkout: '2026-11-03', paid: true, camperPlace: {id: 1, price: 1, camperPlaceType: {typeName: 'K', price: 1}}, guest: {}});

  let requests: { from: string, to: string, response: Subject<unknown> }[];
  let loader: CalendarReservationsLoader;
  const window = signal<CalendarWindow>({from: '2026-11-01', days: 20});
  const blockDays = signal(10);

  beforeEach(() => {
    requests = [];
    const facade = {
      findBy: (_type: ResourceType, _pageable: unknown, body: SearchRequest): Observable<unknown> => {
        const criteria = body.searchCriteria!;
        const response = new Subject<unknown>();
        requests.push({from: criteria[1].value!, to: criteria[0].value!, response});
        return response;
      },
    };
    TestBed.configureTestingModule({providers: [CalendarReservationsLoader, {provide: ServiceFacade, useValue: facade}]});
    window.set({from: '2026-11-01', days: 20});
    loader = TestBed.inject(CalendarReservationsLoader);
    loader.connect(window, blockDays);
    TestBed.tick();
  });

  const page = (content: ReservationDto[]) => ({content, totalElements: content.length, totalPages: 1, number: 0, size: 0});

  it('loads every block of the window with its own request', () => {
    expect(requests.map(r => [r.from, r.to])).toEqual([['2026-11-01', '2026-11-11'], ['2026-11-11', '2026-11-21']]);
    expect(loader.loading()).toBeTrue();
  });

  it('shows a stay crossing two blocks once', () => {
    requests[0].response.next(page([reservation(1), reservation(2)]));
    requests[1].response.next(page([reservation(2)]));
    expect(loader.reservations().map(r => r.id)).toEqual([1, 2]);
    expect(loader.loading()).toBeFalse();
  });

  it('fetches only the block added to the window and forgets the trimmed one', () => {
    requests.forEach(r => r.response.next(page([reservation(1)])));
    window.set({from: '2026-11-11', days: 20});
    TestBed.tick();
    expect(requests.slice(2).map(r => r.from)).toEqual(['2026-11-21']);
  });

  it('reloads the loaded blocks after a change of reservations', () => {
    requests.forEach(r => r.response.next(page([])));
    TestBed.inject(DataVersionService).bump(ResourceType.RESERVATION);
    TestBed.tick();
    expect(requests.slice(2).map(r => r.from)).toEqual(['2026-11-01', '2026-11-11']);
  });

  it('keeps the data on screen when a block fails', () => {
    requests[0].response.next(page([reservation(1)]));
    requests[1].response.error(new Error('502'));
    expect(loader.failed()).toBeTrue();
    expect(loader.reservations().map(r => r.id)).toEqual([1]);
  });
});

