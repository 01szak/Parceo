import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {CamperPlaceDto, ReservationDto} from '../../api';
import {BarTone, CalendarBar, CalendarDay} from '@shared/domain/calendar-layout';

export interface CalendarRow {
  place: CamperPlaceDto;
  bars: CalendarBar[];
}

export interface CalendarCellClick {
  place: CamperPlaceDto;
  date: string;
}

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

//a bar narrower than this many half-days shows initials instead of the name
const FULL_NAME_MIN_HALVES = 6;

/**
 * Occupancy grid: a row per camper place, two columns per day. Empty cells and bars are buttons;
 * the parent decides what a click does.
 */
@Component({
  selector: 'app-calendar-grid',
  imports: [MatIcon, MatTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-grid.component.html',
  styleUrl: './calendar-grid.component.scss',
})
export class CalendarGridComponent {
  public readonly days = input.required<readonly CalendarDay[]>();
  public readonly rows = input.required<readonly CalendarRow[]>();
  //a narrower day column for the month view
  public readonly compact = input(false);

  public readonly barClick = output<ReservationDto>();
  public readonly cellClick = output<CalendarCellClick>();

  protected readonly gridColumns = computed(() =>
    `var(--place-column) repeat(${this.days().length * 2}, minmax(var(--half-day), 1fr))`);

  protected readonly toneIcons = TONE_ICONS;

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
    if (bar.endHalf - bar.startHalf >= FULL_NAME_MIN_HALVES) return name;
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

  private dayMonth(iso?: string): string {
    return iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}` : '';
  }
}
