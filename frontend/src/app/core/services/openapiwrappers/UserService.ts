import {computed, inject, Injectable} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {from} from 'rxjs';
import {Api, getUser, UserDto} from '../../../api';
import {SessionService} from '@core/services/SessionService';

//the logged-in user (GET /user): name and role in the menu, Ustawienia › Pracownicy › Moje konto
@Injectable({providedIn: 'root'})
export class UserService {
  private readonly api = inject(Api);
  private readonly session = inject(SessionService);

  //loads after login, clears after logout and loads again when someone else logs in
  private readonly resource = rxResource({
    params: () => this.session.token() ?? undefined,
    stream: () => from(this.api.invoke(getUser)),
  });

  public readonly user = computed<UserDto | null>(() =>
    this.resource.hasValue() ? this.resource.value() : null);
  public readonly loading = this.resource.isLoading;
  public readonly failed = computed(() => this.resource.status() === 'error');
}
