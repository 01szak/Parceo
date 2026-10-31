import {inject, Injectable} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {CamperPlaceDto} from '../../api/models/camper-place-dto';
import {CamperPlaceTypeDto} from '../../api/models/camper-place-type-dto';
import {DateFormater} from '@shared/helper/DateFormater';
import {GuestDto, ReservationDto} from '../../api';

@Injectable({
  providedIn: 'root'
})
export class FormFactoryService {
  private fb = inject(FormBuilder);

  public buildReservationForm(): FormGroup {
    return this.fb.group({
      checkinDate: new FormControl<moment.Moment | null>(null, [Validators.required]),
      checkoutDate: new FormControl<moment.Moment | null>(null, [Validators.required]),
      camperPlace: new FormControl<CamperPlaceDto | null>(null, [Validators.required]),
      guest: this.buildGuestForm(),
      isPaid: new FormControl<boolean>(false),
      guestSearch: new FormControl<string>(''),
    });
  }

  public patchReservation(form: FormGroup, reservation: ReservationDto) {
    form.patchValue({
      checkinDate: DateFormater.MOMENT(reservation.checkin),
      checkoutDate: DateFormater.MOMENT(reservation.checkout),
      camperPlace: reservation.camperPlace,
      isPaid: reservation.paid,
    });
    this.patchGuest(form, reservation.guest!);
  }

  public patchGuest(form: FormGroup, guest: GuestDto) {
    form.get('guest')?.patchValue({
      id: guest.id,
      firstname: guest.firstname || '',
      lastname: guest.lastname || '',
      email: guest.email || '',
      phoneNumber: guest.phoneNumber || '',
      carRegistration: guest.carRegistration || '',
      country: guest.country || '',
    });
  }

  public buildGuestForm(): FormGroup {
    return this.fb.group({
      id: new FormControl<number | null>(null),
      firstname: new FormControl<string>('', [Validators.required]),
      lastname: new FormControl<string>('', [Validators.required]),
      email: new FormControl<string>('', [Validators.email]),
      phoneNumber: new FormControl<string>(''),
      carRegistration: new FormControl<string>(''),
      country: new FormControl<string>(''),
    });
  }

  public buildCamperPlaceForm(): FormGroup {
    return this.fb.group({
      id: new FormControl<number | null>(null),
      index: new FormControl<string>('', [Validators.required]),
      camperPlaceType: new FormControl<CamperPlaceTypeDto | null>(null, [Validators.required]),
      price: new FormControl<number>(0, [Validators.required, Validators.min(0)]),
    });
  }

  public buildCamperPlaceTypeForm(): FormGroup {
    return this.fb.group({
      id: new FormControl<number | null>(null),
      typeName: new FormControl<string>('', [Validators.required]),
      price: new FormControl<number>(0, [Validators.required, Validators.min(0)]),
    });
  }
}
