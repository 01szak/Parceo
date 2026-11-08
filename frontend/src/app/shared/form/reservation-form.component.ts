import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {AbstractControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {rxResource, takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {debounceTime, distinctUntilChanged, filter, finalize, map, startWith} from 'rxjs';
import {Moment} from 'moment';
import {MatFormField, MatHint, MatLabel, MatError, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatAutocomplete, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {ReservationService} from '@core/services/openapiwrappers/ReservationService';
import {CamperPlaceService} from '@core/services/openapiwrappers/CamperPlaceService';
import {GuestService} from '@core/services/openapiwrappers/GuestService';
import {PopupConfirmationService} from '@core/services/PopupConfirmationService';
import {FormFactoryService, GuestMode} from '@shared/form/FormFactoryService';
import {PopupFormContainer} from './popup-form-container.component';
import {GuestFieldsComponent} from './guest-fields.component';
import {DateRangeFieldComponent, OccupiedRangeError, StayRangeGroup} from '@shared/ui/date-range-field/date-range-field.component';
import {DateDelimiter, DateFormater} from '@shared/helper/DateFormater';
import {firstConflict, nightsBetween, nightsLabel, stayLabel, withoutOwnStay} from '@shared/domain/stay-range';
import {countryIso} from '@shared/domain/countries';
import {formatPln} from '@shared/domain/money';
import {CamperPlaceDto, GuestDto, ReservationDto} from '../../api';

export type ReservationFormData = {
  reservation?: ReservationDto;
  //a day clicked in the calendar (month counted from 0)
  year?: number;
  month?: number;
  day?: number;
  camperPlace?: CamperPlaceDto;
};

interface StayIso {
  checkin: string;
  checkout: string;
}

const ISO = 'YYYY-MM-DD';
const GUEST_SEARCH_MIN_LENGTH = 2;

//the stay must not share a night with another reservation of the chosen camper place
function freeStayValidator(occupied: () => readonly string[][]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const {start, end} = (control as StayRangeGroup).getRawValue();
    if (!start || !end || !end.isAfter(start)) return null;
    const conflict = firstConflict(start.format(ISO), end.format(ISO), occupied());
    return conflict ? {occupied: {label: stayLabel(conflict)}} satisfies OccupiedRangeError : null;
  };
}

@Component({
  selector: 'app-reservation-form',
  imports: [
    ReactiveFormsModule,
    PopupFormContainer,
    DateRangeFieldComponent,
    GuestFieldsComponent,
    MatFormField,
    MatLabel,
    MatHint,
    MatError,
    MatSuffix,
    MatInput,
    MatSelect,
    MatOption,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatCheckbox,
    MatButton,
    MatIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation-form.component.scss',
})
export class ReservationFormComponent {
  private readonly reservationService = inject(ReservationService);
  private readonly camperPlaceService = inject(CamperPlaceService);
  private readonly guestService = inject(GuestService);
  private readonly confirmation = inject(PopupConfirmationService);
  private readonly dialogRef = inject(MatDialogRef<ReservationFormComponent>);
  private readonly data = inject<ReservationFormData | null>(MAT_DIALOG_DATA, {optional: true}) ?? {};

  protected readonly form: FormGroup = inject(FormFactoryService).buildReservationForm();
  protected readonly stay = this.form.get('stay') as StayRangeGroup;
  protected readonly guestGroup = this.form.get('guest') as FormGroup;

  protected readonly isUpdate = !!this.data.reservation;
  protected readonly formTitle = this.isUpdate ? 'Edycja rezerwacji' : 'Nowa rezerwacja';

  // ---------- stay and camper place ----------
  private readonly stayIso = toSignal(this.stay.valueChanges.pipe(
    startWith(null),
    map(() => this.toStayIso()),
    distinctUntilChanged((a, b) => a?.checkin === b?.checkin && a?.checkout === b?.checkout),
  ), {initialValue: undefined});

  protected readonly selectedPlace = toSignal(
    this.form.get('camperPlace')!.valueChanges.pipe(startWith(null), map(() => this.form.get('camperPlace')!.value as CamperPlaceDto | null)),
    {initialValue: null}
  );

  private readonly availableResource = rxResource({
    params: () => this.stayIso(),
    stream: ({params}) => this.camperPlaceService.getAvailable(params.checkin, params.checkout),
  });

  private readonly occupancyResource = rxResource({
    params: () => this.selectedPlace()?.id,
    stream: ({params}) => this.camperPlaceService.getOccupiedNights(params),
  });

  private readonly priceResource = rxResource({
    params: () => {
      const stay = this.stayIso();
      const placeId = this.selectedPlace()?.id;
      return stay && placeId ? {placeId, ...stay} : undefined;
    },
    stream: ({params}) => this.camperPlaceService.getPrice(params.placeId, params.checkin, params.checkout),
  });

  //nights taken by other reservations of the chosen camper place
  protected readonly occupiedNights = computed(() => {
    const occupied = this.occupancyResource.hasValue() ? this.occupancyResource.value() : [];
    const own = this.data.reservation;
    return own ? withoutOwnStay(occupied, own.checkin!, own.checkout!) : occupied;
  });

  //before the dates are known every camper place is offered; afterwards only the free ones (plus the edited one)
  protected readonly placeOptions = computed<CamperPlaceDto[]>(() => {
    if (!this.stayIso()) return this.camperPlaceService.camperPlaces();
    const available = this.availableResource.hasValue() ? this.availableResource.value() : [];
    const own = this.data.reservation?.camperPlace;
    return own && !available.some(p => p.id === own.id) ? [own, ...available] : available;
  });

  protected readonly placesLoading = computed(() => this.availableResource.isLoading());

  // ---------- price ----------
  //the backend sets the price from the price list on save; the form only shows it
  //an edited reservation keeps its saved price until the stay or the camper place changes
  private readonly showsSavedPrice = computed(() => {
    const saved = this.data.reservation;
    const stay = this.stayIso();
    return !!saved && saved.price !== undefined && !!stay
      && stay.checkin === saved.checkin && stay.checkout === saved.checkout
      && this.selectedPlace()?.id === saved.camperPlace?.id;
  });

  private readonly price = computed<number | null>(() => {
    if (this.showsSavedPrice()) return this.data.reservation!.price!;
    return this.priceResource.hasValue() ? this.priceResource.value() : null;
  });

  protected readonly priceText = computed(() => {
    const price = this.price();
    return price === null ? '—' : formatPln(price);
  });

  //in the footer: "3 noce, według cennika", "3 noce, cena zapisana w rezerwacji"
  protected readonly priceHint = computed(() => {
    const stay = this.stayIso();
    if (!stay || !this.selectedPlace()) return 'Wybierz termin i parcelę, żeby zobaczyć cenę.';
    const nights = nightsLabel(nightsBetween(stay.checkin, stay.checkout));
    if (this.showsSavedPrice()) return `${nights}, cena zapisana w rezerwacji`;
    if (this.priceResource.isLoading()) return `${nights}, liczę cenę…`;
    if (this.priceResource.status() === 'error') return `${nights}, cena zostanie policzona przy zapisie`;
    return `${nights}, według cennika`;
  });

  // ---------- guest ----------
  protected readonly guestMode = toSignal(
    this.form.get('guestMode')!.valueChanges.pipe(startWith(this.form.get('guestMode')!.value)),
    {initialValue: 'new' as GuestMode}
  );
  protected readonly selectedGuest = signal<GuestDto | null>(null);
  protected readonly editingGuest = signal(false);
  protected readonly guestSuggestions = computed(() => this.guestService.page().content as GuestDto[]);
  protected readonly showGuestFields = computed(() => this.guestMode() === 'new' || this.editingGuest());

  protected readonly submitted = signal(false);
  //a save request is running; also blocks Enter in the form (ngSubmit)
  protected readonly saving = signal(false);

  private readonly notesChanged = toSignal(
    this.form.get('notes')!.valueChanges,
    {initialValue: this.form.get('notes')!.value}
  );
  protected readonly notesLen = computed(() => (this.notesChanged() ?? '').length)

  constructor() {
    this.stay.addValidators(freeStayValidator(() => this.occupiedNights()));
    //the occupancy arrives after the dates were picked, so the stay is checked again when it changes
    effect(() => {
      this.occupiedNights();
      this.stay.updateValueAndValidity({emitEvent: false});
      this.stay.markAsTouched();
    });

    this.setupGuestSearch();
    this.patchInitialValues();
  }

  protected guestLabel(guest: GuestDto | string | null): string {
    if (!guest || typeof guest === 'string') return guest ?? '';
    return `${guest.firstname ?? ''} ${guest.lastname ?? ''}`.trim();
  }

  protected guestDetails(guest: GuestDto): string {
    return [guest.phoneNumber, guest.carRegistration, guest.email].filter(Boolean).join(', ');
  }

  protected compareById(a: { id?: number } | null, b: { id?: number } | null): boolean {
    return !!a && !!b ? a.id === b.id : a === b;
  }

  protected placeLabel(place: CamperPlaceDto): string {
    const type = place.camperPlaceType?.typeName;
    return type ? `Parcela ${place.index}, ${type}` : `Parcela ${place.index}`;
  }

  protected selectGuest(guest: GuestDto): void {
    this.selectedGuest.set(guest);
    this.editingGuest.set(false);
    this.guestGroup.reset();
    this.patchGuest(guest);
  }

  protected clearSelectedGuest(): void {
    this.selectedGuest.set(null);
    this.editingGuest.set(false);
    this.guestGroup.reset();
    this.form.get('guestSearch')!.setValue(null);
  }

  protected startEditingGuest(): void {
    this.editingGuest.set(true);
  }

  protected onGuestModeChange(mode: GuestMode): void {
    this.editingGuest.set(false);
    if (mode === 'new') {
      this.selectedGuest.set(null);
      this.guestGroup.reset();
    }
  }

  protected readonly save = () => {
    if (this.saving()) return;
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (!this.isValid()) return;

    const payload: ReservationDto = {
      id: this.data.reservation?.id,
      checkin: this.stayIso()!.checkin,
      checkout: this.stayIso()!.checkout,
      camperPlace: this.form.get('camperPlace')!.value,
      paid: this.form.get('isPaid')!.value,
      guest: this.guestPayload(),
      notes: this.form.get('notes')!.value,
    };

    const request = this.isUpdate ? this.reservationService.update(payload) : this.reservationService.create(payload);
    this.saving.set(true);
    request.pipe(finalize(() => this.saving.set(false))).subscribe(() => {
      this.dialogRef.close();
    });
  };

  protected readonly confirmDelete = () => {
    const reservation = this.data.reservation!;
    this.confirmation.openConfirmationPopup({
      title: 'Usunąć rezerwację?',
      message: `${this.guestLabel(reservation.guest ?? null)}, parcela ${reservation.camperPlace?.index}, `
        + `${DateFormater.DDMMYYYY(reservation.checkin!, DateDelimiter.DOT)} – ${DateFormater.DDMMYYYY(reservation.checkout!, DateDelimiter.DOT)}.`,
      confirmLabel: 'Usuń',
      tone: 'danger',
      action: () => this.reservationService.delete(reservation.id!).subscribe(() => this.dialogRef.close()),
    });
  };

  protected guestSearchMissing(): boolean {
    return this.submitted() && this.guestMode() === 'existing' && !this.selectedGuest();
  }

  private isValid(): boolean {
    const guestValid = this.showGuestFields() ? this.guestGroup.valid : !!this.selectedGuest()?.id;
    return this.stay.valid && this.form.get('camperPlace')!.valid && guestValid;
  }

  private guestPayload(): GuestDto {
    if (!this.showGuestFields()) return this.selectedGuest()!;
    const guest = this.guestGroup.getRawValue();
    return {...guest, id: guest.id ?? undefined, country: countryIso(guest.country)};
  }

  private toStayIso(): StayIso | undefined {
    const {start, end} = this.stay.getRawValue() as { start: Moment | null, end: Moment | null };
    if (!start?.isValid() || !end?.isValid() || !end.isAfter(start)) return undefined;
    return {checkin: start.format(ISO), checkout: end.format(ISO)};
  }

  private patchGuest(guest: GuestDto): void {
    this.guestGroup.patchValue({...guest, country: guest.country ?? ''});
  }

  private setupGuestSearch(): void {
    this.guestService.resetSignals();
    this.form.get('guestSearch')!.valueChanges.pipe(
      debounceTime(200),
      filter((v): v is string => typeof v === 'string' && v.trim().length >= GUEST_SEARCH_MIN_LENGTH),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(text => this.guestService.searchRequest.set({
      searchCriteria: [{key: 'lastname', value: text.trim(), operation: 'LIKE'}]
    }));
  }

  private patchInitialValues(): void {
    const {reservation, camperPlace, year, month, day} = this.data;
    if (reservation) {
      this.form.patchValue({
        stay: {start: DateFormater.MOMENT(reservation.checkin!), end: DateFormater.MOMENT(reservation.checkout!)},
        camperPlace: reservation.camperPlace,
        isPaid: !!reservation.paid,
        guestMode: 'existing',
        notes: reservation.notes ?? '',
      });
      if (reservation.guest) this.selectGuest(reservation.guest);
      return;
    }
    if (year !== undefined && month !== undefined && day !== undefined) {
      this.stay.patchValue({start: DateFormater.MOMENT({year, month, day})});
    }
    if (camperPlace) this.form.patchValue({camperPlace});
  }
}
