import {computed, DestroyRef, effect, inject, Injectable, Injector, signal, Signal, untracked} from '@angular/core';
import {Subscription} from 'rxjs';
import {ReservationDto, SearchCriteria} from '../../api';
import {ResourceType, ServiceFacade} from '@core/services/openApiWrappers/service-facade.service';
import {DataVersionService} from '@core/services/openApiWrappers/data-version.service';
import {Page} from '@core/models/Page';
import {blockStarts, CalendarWindow} from '@shared/domain/calendar-window';
import {addDays} from '@shared/domain/stay-range';

interface BlockState {
  reservations: ReservationDto[];
  loading: boolean;
  failed: boolean;
}

//every stay that shares a night with [from, to), also those that started before it
function overlapping(from: string, to: string): SearchCriteria[] {
  return [
    {key: 'checkin', operation: 'LESS_THEN', value: to, joinOperator: 'AND'},
    {key: 'checkout', operation: 'GREATER_THEN', value: from, joinOperator: 'AND'},
  ];
}

/**
 * Loads the reservations of the calendar window block by block: a block added at an edge is fetched alone,
 * a block trimmed from the window is forgotten, and every loaded block is fetched again after any change
 * of reservations. Data already on screen stays there while a block (re)loads.
 * Provided by the calendar page; `connect()` binds it to the page's window.
 */
@Injectable()
export class CalendarReservationsLoader {
  private readonly facade = inject(ServiceFacade);
  private readonly version = inject(DataVersionService).version(ResourceType.RESERVATION);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly blocks = signal(new Map<string, BlockState>());
  private readonly requests = new Map<string, Subscription>();

  //a stay crossing the border of two blocks comes in both responses; it is shown once
  public readonly reservations = computed(() => {
    const byId = new Map<number, ReservationDto>();
    this.blocks().forEach(block => block.reservations.forEach(r => byId.set(r.id!, r)));
    return [...byId.values()];
  });
  public readonly loading = computed(() => [...this.blocks().values()].some(b => b.loading));
  public readonly failed = computed(() => [...this.blocks().values()].some(b => b.failed));

  constructor() {
    this.destroyRef.onDestroy(() => this.requests.forEach(r => r.unsubscribe()));
  }

  public connect(window: Signal<CalendarWindow>, blockDays: Signal<number>): void {
    let lastVersion = untracked(this.version);
    effect(() => {
      const size = blockDays();
      const wanted = blockStarts(window(), size);
      const version = this.version();
      untracked(() => {
        const reloadAll = version !== lastVersion;
        lastVersion = version;
        this.forgetBlocksOutside(new Set(wanted));
        wanted
          .filter(start => reloadAll || !this.blocks().has(start))
          .forEach(start => this.load(start, addDays(start, size)));
      });
    }, {injector: this.injector});
  }

  private load(from: string, to: string): void {
    this.requests.get(from)?.unsubscribe();
    this.update(from, state => ({reservations: state?.reservations ?? [], loading: true, failed: false}));
    const request = this.facade.findBy(ResourceType.RESERVATION, null, {searchCriteria: overlapping(from, to)}).subscribe({
      next: (page: Page<ReservationDto>) => this.update(from, () => ({reservations: page.content, loading: false, failed: false})),
      error: () => this.update(from, state => ({reservations: state?.reservations ?? [], loading: false, failed: true})),
    });
    this.requests.set(from, request);
  }

  private forgetBlocksOutside(wanted: Set<string>): void {
    const next = new Map([...this.blocks()].filter(([start]) => wanted.has(start)));
    [...this.requests.keys()].filter(start => !wanted.has(start)).forEach(start => {
      this.requests.get(start)!.unsubscribe();
      this.requests.delete(start);
    });
    if (next.size !== this.blocks().size) this.blocks.set(next);
  }

  private update(start: string, change: (state: BlockState | undefined) => BlockState): void {
    const next = new Map(this.blocks());
    next.set(start, change(next.get(start)));
    this.blocks.set(next);
  }
}
