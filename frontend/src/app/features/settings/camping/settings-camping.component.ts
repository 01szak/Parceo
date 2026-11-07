import {ChangeDetectionStrategy, Component, effect, inject, untracked} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormField, MatLabel, MatError, MatHint} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {OrganisationService} from '@core/services/OrganisationService';
import {MockNoticeComponent} from '@shared/ui/mock-notice/mock-notice.component';

//Ustawienia › Kemping: data guests see in confirmations; kept by a MOCK until the backend has an endpoint
@Component({
  selector: 'app-settings-camping',
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatError, MatHint, MatInput, MatButton, MockNoticeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-mock-notice />

    <section class="card" aria-labelledby="camping-title">
      <div class="head">
        <span class="logo" aria-hidden="true">{{ organisations.initials() }}</span>
        <div>
          <h2 id="camping-title">Dane kempingu</h2>
          <p class="lead">Nazwa pojawia się w menu aplikacji.</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()" class="fields">
        <mat-form-field class="wide">
          <mat-label>Nazwa kempingu</mat-label>
          <input matInput formControlName="name" required>
          <mat-error>Podaj nazwę kempingu.</mat-error>
        </mat-form-field>
        <mat-form-field class="wide">
          <mat-label>Adres</mat-label>
          <input matInput formControlName="address" placeholder="ul. Sosnowa 4, 84-120 Władysławowo">
        </mat-form-field>
        <mat-form-field>
          <mat-label>Telefon</mat-label>
          <input matInput type="tel" formControlName="phone">
        </mat-form-field>
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email">
          <mat-error>Podaj poprawny adres email.</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Przyjazdy od godziny</mat-label>
          <input matInput type="time" formControlName="checkinFrom" required>
          <mat-hint>Pokazujemy ją gościom przy rezerwacji.</mat-hint>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Wyjazdy do godziny</mat-label>
          <input matInput type="time" formControlName="checkoutUntil" required>
        </mat-form-field>
        <div class="actions wide">
          <button mat-flat-button type="submit" [disabled]="form.pristine">Zapisz zmiany</button>
        </div>
      </form>
    </section>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .card {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      padding: var(--space-6);
      border-radius: 20px;
      background: var(--mat-sys-surface-container-low);
    }

    .head {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .logo {
      width: 64px;
      height: 64px;
      flex: none;
      display: grid;
      place-items: center;
      border-radius: var(--radius-lg);
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font: var(--mat-sys-headline-small);
      font-weight: 700;
    }

    h2 {
      margin: 0;
      font: var(--mat-sys-title-large);
      font-weight: 700;
    }

    .lead {
      margin: var(--space-1) 0 0;
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface-variant);
    }

    .fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--space-4);
    }

    .wide {
      grid-column: 1 / -1;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
    }
  `,
})
export class SettingsCampingComponent {
  protected readonly organisations = inject(OrganisationService);

  protected readonly form = new FormGroup({
    name: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    address: new FormControl('', {nonNullable: true}),
    phone: new FormControl('', {nonNullable: true}),
    email: new FormControl('', {nonNullable: true, validators: [Validators.email]}),
    checkinFrom: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    checkoutUntil: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
  });

  constructor() {
    //fill the form when the data arrives, as long as nobody has started editing it
    effect(() => {
      const organisation = this.organisations.organisation();
      untracked(() => {
        if (this.form.pristine) this.form.reset(organisation);
      });
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.organisations.save(this.form.getRawValue()).subscribe(saved => this.form.reset(saved));
  }
}
