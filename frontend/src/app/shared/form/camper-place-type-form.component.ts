import { Component, inject, Input, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgTemplateOutlet } from '@angular/common';
import { PopupFormContainer } from './popup-form-container.component';
import { CamperPlaceTypeService } from '@core/services/openApiWrappers/CamperPlaceTypeService';
import { CamperPlaceTypeDto } from '../../api/models/camper-place-type-dto';
import { FormFactoryService } from '@shared/form/FormFactoryService';
import { CamperPlaceService } from '@core/services/openApiWrappers/CamperPlaceService';
import { PopupConfirmationService } from '@core/services/PopupConfirmationService';
import { CamperPlacesWithUniquePricesComponent } from '@shared/popups/confirmation/camper-places-with-unique-prices.component';
import { take } from 'rxjs';

export type CamperPlaceTypeFormData = { camperPlaceType?: CamperPlaceTypeDto };

@Component({
  selector: 'app-camper-place-type-form',
  imports: [
    PopupFormContainer,
    MatFormField,
    ReactiveFormsModule,
    MatLabel,
    MatInput,
    NgTemplateOutlet,
  ],
  standalone: true,
  styles: `
    form {
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
    }
  `,
  template: `
    <ng-template #formFields>
      <form [formGroup]="formGroup">
        <mat-form-field>
          <mat-label>Nazwa Typu</mat-label>
          <input type="text" matInput formControlName="typeName">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Cena</mat-label>
          <input type="number" matInput formControlName="price">
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
export class CamperPlaceTypeFormComponent implements OnInit {
  @Input() isDialog = true;
  @Input() formGroup!: FormGroup;

  private readonly camperPlaceTypeService = inject(CamperPlaceTypeService);
  private readonly camperPlaceService = inject(CamperPlaceService);
  private readonly confirmationService = inject(PopupConfirmationService);
  private readonly factory = inject(FormFactoryService);
  private readonly dialogRef = inject(MatDialogRef<CamperPlaceTypeFormComponent>, { optional: true });
  private readonly fd: CamperPlaceTypeFormData = inject<CamperPlaceTypeFormData>(MAT_DIALOG_DATA, { optional: true }) || {};

  protected isUpdate = !!this.fd?.camperPlaceType;
  protected formTitle = this.isUpdate ? 'Edytuj Typ' : 'Nowy Typ';

  protected deleteAction = this.isUpdate ? () => {
    this.camperPlaceTypeService.delete(this.fd.camperPlaceType!.id!).subscribe(() => this.dialogRef?.close());
  } : null;

  ngOnInit() {
    if (!this.formGroup) {
      this.formGroup = this.factory.buildCamperPlaceTypeForm();
      if (this.fd?.camperPlaceType) {
        this.formGroup.patchValue(this.fd.camperPlaceType);
      }
    }
  }

  protected onSave = () => {
    if (this.formGroup.invalid) return;

    const payload = this.formGroup.value as CamperPlaceTypeDto;
    if (!this.isUpdate) {
      this.save(payload);
      return;
    }
    payload.id = this.fd.camperPlaceType?.id;

    const original = this.fd.camperPlaceType!;
    if (Number(original.price) !== Number(payload.price)) {
      this.confirmPriceChange(payload);
    } else if (original.typeName !== payload.typeName) {
      this.confirmationService.openConfirmationPopup({
        title: 'Zmiana Nazwy',
        message: 'Zmiana nazwy spowoduje zmianę dla wszystkich parcel przypisanych do tego typu. Czy chcesz kontynuować?',
        action: () => this.save(payload)
      });
    } else {
      this.save(payload);
    }
  }

  private confirmPriceChange(payload: CamperPlaceTypeDto) {
    this.camperPlaceService.getCamperPlacesWithUniquePriceAndCamperTypeId(payload.id!).pipe(take(1)).subscribe(places => {
      const selectedIds: number[] = [];
      this.confirmationService.openConfirmationPopup({
        title: 'Zmiana Ceny',
        message: 'Zmiana ceny typu spowoduje nadpisanie wszystkich parcel, które ten typ posiadają. Jeżeli chcesz nadpisać również te z własną ceną, zaznacz je poniżej:',
        component: CamperPlacesWithUniquePricesComponent,
        componentData: {
          rows: {[payload.id!]: places},
          selectedIds: selectedIds,
          updatedTypes: [payload]
        },
        action: () => this.save(payload, selectedIds)
      });
    });
  }

  private save(payload: CamperPlaceTypeDto, cpIdToOverride?: number[]) {
    const action$ = this.isUpdate
      ? this.camperPlaceTypeService.update(payload, cpIdToOverride)
      : this.camperPlaceTypeService.create(payload);

    action$.subscribe(() => {
      this.dialogRef?.close(true);
      this.camperPlaceService.pageResource.reload();
    });
  }
}
