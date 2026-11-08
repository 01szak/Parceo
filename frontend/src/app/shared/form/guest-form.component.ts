import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {finalize} from 'rxjs';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {GuestDto} from '../../api/models/guest-dto';
import {FormFactoryService} from '@shared/form/FormFactoryService';
import {GuestService} from '@core/services/openapiwrappers/GuestService';
import {PopupConfirmationService} from '@core/services/PopupConfirmationService';
import {PopupFormContainer} from './popup-form-container.component';
import {GuestFieldsComponent} from './guest-fields.component';
import {countryIso} from '@shared/domain/countries';

export type GuestFormData = { guest?: GuestDto };

@Component({
  selector: 'app-guest-form',
  imports: [PopupFormContainer, GuestFieldsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-popup-form-container
      [formTitle]="formTitle"
      [isUpdate]="isUpdate"
      [deleteAction]="confirmDelete"
      [proceedAction]="save"
      [saving]="saving()"
      [saveLabel]="isUpdate ? 'Zapisz zmiany' : 'Dodaj gościa'">
      <app-guest-fields [group]="form" />
    </app-popup-form-container>
  `,
})
export class GuestFormComponent {
  private readonly guestService = inject(GuestService);
  private readonly confirmation = inject(PopupConfirmationService);
  private readonly dialogRef = inject(MatDialogRef<GuestFormComponent>);
  private readonly data = inject<GuestFormData | null>(MAT_DIALOG_DATA, {optional: true}) ?? {};

  protected readonly form = inject(FormFactoryService).buildGuestForm();
  protected readonly isUpdate = !!this.data.guest;
  protected readonly formTitle = this.isUpdate ? 'Dane gościa' : 'Nowy gość';
  protected readonly saving = signal(false);

  constructor() {
    if (this.data.guest) this.form.patchValue(this.data.guest);
  }

  protected readonly save = () => {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: GuestDto = {...this.form.getRawValue(), country: countryIso(this.form.value.country)};
    const request = this.isUpdate ? this.guestService.update(payload) : this.guestService.create(payload);
    this.saving.set(true);
    request.pipe(finalize(() => this.saving.set(false))).subscribe(() => this.dialogRef.close());
  };

  protected readonly confirmDelete = () => {
    const guest = this.data.guest!;
    this.confirmation.openConfirmationPopup({
      title: 'Usunąć gościa?',
      message: `${guest.firstname} ${guest.lastname} zniknie z listy gości.`,
      confirmLabel: 'Usuń',
      tone: 'danger',
      action: () => this.guestService.delete(guest.id!).subscribe(() => this.dialogRef.close()),
    });
  };
}
