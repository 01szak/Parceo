import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatFormField, MatLabel, MatError} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatChipSet, MatChip} from '@angular/material/chips';

export interface SaveFilterDialogData {
  //what the filter contains, e.g. ["Widok: Aktywne rezerwacje", "Płatność: Nieopłacona"]
  summary: readonly string[];
}

//asks for the name of a filter; closes with the trimmed name or undefined
@Component({
  selector: 'app-save-filter-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatButton,
    MatChipSet,
    MatChip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Zapisz filtr</h2>
    <mat-dialog-content class="content">
      <p class="lead">Filtr pojawi się na liście „Pokaż” i od razu zostanie włączony.</p>
      <mat-form-field class="name">
        <mat-label>Nazwa filtra</mat-label>
        <input matInput [formControl]="name" required placeholder="np. Domki do zapłaty" (keydown.enter)="save()">
        <mat-error>Podaj nazwę filtra.</mat-error>
      </mat-form-field>
      <p class="summary-label">Filtr obejmuje</p>
      <mat-chip-set aria-label="Zawartość filtra">
        @for (item of data.summary; track item) {
          <mat-chip disabled>{{ item }}</mat-chip>
        }
      </mat-chip-set>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">Anuluj</button>
      <button mat-flat-button type="button" (click)="save()">Zapisz filtr</button>
    </mat-dialog-actions>
  `,
  styles: `
    .content {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .lead, .summary-label {
      margin: 0;
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface-variant);
    }

    .name {
      width: 100%;
    }

    mat-chip {
      --mat-chip-disabled-container-opacity: 1;
      --mat-chip-disabled-label-text-color: var(--mat-sys-on-secondary-container);
      --mat-chip-elevated-disabled-container-color: var(--mat-sys-secondary-container);
    }
  `,
})
export class SaveFilterDialogComponent {
  protected readonly data = inject<SaveFilterDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SaveFilterDialogComponent, string>);

  protected readonly name = new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)]});

  protected save(): void {
    if (this.name.invalid) {
      this.name.markAsTouched();
      return;
    }
    this.dialogRef.close(this.name.value.trim());
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
