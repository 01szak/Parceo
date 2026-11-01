import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked} from '@angular/core';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatProgressBar} from '@angular/material/progress-bar';
import moment from 'moment';
import {CamperPlaceTypeDto, ReservationDto} from '../../api';
import {ResourceType} from '@core/services/openApiWrappers/service-facade.service';
import {createPagedQuery} from '@core/services/openApiWrappers/paged-query';
import {CamperPlaceService} from '@core/services/openApiWrappers/CamperPlaceService';
import {CamperPlaceTypeService} from '@core/services/openApiWrappers/CamperPlaceTypeService';
import {PopupFormService} from '@core/services/PopupFormService';
import {calendarBars, calendarDays, startOfWeek} from '@shared/domain/calendar-layout';
import {addDays, nightsBetween} from '@shared/domain/stay-range';
import {todayIso} from '@shared/domain/iso-date';
import {ReservationChipKind} from '@shared/domain/stay-status';
import {StatusChipComponent} from '@shared/ui/status-chip/status-chip.component';
import {EmptyStateComponent} from '@shared/ui/empty-state/empty-state.component';
import {CalendarCellClick, CalendarGridComponent, CalendarRow} from './calendar-grid.component';

export type CalendarRange = 'week' | 'twoWeeks' | 'month';

const ALL_TYPES = 'all';
const LEGEND: readonly ReservationChipKind[] = ['arrive', 'stay', 'unpaid', 'ended', 'late'];

//first day and length of the visible period that contains `anchor`
function period(range: CalendarRange, anchor: string): { from: string, days: number } {
  if (range === 'month') {
    const first = `${anchor.slice(0, 7)}-01`;
    return {from: first, days: moment(first).daysInMonth()};
  }
  return {from: startOfWeek(anchor), days: range === 'week' ? 7 : 14};
}

@Component({
  selector: 'app-calendar-page',
  imports: [
    MatButton,
    MatIconButton,
    MatIcon,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatProgressBar,
    StatusChipComponent,
    EmptyStateComponent,
    CalendarGridComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
})
export class CalendarPageComponent {
  private readonly camperPlaces = inject(CamperPlaceService);
  private readonly types = inject(CamperPlaceTypeService);
  private readonly forms = inject(PopupFormService);

  private readonly today = todayIso();
  protected readonly legend = LEGEND;

  protected readonly range = signal<CalendarRange>('twoWeeks');
  //any day of the visible period; the period is derived from it
  private readonly anchor = signal(this.today);
  protected readonly typeFilter = signal<number | typeof ALL_TYPES>(ALL_TYPES);
  protected readonly allTypes = ALL_TYPES;

  private readonly reservations = createPagedQuery<ReservationDto>(ResourceType.RESERVATION, {unpaged: true});

  protected readonly period = computed(() => period(this.range(), this.anchor()));
  protected readonly days = computed(() => calendarDays(this.period().from, this.period().days, this.today));
  protected readonly title = computed(() => {
    const {from, days} = this.period();
    const start = moment(from).locale('pl');
    const end = moment(addDays(from, days - 1)).locale('pl');
    if (this.range() === 'month') return capitalize(start.format('MMMM YYYY'));
    return start.month() === end.month()
      ? `${start.date()}–${end.date()} ${end.format('MMMM YYYY')}`
      : `${start.format('D MMMM')} – ${end.format('D MMMM YYYY')}`;
  });

  protected readonly typeOptions = computed(() => this.types.page().content as CamperPlaceTypeDto[]);

  protected readonly rows = computed<CalendarRow[]>(() => {
    const {from, days} = this.period();
    const filter = this.typeFilter();
    const byPlace = new Map<number, ReservationDto[]>();
    this.reservations.page().content.forEach(r => {
      const id = r.camperPlace?.id;
      if (id !== undefined) byPlace.set(id, [...(byPlace.get(id) ?? []), r]);
    });
    return this.camperPlaces.camperPlaces()
      .filter(place => filter === ALL_TYPES || place.camperPlaceType?.id === filter)
      .map(place => ({place, bars: calendarBars(byPlace.get(place.id!) ?? [], from, days, this.today)}));
  });

  protected readonly loading = computed(() =>
    this.reservations.loading() || this.camperPlaces.unpagedCamperPlaceResource.isLoading());
  protected readonly failed = computed(() =>
    this.reservations.failed() || this.camperPlaces.unpagedCamperPlaceResource.status() === 'error');

  constructor() {
    //every stay that shares a night with the visible period, also those that started before it
    effect(() => {
      const {from, days} = this.period();
      untracked(() => this.reservations.criteria.set([
        {key: 'checkin', operation: 'LESS_THEN', value: addDays(from, days), joinOperator: 'AND'},
        {key: 'checkout', operation: 'GREATER_THEN', value: from, joinOperator: 'AND'},
      ]));
    });
  }

  protected previous(): void {
    this.shift(-1);
  }

  protected next(): void {
    this.shift(1);
  }

  protected goToToday(): void {
    this.anchor.set(this.today);
  }

  protected showsToday(): boolean {
    const {from, days} = this.period();
    const offset = nightsBetween(from, this.today);
    return offset >= 0 && offset < days;
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

  private shift(direction: 1 | -1): void {
    const {from} = this.period();
    if (this.range() === 'month') {
      this.anchor.set(moment(from).add(direction, 'month').format('YYYY-MM-DD'));
    } else {
      this.anchor.set(addDays(from, direction * (this.range() === 'week' ? 7 : 14)));
    }
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
