import {ChangeDetectionStrategy, Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {CamperPlaceService} from '@core/services/openApiWrappers/CamperPlaceService';
import {PopupFormService} from '@core/services/PopupFormService';
import {MatCard} from '@angular/material/card';
import {NgClass} from '@angular/common';
import {NewDatePickerComponent} from '@shared/ui/date-picker/new-date-picker.component';
import {ReservationFormData} from '@shared/form/reservation-form.component';
import {CamperPlaceDto, ReservationDto} from '../../../api';
import {ReservationCellComponent} from '@features/reservations/calendar/reservation-cell.component';
import {ReservationService} from '@core/services/openApiWrappers/ReservationService';
import {DateDelimiter, DateFormater} from '@shared/helper/DateFormater';
import moment from 'moment';
import {MatMenu, MatMenuTrigger} from '@angular/material/menu';
import {MatIconButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

@Component({
  selector: 'calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    NewDatePickerComponent,
    ReservationCellComponent,
    NgClass,
    MatMenu,
    MatMenuTrigger,
    MatIconButton,
    MatProgressSpinner,
  ],
  template: `
    <mat-card class="content">
      <div class="widget-header">
        <app-new-date-picker (month)="changeMonth($event)" (year)="changeYear($event)"/>

        <div class="spacer"></div>

        <button mat-icon-button
                [matMenuTriggerFor]="menu"
                #menuTrigger="matMenuTrigger"
                (mouseenter)="menuTrigger.openMenu()"
                (mousedown)="menuTrigger.closeMenu()"
                class="help-button">
          <i class="fa-solid fa-circle-question"></i>
        </button>

        <mat-menu #menu="matMenu">
          <div class="legend-menu" (mouseleave)="menuTrigger.closeMenu()">
            <div class="menuEl">
              <div class="res-info-circle res-active"></div>
              <p class="description">Aktywna / Opłacona</p>
            </div>
            <div class="menuEl">
              <div class="res-info-circle res-active-unpaid blink"></div>
              <p class="description">Aktywna / Nieopłacona</p>
            </div>
            <div class="menuEl">
              <div class="res-info-circle res-coming"></div>
              <p class="description">Nadchodząca</p>
            </div>
            <div class="menuEl">
              <div class="res-info-circle res-expired"></div>
              <p class="description">Zakończona / Opłacona</p>
            </div>
            <div class="menuEl">
              <div class="res-info-circle res-unpaid blink"></div>
              <p class="description" >Zakończona / Nieopłacona</p>
            </div>
          </div>
        </mat-menu>
      </div>

      <div class="header-row" [style.--days]="days.length">
        <div class="header-cell camperPlaceIndex"></div>

        @for (day of days; track day) {
          <div class="header-cell">
            <p>{{ day }}</p>
            <div class="weekday">
              <p>{{ findWeekDay(year, month, day) }}</p>
            </div>
          </div>
        }
      </div>
      @if (reservationService.rangeResource.isLoading() || camperPlaceService.unpagedCamperPlaceResource.isLoading()) {
        <div class="spinnerContainer">
          <mat-spinner></mat-spinner>
        </div>
      } @else {
        <div class="tableContainer">
          <div class="table">
            @for (camperPlace of camperPlaceService.camperPlaces(); track camperPlace.id) {
              <div class="row" [style.--days]="days.length">

                <div class="cell camperPlaceIndex"><p>{{ camperPlace.index }}</p></div>

                @for (day of days; track day) {
                  <div [ngClass]="
                  {
                    'cell': true,
                    'weekend': this.isWeekend(year, month, day)
                  }"
                       (click)="$event.stopPropagation(); openReservationFormPopup(camperPlace, undefined, day)">
                  </div>
                }

                @for (res of reservationService.reservationsInRange(); track res.id) {
                  @if (res.camperPlace.id === camperPlace.id && isResInCurrentMonth(res)) {
                    <app-reservation-cell
                      [reservation]="res"
                      [onlyCheckoutDisplay]="isOnlyCheckoutDisplayed(DateFormater.MOMENT(res.checkin), DateFormater.MOMENT(res.checkout))"
                      [displayedLength]="getDisplayedLength(DateFormater.MOMENT(res.checkin), DateFormater.MOMENT(res.checkout))"
                      [style.grid-column]="calcResCellLength(res)"
                      [style.left.%]="calcResPlacement(res)"
                      (click)="$event.stopPropagation(); openReservationFormPopup(camperPlace, res)"
                    />
                  }
                }

              </div>
            }
          </div>
        </div>
      }
    </mat-card>
  `,
  styles: `
    mat-card.content {
      padding: 25px;
      width: 100%;
      max-width: 1850px;
      justify-self: center;
      background-color: var(--bg-card) !important;
      border: 1px solid var(--border-color) !important;
      border-radius: var(--radius-md) !important;
    }

    .widget-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding: 0 10px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .help-button {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }

    .help-button:hover {
      color: var(--primary);
    }

    .legend-menu {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 200px;
    }

    .menuEl {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .menuEl p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-primary);
    }

    .header-row,
    .row {
      display: grid;
      grid-template-columns: 80px repeat(var(--days), minmax(0, 1fr));
    }

    .header-cell,
    .cell {
      border: var(--calendar-border);
      box-sizing: border-box;
      justify-items: center;
    }

    .table {
      width: 100%;
      height: 100%;
      z-index: 0;
      overflow: hidden;
    }

    .row {
      display: grid;
      grid-template-columns: 80px repeat(var(--days), 1fr);
      position: relative;
      height: 40px;
    }

    app-reservation-cell {
      height: 80%;
      width: 100%;
      z-index: 100;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
    }

    app-new-date-picker {
      display: block;
      z-index: 200;
      background: transparent;
    }

    .camperPlaceIndex {
      display: flex;
      flex-shrink: 0;
      background-color: var(--bg-card);
      z-index: 200;
      text-align: center;
      align-items: center;
      justify-content: center;
    }

    .weekday {
      width: 100%;
      font-size: xx-small;
      color: var(--text-secondary);
    }

    p {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin: 2px 0;
    }

    .weekend {
      background-color: var(--calendar-weekend);
    }

    .description {
      color: black !important;
    }
  `,
  standalone: true,
})
export class CalendarPage implements OnInit {
  @Input() month: number = new Date().getMonth();
  @Input() year: number = new Date().getFullYear();

  protected readonly camperPlaceService = inject(CamperPlaceService);
  protected readonly reservationService = inject(ReservationService);

  protected readonly weekDays: string[] = [ "Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
  protected days: (number)[] = [];

  private popupFormService = inject(PopupFormService);

  ngOnInit(): void {
    this.generateDays();
    this.getReservationsBetweenGivenMonths();
  }

  private getReservationsBetweenGivenMonths() {
    const currentMonth = DateFormater.MOMENT({year: this.year, month: this.month, day: 1});
    const startOfPreviousMonth = currentMonth.clone().subtract(1, 'month').startOf('month');
    const endOfNextMonth = currentMonth.clone().add(1, 'month').startOf('month');
    this.reservationService.checkinRange.set({
      from: DateFormater.YYYYMMDD(startOfPreviousMonth, DateDelimiter.DASH),
      to: DateFormater.YYYYMMDD(endOfNextMonth, DateDelimiter.DASH)
    });
  }

  changeMonth(event: number) {
    this.month = event;
    this.generateDays();
    this.getReservationsBetweenGivenMonths();
  }

  changeYear(event: number) {
    this.year = event;
    this.generateDays();
    this.getReservationsBetweenGivenMonths();
  }

  generateDays() {
    const daysInMonth = DateFormater.MOMENT({year: this.year, month: this.month, day: 1}).daysInMonth();
    this.days = Array.from({length: daysInMonth}, (_, i) => i + 1);
  }

  protected openReservationFormPopup(cp: CamperPlaceDto, res?: ReservationDto, day?: number) {
    const fd = {
      reservation: res,
      camperPlace: cp,
      year: this.year,
      month: this.month,
      day: day,
    } as ReservationFormData

    this.popupFormService.openReservationFormPopup(fd);
  }

  findWeekDay(year: number, month: number, day: number) {
    return this.weekDays.at(new Date(year, month, day).getDay())
  }

  isWeekend(year: number, month: number, day: number) {
    const weekDay = new Date(year, month, day).getDay();
    return weekDay == 0 || weekDay == 6;
  }

  protected calcResCellLength(res: ReservationDto): string {
    const checkin = DateFormater.MOMENT(res.checkin);
    const checkout = DateFormater.MOMENT(res.checkout);
    if (this.isOnlyCheckoutDisplayed(checkin, checkout)) {
        return '1 / span ' +  checkout.date();
    }
    return (checkin.date() + 1) + ' / span ' + this.getResLength(res);
  }

  protected calcResPlacement(res: ReservationDto): string {
    const checkin = DateFormater.MOMENT(res.checkin);
    const checkout = DateFormater.MOMENT(res.checkout);

    if (this.isOnlyCheckoutDisplayed(checkin, checkout)) {
      return (35 / checkout.date()).toString();
    }
    return this.getResLength(res) > 0 ? (50 / this.getResLength(res)).toString() : '0';
  }

  protected isOnlyCheckoutDisplayed(checkin: moment.Moment, checkout: moment.Moment) {
    return checkin.month() < checkout.month() && checkin.month() != this.month;
  }

  protected getDisplayedLength(checkin: moment.Moment, checkout: moment.Moment) {
    if (this.isOnlyCheckoutDisplayed(checkin, checkout)) {
      return checkout.date();
    }
    return this.days.length - checkin.date();
  }

  private getResLength(res: ReservationDto) {
    const checkin = DateFormater.MOMENT(res.checkin);
    const checkout = DateFormater.MOMENT(res.checkout);
    let length = 0;
    if (checkin.month() < checkout.month()) {
      let daysToEOM = checkin.daysInMonth() - checkin.date();
      length = daysToEOM + checkout.date();
    } else {
      length = checkout.date() - checkin.date();
    }
    return length;
  }

  protected isResInCurrentMonth(res: ReservationDto) {
    return DateFormater.MOMENT(res.checkin).month() === this.month || DateFormater.MOMENT(res.checkout).month() === this.month;
  }

  protected readonly DateFormater = DateFormater;
}
