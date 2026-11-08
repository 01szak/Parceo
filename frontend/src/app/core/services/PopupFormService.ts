import {inject, Injectable} from '@angular/core';
import {SideSheetService} from '@core/services/SideSheetService';
import {ReservationFormComponent, ReservationFormData} from '@shared/form/reservation-form.component';
import {GuestFormComponent, GuestFormData} from '@shared/form/guest-form.component';
import {CamperPlaceFormComponent, CamperPlaceFormData} from '@shared/form/camper-place-form.component';
import {CamperPlaceTypeFormComponent, CamperPlaceTypeFormData} from '@shared/form/camper-place-type-form.component';

//every edit form of the app opens the same way: as a side sheet
@Injectable({ providedIn: 'root' })
export class PopupFormService {

  private readonly sideSheet = inject(SideSheetService);

  openReservationFormPopup(reservationFd?: ReservationFormData) {
    return this.sideSheet.open(ReservationFormComponent, reservationFd);
  }

  openGuestFormPopup(guestFd?: GuestFormData) {
    return this.sideSheet.open(GuestFormComponent, guestFd);
  }

  openCamperPlaceFormPopup(camperPlaceFd?: CamperPlaceFormData) {
    return this.sideSheet.open(CamperPlaceFormComponent, camperPlaceFd);
  }

  openCamperPlaceTypeFormPopup(camperPlaceTypeFd?: CamperPlaceTypeFormData) {
    return this.sideSheet.open(CamperPlaceTypeFormComponent, camperPlaceTypeFd);
  }
}
