import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {MatProgressBar} from '@angular/material/progress-bar';
import {OrganisationService} from '@core/services/openApiWrappers/OrganisationService';

interface CampingDetail {
  label: string;
  value: string;
}

//Ustawienia › Kemping: the campsite's details from GET /organisation, read-only until the backend can save them
@Component({
  selector: 'app-settings-camping',
  imports: [MatIcon, MatProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card" aria-labelledby="camping-title">
      <div class="head">
        <span class="logo" aria-hidden="true"><mat-icon>{{ organisations.logoIcon }}</mat-icon></span>
        <div>
          <h2 id="camping-title">Dane kempingu</h2>
          <p class="lead">Nazwa pojawia się w menu aplikacji. Tych danych nie można jeszcze zmienić w aplikacji.</p>
        </div>
      </div>

      @if (organisations.loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Wczytywanie danych kempingu"/>
      } @else if (organisations.failed()) {
        <p class="error" role="alert">
          <mat-icon aria-hidden="true">cloud_off</mat-icon>
          Nie udało się wczytać danych kempingu. Sprawdź połączenie z internetem i odśwież stronę.
        </p>
      } @else {
        <dl class="details">
          @for (detail of details(); track detail.label) {
            <div class="detail">
              <dt>{{ detail.label }}</dt>
              <dd [class.empty]="!detail.value">{{ detail.value || 'Nie podano' }}</dd>
            </div>
          }
        </dl>
      }
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

      mat-icon {
        width: 36px;
        height: 36px;
        font-size: 36px;
      }
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

    .details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--space-4) var(--space-6);
      margin: 0;
    }

    .detail {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      min-width: 0;
    }

    dt {
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-on-surface-variant);
    }

    dd {
      margin: 0;
      font: var(--mat-sys-body-large);
      overflow-wrap: anywhere;

      &.empty {
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .error {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      font: var(--mat-sys-body-large);
    }
  `,
  standalone: true
})
export class SettingsCampingComponent {
  protected readonly organisations = inject(OrganisationService);

  protected readonly details = computed<CampingDetail[]>(() => {
    const organisation = this.organisations.organisation();
    return [
      {label: 'Nazwa kempingu', value: organisation?.organisationName ?? ''},
      {label: 'Adres', value: organisation?.address ?? ''},
      {label: 'Telefon', value: organisation?.phoneNumber ?? ''},
      {label: 'Email', value: organisation?.email ?? ''},
    ];
  });
}
