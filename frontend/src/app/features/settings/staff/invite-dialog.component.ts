import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatFormField, MatLabel, MatError, MatHint} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatButton} from '@angular/material/button';
import {Invitation, StaffRole} from '@core/mocks/staff.mock';
import {todayIso} from '@shared/domain/iso-date';

export const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: 'Właściciel',
  REGULAR: 'Recepcja',
};

//asks for the email and the role of a new person; closes with the invitation
@Component({
  selector: 'app-invite-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatFormField,
    MatLabel,
    MatError,
    MatHint,
    MatInput,
    MatSelect,
    MatOption,
    MatButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Zaproś osobę</h2>
    <mat-dialog-content class="content" [formGroup]="form">
      <mat-form-field>
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" required (keydown.enter)="invite()">
        <mat-error>Podaj poprawny adres email.</mat-error>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Rola</mat-label>
        <mat-select formControlName="role" required>
          <mat-option value="REGULAR">{{ roleLabels.REGULAR }}</mat-option>
          <mat-option value="ADMIN">{{ roleLabels.ADMIN }}</mat-option>
        </mat-select>
        <mat-hint>Recepcja widzi rezerwacje i kalendarz. Właściciel także raporty i ustawienia.</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">Anuluj</button>
      <button mat-flat-button type="button" (click)="invite()">Zaproś</button>
    </mat-dialog-actions>
  `,
  styles: `
    .content {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
  `,
})
export class InviteDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<InviteDialogComponent, Invitation>);
  protected readonly roleLabels = ROLE_LABELS;

  protected readonly form = new FormGroup({
    email: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.email]}),
    role: new FormControl<StaffRole>('REGULAR', {nonNullable: true}),
  });

  protected invite(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close({...this.form.getRawValue(), email: this.form.getRawValue().email.trim(), sentOn: todayIso()});
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
