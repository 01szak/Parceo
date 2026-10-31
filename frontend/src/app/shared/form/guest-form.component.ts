import { Component, inject, Input, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import { PopupFormContainer } from './popup-form-container.component';
import { GuestDto } from '../../api/models/guest-dto';
import {FormFactoryService} from '@shared/form/FormFactoryService';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from '@angular/material/autocomplete';
import {map, Observable, startWith} from 'rxjs';
import { COUNTRIES, Country } from '@shared/constants/COUNTRIES';
import {GuestService} from '@core/services/openApiWrappers/GuestService';
import {PopupConfirmationService} from '@core/services/PopupConfirmationService';
import {ConfirmationData} from '@shared/popups/confirmation/popup-confirmation.component';

export type GuestFormData = { guest?: GuestDto };

@Component({
  selector: 'app-guest-form',
  imports: [
    PopupFormContainer,
    MatFormField,
    ReactiveFormsModule,
    MatLabel,
    MatInput,
    NgTemplateOutlet,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    AsyncPipe,
  ],
  standalone: true,
  template: `
    <ng-template #formFields>
      <form [formGroup]="formGroup">
        <mat-form-field>
          <mat-label>Imię</mat-label>
          <input type="text" matInput formControlName="firstname">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Nazwisko</mat-label>
          <input type="text" matInput formControlName="lastname">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Email</mat-label>
          <input type="email" matInput formControlName="email">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Nr Telefonu</mat-label>
          <input type="tel" matInput formControlName="phoneNumber">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Rejestracja</mat-label>
          <input type="text" matInput formControlName="carRegistration">
        </mat-form-field>

        <mat-form-field style="width: 100%">
          <mat-label>Kraj</mat-label>
          <input type="text" matInput formControlName="country" [matAutocomplete]="auto">
          <mat-autocomplete #auto="matAutocomplete" [displayWith]="countryDisplayFunc">
            @for (c of filteredCountries | async; track c.isoCode) {
              <mat-option [value]="c">
                <div style="display: flex; flex-direction: row; gap: 5px" >
                  <span [class]="'fi fi-' + c.isoCode.toLowerCase()"></span>
                  <span>{{ c.name }}</span>
                </div>
              </mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
      </form>
    </ng-template>

    @if (isDialog) {
      <app-popup-form-container
        [formTitle]="formTitle"
        [deleteAction]="deleteAction"
        [isUpdate]="isUpdate"
        [proceedAction]="onSave">
        <ng-container *ngTemplateOutlet="formFields"></ng-container>
      </app-popup-form-container>
    } @else {
      <ng-container *ngTemplateOutlet="formFields"></ng-container>
    }
  `,
})
export class GuestFormComponent implements OnInit {
  @Input() isDialog = true;
  @Input() formGroup!: FormGroup;

  private readonly guestService = inject(GuestService);
  private readonly factory = inject(FormFactoryService);
  private readonly fd: GuestFormData = inject<GuestFormData>(MAT_DIALOG_DATA, { optional: true }) || {};
  private readonly confirmationService = inject(PopupConfirmationService);
  private readonly dialogRef = inject(MatDialogRef<GuestFormComponent>);

  protected filteredCountries!: Observable<Country[]>;
  protected isUpdate = !!this.fd?.guest;
  protected formTitle = this.isUpdate ? 'Edytuj Gościa' : 'Nowy Gość';
  protected deleteAction = () =>
     this.guestService.delete(this.fd.guest!.id!).subscribe(() => {this.dialogRef.close()});

  private _filter(value: string | Country): Country[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : value.name.toLowerCase();
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(filterValue)
    );
  }

  ngOnInit() {
    if (!this.formGroup) {
      this.formGroup = this.factory.buildGuestForm();
      if (this.fd?.guest) {
        this.formGroup.patchValue(this.fd.guest);
      }
    }

    this.filteredCountries = this.formGroup.get('country')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  protected onSave = () => {
    if (this.formGroup.invalid) return;

    const rawCountry = this.formGroup.value.country as Country | string | null | undefined;
    const countryIso = typeof rawCountry === 'string' ? rawCountry : rawCountry?.isoCode;

    const payload: GuestDto = {
      ...this.formGroup.value,
      country: countryIso
    };

    const action = () => this.isUpdate
      ? this.guestService.update(payload).subscribe(() => {this.dialogRef.close()})
      : this.guestService.create(payload).subscribe(() => {this.dialogRef.close()});
    this.confirmationService.openConfirmationPopup({action: action} as ConfirmationData)
  }

  protected countryDisplayFunc(c: Country | string): string {
    if (typeof c === 'string') {
      return COUNTRIES.find(country => c.toLowerCase() === country.isoCode!.toLowerCase())!.name;
    } else  {
      return c?.name || '';
    }
  }

}
