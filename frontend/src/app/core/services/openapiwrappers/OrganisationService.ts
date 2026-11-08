import {computed, inject, Injectable} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {from} from 'rxjs';
import {Api, getOrganisation, OrganisationDto} from '../../../api';
import {SessionService} from '@core/services/SessionService';

//shown in the menu until the campsite's details arrive, or when they cannot be loaded
const FALLBACK_NAME = 'Mój kemping';

//the logged-in user's campsite (GET /organisation): name in the menu, Ustawienia › Kemping; read-only for now
@Injectable({providedIn: 'root'})
export class OrganisationService {
  private readonly api = inject(Api);
  private readonly session = inject(SessionService);

  //loads after login, clears after logout and loads again when someone else logs in
  private readonly resource = rxResource({
    params: () => this.session.token() ?? undefined,
    stream: () => from(this.api.invoke(getOrganisation)),
  });

  public readonly organisation = computed<OrganisationDto | null>(() =>
    this.resource.hasValue() ? this.resource.value() : null);
  public readonly loading = this.resource.isLoading;
  public readonly failed = computed(() => this.resource.status() === 'error');

  public readonly name = computed(() => this.organisation()?.organisationName || FALLBACK_NAME);

  /**
   * Material Symbols icon shown where the campsite's logo goes (menu, Ustawienia › Kemping).
   * A campsite's own SVG can replace it later, e.g. registered in MatIconRegistry and shown with svgIcon.
   */
  public readonly logoIcon = 'camping';
}
