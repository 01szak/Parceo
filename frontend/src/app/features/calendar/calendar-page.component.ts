import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, viewChild} from '@angular/core';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatProgressBar} from '@angular/material/progress-bar';
import moment from 'moment';
import {CamperPlaceTypeDto, ReservationDto} from '../../api';
import {CamperPlaceService} from '@core/services/openapiwrappers/CamperPlaceService';
import {CamperPlaceTypeService} from '@core/services/openapiwrappers/CamperPlaceTypeService';
import {PopupFormService} from '@core/services/PopupFormService';
import {DisplaySettingsService} from '@core/services/DisplaySettingsService';
import {calendarBars, calendarDays} from '@shared/domain/calendar-layout';
import {
  CalendarWindow,
  containsDay,
  extendBackward,
  extendForward,
  initialWindow,
  visibleMonthsTitle
} from '@shared/domain/calendar-window';
import {todayIso} from '@shared/domain/iso-date';
import {ReservationChipKind} from '@shared/domain/stay-status';
import {StatusChipComponent} from '@shared/ui/status-chip/status-chip.component';
import {EmptyStateComponent} from '@shared/ui/empty-state/empty-state.component';
import {CalendarCellClick, CalendarEdge, CalendarGridComponent, CalendarRow, VisibleDays} from './calendar-grid.component';
import {CalendarReservationsLoader} from './calendar-reservations-loader';

const ALL_TYPES = 'all';
const LEGEND: readonly ReservationChipKind[] = ['arrive', 'stay', 'unpaid', 'ended', 'late'];

/**
 * Occupancy calendar that scrolls without end. It opens with today in the middle; the number of days
 * shown at once and the step of the arrows come from the user's display settings.
 */
@Component({
  selector: 'app-calendar-page',
  imports: [
    MatButton,
    MatIconButton,
    MatIcon,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatProgressBar,
    StatusChipComponent,
    EmptyStateComponent,
    CalendarGridComponent,
  ],
  providers: [CalendarReservationsLoader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
})
export class CalendarPageComponent {
  private readonly camperPlaces = inject(CamperPlaceService);
  private readonly types = inject(CamperPlaceTypeService);
  private readonly forms = inject(PopupFormService);
  private readonly settings = inject(DisplaySettingsService);
  private readonly loader = inject(CalendarReservationsLoader);
  private readonly grid = viewChild(CalendarGridComponent);

  protected readonly today = todayIso();
  protected readonly legend = LEGEND;
  protected readonly allTypes = ALL_TYPES;

  //days shown at once; also the size of a block of days loaded at a time
  protected readonly visibleDays = this.settings.calendarDays;
  private readonly scrollDays = this.settings.calendarScrollDays;

  private readonly window = signal<CalendarWindow>(initialWindow(this.today, this.visibleDays()));
  private readonly visibleRange = signal<VisibleDays | null>(null);
  protected readonly typeFilter = signal<number | typeof ALL_TYPES>(ALL_TYPES);

  protected readonly days = computed(() => calendarDays(this.window().from, this.window().days, this.today));
  protected readonly title = computed(() => {
    const range = this.visibleRange();
    return range ? visibleMonthsTitle(range.first, range.last) : visibleMonthsTitle(this.today, this.today);
  });
  protected readonly todayVisible = computed(() => {
    const range = this.visibleRange();
    return !!range && this.today >= range.first && this.today <= range.last;
  });

  protected readonly typeOptions = computed(() => this.types.page().content as CamperPlaceTypeDto[]);

  protected readonly rows = computed<CalendarRow[]>(() => {
    const {from, days} = this.window();
    const filter = this.typeFilter();
    const byPlace = new Map<number, ReservationDto[]>();
    this.loader.reservations().forEach(r => {
      const id = r.camperPlace?.id;
      if (id !== undefined) byPlace.set(id, [...(byPlace.get(id) ?? []), r]);
    });
    return this.camperPlaces.camperPlaces()
      .filter(place => filter === ALL_TYPES || place.camperPlaceType?.id === filter)
      .map(place => ({place, bars: calendarBars(byPlace.get(place.id!) ?? [], from, days, this.today)}));
  });

  protected readonly loading = computed(() =>
    this.loader.loading() || this.camperPlaces.unpagedCamperPlaceResource.isLoading());
  protected readonly failed = computed(() =>
    this.loader.failed() || this.camperPlaces.unpagedCamperPlaceResource.status() === 'error');
  //the grid stays on screen while more days load, so scrolling is never interrupted
  protected readonly firstLoad = computed(() => this.loading() && this.loader.reservations().length === 0 && this.rows().length === 0);

  constructor() {
    this.loader.connect(this.window, this.visibleDays);

    //another number of days per block (settings loaded or changed): start again around today
    effect(() => {
      const blockDays = this.visibleDays();
      untracked(() => {
        if (this.window().days % blockDays !== 0) this.resetAroundToday();
      });
    });
  }

  protected onEdge(edge: CalendarEdge): void {
    const change = edge === 'start'
      ? extendBackward(this.window(), this.visibleDays())
      : extendForward(this.window(), this.visibleDays());
    this.window.set(change.window);
  }

  protected onVisibleRange(range: VisibleDays): void {
    this.visibleRange.set(range);
  }

  protected previous(): void {
    this.grid()?.scrollByDays(-this.scrollDays());
  }

  protected next(): void {
    this.grid()?.scrollByDays(this.scrollDays());
  }

  protected goToToday(): void {
    if (containsDay(this.window(), this.today)) {
      this.grid()?.scrollToDay(this.today);
    } else {
      this.resetAroundToday();
    }
  }

  protected newReservation(): void {
    this.forms.openReservationFormPopup();
  }

  protected openReservation(reservation: ReservationDto): void {
    this.forms.openReservationFormPopup({reservation});
  }

  protected bookCell({place, date}: CalendarCellClick): void {
    const day = moment(date);
    this.forms.openReservationFormPopup({camperPlace: place, year: day.year(), month: day.month(), day: day.date()});
  }

  //far from today the loaded days do not contain it: load the days around today again and centre it
  private resetAroundToday(): void {
    this.window.set(initialWindow(this.today, this.visibleDays()));
    this.grid()?.centerAfterRender(this.today);
  }
}
