import {ChangeDetectionStrategy, Component, computed, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatPaginatorModule} from '@angular/material/paginator';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatNativeDateModule} from '@angular/material/core';
import {ReservationService, ReservationStatus} from '@core/services/openApiWrappers/ReservationService';
import {PopupFormService} from '@core/services/PopupFormService';
import {
  Field,
  RegularTableComponent,
} from '@shared/ui/data-table/regular-table.component';
import {ReservationFormData} from '@shared/form/reservation-form.component';
import {ReservationDto} from '../../../api';
import {CamperPlaceService} from '@core/services/openApiWrappers/CamperPlaceService';

@Component({
  selector: 'reservations',
  imports: [
    CommonModule,
    MatPaginatorModule,
    FormsModule,
    ReactiveFormsModule,
    MatNativeDateModule,
    RegularTableComponent,
  ],
  template: `
    <app-regular-table
      [dtoData]="reservationService.pageResource.value().content"
      [displayData]="mapToDisplayData()"
      [isLoading]="reservationService.pageResource.isLoading()"
      [totalElements]="reservationService.pageResource.value().totalElements"
      [tabColumns]="fields()"
      [pageableSignal]="reservationService.pageable"
      [searchRequestSignal]="reservationService.searchRequest"
      [onRowClickFunc]="openFormPopup.bind(this)"
      [createFunc]="openFormPopup.bind(this)"
      [checkboxChangeFunc]="checkboxChangeFunc"
    >
    </app-regular-table>
  `,
  styles: ``,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservationPage implements OnInit {
  protected reservationService = inject(ReservationService);
  private camperPlaceService = inject(CamperPlaceService);
  private formService = inject(PopupFormService);

  protected fields = computed<Field[]>(() => [
    {name: 'checkin', displayName: 'Wjazd', type: 'DATE', value: ''},
    {name: 'checkout', displayName: 'Wyjazd', type: 'DATE', value: ''},
    {name: 'guest', displayName: 'Gość', type: 'OBJECT', innerFields: [{type: "TEXT", displayName: 'Imie', name: 'firstname', value: ''}, {type: "TEXT", displayName: 'Nazwisko', name: 'lastname', value: ''}]},
    {name: 'camperPlace', displayName: 'Parcela', type: 'OBJECT', innerFields: [{type: "NUMBER", displayName: 'Indeks', name: 'index', selectOption: this.camperPlaceService.indexes(), value: ''}]},
    {name: 'reservationStatus', displayName: 'Status', type: 'STATUS', value: '', selectOption: ["ACTIVE", "COMING", "EXPIRED"] as ReservationStatus[] },
    {name: 'paid', displayName: 'Opłacone', type: 'BOOLEAN', value: ''},
    {name: 'creator', displayName: 'Autor', type: "OBJECT", innerFields: [{type: "TEXT", displayName: 'Nazwa użytkownika', name: 'username', value: ''}]},
  ]);


  ngOnInit(): void {
    this.reservationService.resetSignals();
    this.camperPlaceService.resetSignals();
  }

  protected mapToDisplayData() {
    return this.reservationService.pageResource.value().content.map(r  => {
      const res = r as ReservationDto;
      return {
        id: res.id,
        checkin: res.checkin,
        checkout: res.checkout,
        guest: `${res.guest?.firstname || ''} ${res.guest?.lastname || ''}`.trim(),
        camperPlace: res.camperPlace?.index ?? '',
        reservationStatus: res.reservationStatus!,
        paid: res.paid,
        creator: `${res.creator?.username || ''}`
      }
    })
  }

  protected openFormPopup(reservation?: ReservationDto) {
    const reservationFd: ReservationFormData = {reservation: reservation};
    this.formService.openReservationFormPopup(reservationFd);
  }

  protected checkboxChangeFunc = (r: ReservationDto) => {
    this.reservationService.update({...r, paid: !r.paid}).subscribe();
  };

}

