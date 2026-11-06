import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {CamperPlaceDto, ReservationDto} from '../../api';
import {BarTone, CalendarBar, CalendarDay} from '@shared/domain/calendar-layout';
import {nightsBetween} from '@shared/domain/stay-range';
import {DragScrollDirective} from '@shared/ui/drag-scroll/drag-scroll.directive';

export interface CalendarRow {
  place: CamperPlaceDto;
  bars: CalendarBar[];
}

export interface CalendarCellClick {
  place: CamperPlaceDto;
  date: string;
}

export interface VisibleDays {
  first: string;
  last: string;
}

export type CalendarEdge = 'start' | 'end';

const TONE_ICONS: Record<BarTone, string> = {
  arrive: 'arrow_forward',
  stay: 'check',
  leave: 'arrow_back',
  unpaid: 'payments',
  late: 'warning',
};

const TONE_LABELS: Record<BarTone, string> = {
  arrive: 'przyjazd',
  stay: 'aktywna',
  leave: 'wyjazd lub zakończona',
  unpaid: 'aktywna, nieopłacona',
  late: 'po terminie, nieopłacona',
};

//a bar narrower than this (px) shows initials instead of the name
const FULL_NAME_MIN_WIDTH = 96;
//a day never gets narrower than this; on a phone fewer days fit and the grid scrolls further
const MIN_DAY_WIDTH = 32;
//more days are requested when fewer than this part of the visible days is left before an edge
const EDGE_THRESHOLD = 1 / 3;

/**
 * Occupancy grid that scrolls without end: a row per camper place, two columns per day. The day width makes
 * `visibleDays` days fit in the viewport. Near an edge it asks for more days (`edgeReached`); when days are added
 * or removed before the first one it keeps the scroll position, so the view does not jump.
 */
