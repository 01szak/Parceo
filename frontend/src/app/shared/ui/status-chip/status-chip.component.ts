import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {RESERVATION_CHIP_META, ReservationChipKind} from '@shared/domain/stay-status';

//a reservation status always shown as a word, an icon and a color, never the color alone
@Component({
    selector: 'app-status-chip',
    imports: [MatIcon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {'[class]': '"chip tone-" + meta().tone'},
    template: `
        <mat-icon aria-hidden="true">{{ meta().icon }}</mat-icon>
        <span>{{ meta().label }}</span>
    `,
    styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 28px;
      padding: 0 10px;
      border-radius: var(--radius-sm);
      border: 1px solid;
      font: var(--mat-sys-label-large);
      white-space: nowrap;
      vertical-align: middle;
    }

    mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }

    :host(.tone-arrive) { background: var(--res-arrive-container); color: var(--res-on-arrive-container); border-color: var(--res-arrive); }
    :host(.tone-stay) { background: var(--res-stay-container); color: var(--res-on-stay-container); border-color: var(--res-stay); }
    :host(.tone-leave) { background: var(--res-leave-container); color: var(--res-on-leave-container); border-color: var(--res-leave); }
    :host(.tone-unpaid) { background: var(--res-unpaid-container); color: var(--res-on-unpaid-container); border-color: var(--res-unpaid); }
    :host(.tone-late) { background: var(--res-late-container); color: var(--res-on-late-container); border-color: var(--res-late); }
  `,
    standalone: true
})
export class StatusChipComponent {
  public readonly kind = input.required<ReservationChipKind>();

  protected readonly meta = computed(() => RESERVATION_CHIP_META[this.kind()]);
}
