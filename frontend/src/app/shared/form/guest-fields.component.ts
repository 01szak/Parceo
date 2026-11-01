import {ChangeDetectionStrategy, Component, computed, effect, input, signal} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatLabel, MatError} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from '@angular/material/autocomplete';
import {startWith} from 'rxjs';
import {CountryValue, countryName, filterCountries} from '@shared/domain/countries';

//the guest's data, one field under another; the group is built by FormFactoryService.buildGuestForm()
@Component({
  selector: 'app-guest-fields',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fields" [formGroup]="group()">
      <mat-form-field>
        <mat-label>Imię</mat-label>
        <input matInput formControlName="firstname" autocomplete="off" required>
        <mat-error>Podaj imię.</mat-error>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Nazwisko</mat-label>
        <input matInput formControlName="lastname" autocomplete="off" required>
        <mat-error>Podaj nazwisko.</mat-error>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Telefon</mat-label>
        <input matInput type="tel" formControlName="phoneNumber" autocomplete="off" required>
        <mat-error>Podaj numer telefonu.</mat-error>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Numer rejestracyjny</mat-label>
        <input matInput formControlName="carRegistration" autocomplete="off">
      </mat-form-field>

      <mat-form-field>
        <mat-label>Kraj</mat-label>
        <input matInput formControlName="country" [matAutocomplete]="countries" autocomplete="off" required>
        <mat-autocomplete #countries="matAutocomplete" [displayWith]="countryName">
          @for (c of countryOptions(); track c.isoCode) {
            <mat-option [value]="c">
              <span class="country"><span [class]="'fi fi-' + c.isoCode.toLowerCase()" aria-hidden="true"></span>{{ c.name }}</span>
            </mat-option>
          }
        </mat-autocomplete>
        <mat-error>Wybierz kraj z listy.</mat-error>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" autocomplete="off">
        <mat-error>Podaj poprawny adres email.</mat-error>
      </mat-form-field>
    </div>
  `,
  styles: `
    .fields {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .country {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }
  `,
})
export class GuestFieldsComponent {
  public readonly group = input.required<FormGroup>();

  protected readonly countryName = countryName;
  private readonly countryQuery = signal<CountryValue>('');
  protected readonly countryOptions = computed(() => filterCountries(this.countryQuery()));

  constructor() {
    effect(onCleanup => {
      const country = this.group().get('country')!;
      const subscription = country.valueChanges.pipe(startWith(country.value)).subscribe(v => this.countryQuery.set(v));
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
