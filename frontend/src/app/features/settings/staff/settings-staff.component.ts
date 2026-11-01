import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {Router} from '@angular/router';
import {rxResource, toSignal} from '@angular/core/rxjs-interop';
import {MatDialog} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {EmployeeService} from '@core/services/openApiWrappers/EmployeeService';
import {SessionService} from '@core/services/SessionService';
import {PopupConfirmationService} from '@core/services/PopupConfirmationService';
import {NotificationService} from '@core/services/NotificationService';
import {Invitation, StaffApi, StaffRole} from '@core/mocks/staff.mock';
import {LOGIN_PATH} from '@core/guards/auth.guard';
import {MockNoticeComponent} from '@shared/ui/mock-notice/mock-notice.component';
import {InviteDialogComponent, ROLE_LABELS} from './invite-dialog.component';

/**
 * Ustawienia › Pracownicy. "Moje konto" comes from the backend (GET /user);
 * the invitations are a MOCK kept in this browser until the backend can manage users.
 */
@Component({
  selector: 'app-settings-staff',
  imports: [MatButton, MatIconButton, MatIcon, MockNoticeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-staff.component.html',
  styleUrl: './settings-staff.component.scss',
})
export class SettingsStaffComponent {
  private readonly staff = inject(StaffApi);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly confirmation = inject(PopupConfirmationService);
  private readonly notification = inject(NotificationService);

  protected readonly me = toSignal(inject(EmployeeService).employee$, {initialValue: null});
  protected readonly myRole = computed(() => this.roleLabel(this.me()?.role));

  private readonly invitationsResource = rxResource({defaultValue: [] as Invitation[], stream: () => this.staff.invitations()});
  protected readonly invitations = computed(() => this.invitationsResource.hasValue() ? this.invitationsResource.value() : []);

  protected roleLabel(role?: string): string {
    return ROLE_LABELS[role as StaffRole] ?? role ?? '';
  }

  protected dayMonthYear(iso: string): string {
    return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
  }

  protected invite(): void {
    this.dialog.open<InviteDialogComponent, void, Invitation>(InviteDialogComponent, {width: '480px', maxWidth: 'calc(100vw - 32px)'})
      .afterClosed()
      .subscribe(invitation => {
        if (!invitation) return;
        this.staff.invite(invitation).subscribe(list => {
          this.invitationsResource.set(list);
          this.notification.success(`Dodano zaproszenie dla ${invitation.email}`);
        });
      });
  }

  protected cancelInvitation(invitation: Invitation): void {
    this.confirmation.openConfirmationPopup({
      title: 'Anulować zaproszenie?',
      message: `${invitation.email} nie dostanie dostępu do kempingu.`,
      confirmLabel: 'Anuluj zaproszenie',
      cancelLabel: 'Zostaw',
      tone: 'danger',
      action: () => this.staff.cancel(invitation.email).subscribe(list => this.invitationsResource.set(list)),
    });
  }

  protected logout(): void {
    this.session.clear();
    this.router.navigate([LOGIN_PATH]);
  }
}
