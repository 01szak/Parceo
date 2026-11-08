import { Component, inject, Input, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgTemplateOutlet } from '@angular/common';
import { PopupFormContainer } from './popup-form-container.component';
import { CamperPlaceTypeService } from '@core/services/openapiwrappers/CamperPlaceTypeService';
import { CamperPlaceTypeDto } from '../../api/models/camper-place-type-dto';
import { FormFactoryService } from '@shared/form/FormFactoryService';
import { CamperPlaceService } from '@core/services/openapiwrappers/CamperPlaceService';
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
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
  `,
  template: `
    <ng-template #formFields>
      <form [formGroup]="formGroup">
        <mat-form-field>
          <mat-label>Nazwa rodzaju</mat-label>
          <input type="text" matInput formControlName="typeName">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Cena za noc (zł)</mat-label>
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
  protected formTitle = this.isUpdate ? 'Rodzaj parcel' : 'Nowy rodzaj parcel';

  protected deleteAction = this.isUpdate ? () => {
    this.confirmationService.openConfirmationPopup({
      title: 'Usunąć rodzaj parcel?',
      message: `Rodzaj „${this.fd.camperPlaceType!.typeName}” zniknie z cennika.`,
      confirmLabel: 'Usuń',
      tone: 'danger',
      action: () => this.camperPlaceTypeService.delete(this.fd.camperPlaceType!.id!).subscribe(() => this.dialogRef?.close()),
    });
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
        title: 'Zmienić nazwę rodzaju?',
        message: 'Nowa nazwa pojawi się przy wszystkich parcelach tego rodzaju.',
        confirmLabel: 'Zmień nazwę',
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
        title: 'Zmienić cenę rodzaju?',
        message: 'Nowa cena obejmie wszystkie parcele tego rodzaju. Parcele z własną ceną zachowają ją, chyba że zaznaczysz je poniżej.',
        confirmLabel: 'Zmień cenę',
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
