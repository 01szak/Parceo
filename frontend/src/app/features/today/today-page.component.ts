import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import moment from 'moment';
import {ReservationDto, SearchCriteria} from '../../api';
import {ResourceType} from '@core/services/openApiWrappers/service-facade.service';
import {createPagedQuery} from '@core/services/openApiWrappers/paged-query';
import {CamperPlaceService} from '@core/services/openApiWrappers/CamperPlaceService';
import {ReservationService} from '@core/services/openApiWrappers/ReservationService';
import {PopupFormService} from '@core/services/PopupFormService';
import {ReservationsTableComponent} from '@features/reservations/reservations-table/reservations-table.component';
import {TodayListCardComponent, TodayListItem} from './today-list-card.component';
import {FreeParcelsStripComponent, StripRange} from './free-parcels-strip.component';
import {FreeParcel, FreeParcelsDialogComponent, FreeParcelsDialogData} from './free-parcels-dialog.component';
import {availabilityPerDay, DayAvailability, freeNightsInARow, Stay} from '@shared/domain/occupancy';
import {arrivalsSentence, unpaidSentence} from '@shared/domain/today-summary';
import {addDays, nightsBetween, nightsLabel} from '@shared/domain/stay-range';
import {formatPln} from '@shared/domain/money';
import {TodayService} from '@core/services/TodayService';

//occupancy is loaded for the longest strip range
const OCCUPANCY_HORIZON = 30;

const equals = (key: string, value: string): SearchCriteria => ({key, operation: 'EQUALS', value, joinOperator: 'AND'});

