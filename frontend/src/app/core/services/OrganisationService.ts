import {computed, inject, Injectable} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {tap} from 'rxjs';
import {DEFAULT_ORGANISATION, Organisation, OrganisationApi} from '@core/mocks/organisation.mock';
import {NotificationService} from '@core/services/NotificationService';

//the camping's own data (name in the menu, Ustawienia › Kemping); served by OrganisationApi (a MOCK for now)
@Injectable({providedIn: 'root'})
export class OrganisationService {
  private readonly api = inject(OrganisationApi);
  private readonly notification = inject(NotificationService);

  private readonly resource = rxResource({
    defaultValue: DEFAULT_ORGANISATION,
    stream: () => this.api.get(),
  });

  public readonly organisation = computed(() => this.resource.hasValue() ? this.resource.value() : DEFAULT_ORGANISATION);

  //"LP" for "Leśna Polana", shown where a logo would be
  public readonly initials = computed(() => this.organisation().name
    .split(/\s+/).filter(Boolean).slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('') || 'P');

  public save(organisation: Organisation) {
    return this.api.save(organisation).pipe(tap({
      next: saved => {
        this.resource.set(saved);
        this.notification.success('Zapisano dane kempingu');
      },
      error: error => this.notification.error(error),
    }));
  }
}
