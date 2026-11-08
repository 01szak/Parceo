import {ChangeDetectionStrategy, Component, computed, effect, input, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {
  MatDateRangeInput,
  MatDateRangePicker,
  MatDatepickerActions,
  MatDatepickerApply,
  MatDatepickerCancel,
  MatDatepickerToggle,
  MatDatepickerToggleIcon,
  MatEndDate,
  MatStartDate
} from '@angular/material/datepicker';
import {MatError, MatFormField, MatHint, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Moment} from 'moment';
import {startWith} from 'rxjs';
import {stayHint} from '@shared/domain/stay-range';

export type StayRangeGroup = FormGroup<{
  start: FormControl<Moment | null>;
  end: FormControl<Moment | null>;
}>;

//set on the group by the form when the range shares a night with another reservation
export interface OccupiedRangeError {
  occupied: { label: string };
}

const ISO = 'YYYY-MM-DD';

/**
 * The stay as one field: arrival and departure picked in one calendar.
 * Shows the number of nights under the field. Occupied nights are not marked here (the calendar shows them);
 * a stay overlapping another reservation is reported under the field.
 */
@Component({
  selector: 'app-date-range-field',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatHint,
    MatError,
    MatSuffix,
    MatDateRangeInput,
    MatStartDate,
    MatEndDate,
    MatDateRangePicker,
    MatDatepickerToggle,
    MatDatepickerToggleIcon,
    MatDatepickerActions,
    MatDatepickerApply,
    MatDatepickerCancel,
    MatButton,
    MatIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field class="field">
      <mat-label>{{ label() }}</mat-label>
      <mat-date-range-input [formGroup]="group()" [rangePicker]="picker">
        <input matStartDate formControlName="start" placeholder="Przyjazd" required>
        <input matEndDate formControlName="end" placeholder="Wyjazd" required>
      </mat-date-range-input>
      @if (hint()) {
        <mat-hint class="hint">{{ hint() }}</mat-hint>
      }
      <mat-error>{{ fieldError() }}</mat-error>
      <mat-datepicker-toggle matIconSuffix [for]="picker">
        <mat-icon matDatepickerToggleIcon>date_range</mat-icon>
      </mat-datepicker-toggle>
      <mat-date-range-picker #picker>
        <mat-date-range-picker-actions>
          <button mat-button matDateRangePickerCancel>Anuluj</button>
          <button mat-flat-button matDateRangePickerApply>Zastosuj</button>
        </mat-date-range-picker-actions>
      </mat-date-range-picker>
    </mat-form-field>

    @if (errorMessage(); as message) {
      <p class="error" role="alert">{{ message }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .field {
      width: 100%;
    }

    .hint {
      font: var(--mat-sys-body-large);
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .error {
      margin: var(--space-1) 0 0 var(--space-4);
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-error);
    }
  `,
})
export class DateRangeFieldComponent {
  public readonly group = input.required<StayRangeGroup>();
  public readonly label = input('Przyjazd i wyjazd');

  private readonly value = signal<{ start: Moment | null, end: Moment | null }>({start: null, end: null});
  private readonly status = signal({touched: false, errors: null as Record<string, unknown> | null});

  protected readonly hint = computed(() => {
    const {start, end} = this.value();
    return start && end ? stayHint(start.format(ISO), end.format(ISO)) : '';
  });

  //errors of the two inputs, shown inside the field
  protected readonly fieldError = computed(() => {
    this.status();
    const {start, end} = this.group().controls;
    if (start.hasError('required') || end.hasError('required')) return 'Wybierz datę przyjazdu i wyjazdu.';
    if (start.hasError('matStartDateInvalid') || end.hasError('matEndDateInvalid')) return 'Wyjazd musi być po przyjeździe.';
    return 'Sprawdź daty.';
  });

  protected readonly errorMessage = computed(() => {
    const {touched, errors} = this.status();
    if (!touched || !errors) return '';
    const occupied = (errors as Partial<OccupiedRangeError>).occupied;
    return occupied ? `W tym terminie parcela jest zajęta (${occupied.label}). Wybierz inne daty albo inną parcelę.` : '';
  });

  constructor() {
    //the group comes from the parent form, so its changes are followed for as long as it is bound
    effect(onCleanup => {
      const group = this.group();
      const subscription = group.events.pipe(startWith(null)).subscribe(() => {
        this.value.set(group.getRawValue());
        this.status.set({touched: group.touched, errors: group.errors});
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