@Component({
  selector: 'app-today-page',
  imports: [MatButton, MatIcon, ReservationsTableComponent, TodayListCardComponent, FreeParcelsStripComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today-page.component.html',
  styleUrl: './today-page.component.scss',
  standalone: true
})
export class TodayPageComponent {
  private readonly forms = inject(PopupFormService);
  private readonly reservations = inject(ReservationService);
  private readonly camperPlaces = inject(CamperPlaceService);
  private readonly dialog = inject(MatDialog);

  //moves on at midnight: the lists, the free places and the date at the top change together
  private readonly today = inject(TodayService).today;
  protected readonly dateLabel = computed(() => capitalize(moment(this.today()).locale('pl').format('dddd, D MMMM YYYY')));

  protected readonly arrivals = createPagedQuery<ReservationDto>(ResourceType.RESERVATION, {unpaged: true});
  protected readonly departures = createPagedQuery<ReservationDto>(ResourceType.RESERVATION, {unpaged: true});
  protected readonly unpaid = createPagedQuery<ReservationDto>(ResourceType.RESERVATION, {unpaged: true, sort: {field: 'checkout', direction: 'ASC'}});
  private readonly occupancy = createPagedQuery<ReservationDto>(ResourceType.RESERVATION, {unpaged: true});

  protected readonly stripRange = signal<StripRange>(14);

  protected readonly arrivalItems = computed(() => this.toItems(this.arrivals.page().content, r => this.stayDetails(r)));
  protected readonly departureItems = computed(() => this.toItems(this.departures.page().content, r => `Parcela ${r.camperPlace?.index}`));
  protected readonly unpaidItems = computed(() => this.toItems(this.unpaid.page().content, r => this.paymentDetails(r), false));

  private readonly placeIds = computed(() => this.camperPlaces.camperPlaces().map(p => p.id!));
  private readonly stays = computed<Stay[]>(() => this.occupancy.page().content
    .filter(r => r.camperPlace?.id !== undefined && r.checkin && r.checkout)
    .map(r => ({camperPlaceId: r.camperPlace!.id!, checkin: r.checkin!, checkout: r.checkout!})));
  protected readonly availability = computed(() => availabilityPerDay(this.placeIds(), this.stays(), this.today(), this.stripRange()));

  protected readonly arrivalsText = computed(() =>
    arrivalsSentence(this.arrivals.page().totalElements, this.departures.page().totalElements));
  protected readonly freeTonight = computed(() => this.availability()[0]?.freePlaceIds.length ?? 0);
  protected readonly totalPlaces = computed(() => this.placeIds().length);
  protected readonly unpaidText = computed(() => unpaidSentence(this.unpaid.page().totalElements));
  private readonly sources = [this.arrivals, this.departures, this.unpaid, this.occupancy];
  //the numbers of the summary are shown only once every source answered; later reloads keep the old sentence
  protected readonly loadedOnce = signal(false);
  //the summary sentence would state wrong numbers, so it is replaced by an error when any of its sources failed
  protected readonly failed = computed(() =>
    this.sources.some(q => q.failed()) || this.camperPlaces.unpagedCamperPlaceResource.status() === 'error');

  constructor() {
    effect(() => {
      if (!this.sources.some(q => q.loading()) && !this.failed()) this.loadedOnce.set(true);
    });

    //new criteria for a new day; each query reloads by itself when its criteria change
    effect(() => {
      const today = this.today();
      untracked(() => {
        this.arrivals.criteria.set([equals('checkin', today)]);
        this.departures.criteria.set([equals('checkout', today)]);
        //guests already on site or arriving today who have not paid yet
        this.unpaid.criteria.set([equals('paid', 'false'), {key: 'checkin', operation: 'LESS_THEN', value: addDays(today, 1), joinOperator: 'AND'}]);
        this.occupancy.criteria.set([
          {key: 'checkin', operation: 'LESS_THEN', value: addDays(today, OCCUPANCY_HORIZON), joinOperator: 'AND'},
          {key: 'checkout', operation: 'GREATER_THEN', value: today, joinOperator: 'AND'},
        ]);
      });
    });
  }

  protected newReservation(): void {
    this.forms.openReservationFormPopup();
  }

  protected openReservation(item: TodayListItem): void {
    this.forms.openReservationFormPopup({reservation: item.reservation});
  }

  protected markPaid(item: TodayListItem): void {
    this.reservations.update({...item.reservation, paid: true}).subscribe();
  }

  protected showFreeParcels(day: DayAvailability): void {
    const free = new Set(day.freePlaceIds);
    //the occupancy is known only up to the horizon counted from today
    const knownNights = nightsBetween(day.date, addDays(this.today(), OCCUPANCY_HORIZON));
    const parcels: FreeParcel[] = this.camperPlaces.camperPlaces()
      .filter(place => free.has(place.id!))
      .map(place => ({place, freeNights: freeNightsInARow(place.id!, this.stays(), day.date, knownNights)}));

    const data: FreeParcelsDialogData = {
      dayLabel: capitalize(moment(day.date).locale('pl').format('dddd, DD.MM.YYYY')),
      totalPlaces: this.totalPlaces(),
      parcels,
      horizon: knownNights,
    };
    this.dialog.open(FreeParcelsDialogComponent, {data, width: '760px', maxWidth: 'calc(100vw - 32px)'})
      .afterClosed()
      .subscribe(place => {
        if (!place) return;
        const date = moment(day.date);
        this.forms.openReservationFormPopup({camperPlace: place, year: date.year(), month: date.month(), day: date.date()});
      });
  }

  private toItems(reservations: ReservationDto[], details: (r: ReservationDto) => string, markUnpaid = true): TodayListItem[] {
    return reservations.map(reservation => ({
      reservation,
      name: `${reservation.guest?.firstname ?? ''} ${reservation.guest?.lastname ?? ''}`.trim(),
      details: details(reservation),
      unpaid: markUnpaid && !reservation.paid,
    }));
  }

  private stayDetails(r: ReservationDto): string {
    const nights = r.checkin && r.checkout ? nightsLabel(nightsBetween(r.checkin, r.checkout)) : '';
    return [`Parcela ${r.camperPlace?.index}`, nights, r.guest?.carRegistration].filter(Boolean).join(', ');
  }

  private paymentDetails(r: ReservationDto): string {
    const today = this.today();
    const when = r.checkout === today ? 'wyjazd dziś' : r.checkin === today ? 'przyjazd dziś' : `parcela ${r.camperPlace?.index}`;
    return [r.price === undefined ? '' : formatPln(r.price), when].filter(Boolean).join(', ');
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
