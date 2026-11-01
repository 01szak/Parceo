import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {PageHeaderComponent} from '@shared/ui/page-header/page-header.component';
import {ReservationsTableComponent} from '@features/reservations/reservations-table/reservations-table.component';
import {PopupFormService} from '@core/services/PopupFormService';

//the start page; for now only the reservation list, the rest of "Dziś" comes in step 7 of PLAN.md
@Component({
  selector: 'app-today-page',
  imports: [MatButton, MatIcon, PageHeaderComponent, ReservationsTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Rezerwacje">
      <button mat-flat-button type="button" class="new" (click)="newReservation()">
        <mat-icon>add</mat-icon>
        Nowa rezerwacja
      </button>
    </app-page-header>
    <app-reservations-table />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      max-width: 1400px;
    }

    .new {
      height: 52px;
      padding: 0 28px;
    }
  `,
})
export class TodayPageComponent {
  private readonly forms = inject(PopupFormService);

  protected newReservation(): void {
    this.forms.openReservationFormPopup();
  }
}
