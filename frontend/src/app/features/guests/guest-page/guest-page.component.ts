import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatNativeDateModule} from '@angular/material/core';
import {
  DEFAULT_PAGEABLE,
  Field,
  RegularTableComponent
} from '@shared/ui/data-table/regular-table.component';
import {PopupFormService} from '@core/services/PopupFormService';
import {GuestFormData} from '@shared/form/guest-form.component';
import {GuestDto} from '../../../api';
import {GuestService} from '@core/services/openApiWrappers/GuestService';

@Component({
  selector: 'users',
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatNativeDateModule,
    RegularTableComponent,
  ],
  template:  `
    <app-regular-table
      [dtoData]="guestService.pageResource.value().content"
      [isLoading]="guestService.pageResource.isLoading()"
      [totalElements]="guestService.pageResource.value().totalElements"
      [tabColumns]="columns"
      [pageableSignal]="guestService.pageable"
      [searchRequestSignal]="guestService.searchRequest"
      [onRowClickFunc]="openFormPopup.bind(this)"
      [createFunc]="openFormPopup.bind(this)"
    >
    </app-regular-table>
  `,
  styles:  ``,
  standalone: true
})
export class GuestPage implements OnInit {
  private formService = inject(PopupFormService);
  protected guestService = inject(GuestService);

  protected columns: Field[] = [
    {name: 'firstname', displayName: 'Imie', type: 'TEXT', value: ''},
    {name: 'lastname', displayName: 'Nazwisko', type: 'TEXT', value: ''},
    {name: 'email', displayName: 'Email', type: 'TEXT', value: ''},
    {name: 'phoneNumber', displayName: 'Numer telefonu', type: 'TEXT', value: ''},
    {name: 'carRegistration', displayName: 'Rejestracja', type: 'TEXT', value: ''},
    {name: 'country', displayName: 'Narodowość', type: 'TEXT', value: ''},
  ];

  ngOnInit(): void {
    this.guestService.resetSignals();
    this.guestService.pageable.set(DEFAULT_PAGEABLE)
  }

  protected openFormPopup(guest?: GuestDto) {
    const guestFd: GuestFormData = {guest: guest};
    this.formService.openGuestFormPopup(guestFd);
  }

}
