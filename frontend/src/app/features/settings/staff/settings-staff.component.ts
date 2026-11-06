import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {Router} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {UserService} from '@core/services/openApiWrappers/UserService';
import {SessionService} from '@core/services/SessionService';
import {LOGIN_PATH} from '@core/guards/auth.guard';

/**
 * Ustawienia › Pracownicy. "Moje konto" comes from the backend (GET /user);
 * the invitations are a MOCK kept in this browser until the backend can manage users.
 */
@Component({
  selector: 'app-settings-staff',
  imports: [MatButton, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-staff.component.html',
  styleUrl: './settings-staff.component.scss',
  standalone: true
})
export class SettingsStaffComponent {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly me = inject(UserService).user;
  protected readonly isOwner = computed(() => this.me()?.role === "ADMIN" || this.me()?.role === "OWNER");
  protected readonly myRole = computed(() => this.me()?.role);

  protected createAppUser(): void {
    console.error("NOT IMPLEMENTED");
  }

  protected logout(): void {
    this.session.clear();
    this.router.navigate([LOGIN_PATH]);
  }
}