@Component({
  selector: 'app-calendar-grid',
  imports: [MatIcon, MatTooltip, DragScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-grid.component.html',
  styleUrl: './calendar-grid.component.scss',
})
export class CalendarGridComponent {
  public readonly days = input.required<readonly CalendarDay[]>();
  public readonly rows = input.required<readonly CalendarRow[]>();
  //how many days fit in the viewport (a user display setting)
  public readonly visibleDays = input.required<number>();
  //the day centred on the first render
  public readonly initialDay = input.required<string>();

  public readonly barClick = output<ReservationDto>();
  public readonly cellClick = output<CalendarCellClick>();
  public readonly edgeReached = output<CalendarEdge>();
  public readonly visibleRangeChange = output<VisibleDays>();

  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  private readonly corner = viewChild.required<ElementRef<HTMLElement>>('corner');
  private readonly injector = inject(Injector);

  private readonly viewportWidth = signal(0);
  private readonly placeColumnWidth = signal(0);

  protected readonly dayWidth = computed(() => {
    const available = this.viewportWidth() - this.placeColumnWidth();
    return available > 0 ? Math.max(MIN_DAY_WIDTH, available / this.visibleDays()) : MIN_DAY_WIDTH;
  });

  protected readonly gridColumns = computed(() =>
    `var(--place-column) repeat(${this.days().length * 2}, ${this.dayWidth() / 2}px)`);

  protected readonly toneIcons = TONE_ICONS;

  private firstDay: string | null = null;
  private edgeRequested = false;
  private lastRange: VisibleDays | null = null;
  private centered = false;
  private pendingCenter: string | null = null;

  constructor() {
    afterNextRender(() => this.observeSize(), {injector: this.injector});

    //days added or removed before the first one: move the scroll position by the same width
    effect(() => {
      const days = this.days();
      const first = days[0]?.date ?? null;
      untracked(() => {
        const previous = this.firstDay;
        this.firstDay = first;
        this.edgeRequested = false;
        const center = this.pendingCenter;
        this.pendingCenter = null;
        if (center) {
          afterNextRender(() => {
            this.scrollToDay(center, 'auto');
            this.onScroll();
          }, {injector: this.injector});
          return;
        }
        if (!previous || !first || previous === first) return;
        const shifted = nightsBetween(first, previous);
        const element = this.scroller().nativeElement;
        afterNextRender(() => {
          element.scrollLeft += shifted * this.dayWidth();
          this.onScroll();
        }, {injector: this.injector});
      });
    });

    //the first time the grid knows its width: centre the initial day
    effect(() => {
      if (this.centered || this.viewportWidth() === 0) return;
      this.centered = true;
      afterNextRender(() => {
        this.scrollToDay(this.initialDay(), 'auto');
        this.onScroll();
      }, {injector: this.injector});
    });

    //a different day width (window resized, another setting) keeps the first visible day in place
    effect(() => {
      const width = this.dayWidth();
      untracked(() => {
        const range = this.lastRange;
        if (!range) return;
        afterNextRender(() => {
          this.scroller().nativeElement.scrollLeft = this.indexOf(range.first) * width;
          this.onScroll();
        }, {injector: this.injector});
      });
    });
  }

  /** Puts the day in the middle of the viewport. */
  public scrollToDay(day: string, behavior: ScrollBehavior = 'smooth'): void {
    const element = this.scroller().nativeElement;
    const visibleWidth = element.clientWidth - this.placeColumnWidth();
    const left = (this.indexOf(day) + 0.5) * this.dayWidth() - visibleWidth / 2;
    element.scrollTo({left: Math.max(0, left), behavior});
  }

  /** Centres the day once the next days (set by the parent at the same time) are rendered. */
  public centerAfterRender(day: string): void {
    this.pendingCenter = day;
  }

  public scrollByDays(days: number): void {
    this.scroller().nativeElement.scrollBy({left: days * this.dayWidth(), behavior: 'smooth'});
  }

  protected onScroll(): void {
    const element = this.scroller().nativeElement;
    const days = this.days();
    if (!days.length || this.viewportWidth() === 0) return;

    const width = this.dayWidth();
    const visibleWidth = element.clientWidth - this.placeColumnWidth();
    const firstIndex = Math.max(0, Math.floor(element.scrollLeft / width));
    const lastIndex = Math.min(days.length - 1, Math.floor((element.scrollLeft + visibleWidth - 1) / width));
    const range = {first: days[firstIndex].date, last: days[lastIndex].date};
    if (range.first !== this.lastRange?.first || range.last !== this.lastRange?.last) {
      this.lastRange = range;
      this.visibleRangeChange.emit(range);
    }

    if (this.edgeRequested) return;
    const threshold = this.visibleDays() * EDGE_THRESHOLD * width;
    const rightLeft = element.scrollWidth - element.scrollLeft - element.clientWidth;
    const edge: CalendarEdge | null = element.scrollLeft < threshold ? 'start' : rightLeft < threshold ? 'end' : null;
    if (edge) {
      this.edgeRequested = true;
      this.edgeReached.emit(edge);
    }
  }

  protected dayColumn(index: number): string {
    return `${2 + index * 2} / span 2`;
  }

  protected barColumn(bar: CalendarBar): string {
    return `${2 + bar.startHalf} / ${2 + bar.endHalf}`;
  }

  protected guestName(reservation: ReservationDto): string {
    return `${reservation.guest?.firstname ?? ''} ${reservation.guest?.lastname ?? ''}`.trim();
  }

  protected barLabel(bar: CalendarBar): string {
    const name = this.guestName(bar.reservation);
    if ((bar.endHalf - bar.startHalf) * this.dayWidth() / 2 >= FULL_NAME_MIN_WIDTH) return name;
    return name.split(/\s+/).map(part => part.charAt(0)).join('.').concat('.');
  }

  protected barDescription(bar: CalendarBar): string {
    const r = bar.reservation;
    const dates = `${this.dayMonth(r.checkin)} – ${this.dayMonth(r.checkout)}`;
    return `${this.guestName(r)}, parcela ${r.camperPlace?.index}, ${dates}, ${TONE_LABELS[bar.tone]}`;
  }

  protected cellLabel(place: CamperPlaceDto, day: CalendarDay): string {
    return `Nowa rezerwacja: parcela ${place.index}, ${this.dayMonth(day.date)}`;
  }

  private indexOf(day: string): number {
    const first = this.days()[0]?.date;
    return first ? nightsBetween(first, day) : 0;
  }

  private observeSize(): void {
    const element = this.scroller().nativeElement;
    const observer = new ResizeObserver(() => {
      this.viewportWidth.set(element.clientWidth);
      this.placeColumnWidth.set(this.corner().nativeElement.offsetWidth);
    });
    observer.observe(element);
    this.injector.get(DestroyRef).onDestroy(() => observer.disconnect());
  }

  private dayMonth(iso?: string): string {
    return iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}` : '';
  }
}
