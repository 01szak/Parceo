import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {MatProgressBar} from '@angular/material/progress-bar';
import {ReservationDto} from '../../api';
import {StatusChipComponent} from '@shared/ui/status-chip/status-chip.component';

export type TodayListTone = 'arrive' | 'leave' | 'unpaid';

export interface TodayListItem {
  reservation: ReservationDto;
  name: string;
  details: string;
  unpaid: boolean;
}

const ICONS: Record<TodayListTone, string> = {
  arrive: 'arrow_forward',
  leave: 'arrow_back',
  unpaid: 'payments',
};

//one of the "Przyjazdy", "Wyjazdy", "Do zapłaty" cards; a row opens the reservation, the optional button acts on it
@Component({
  selector: 'app-today-list-card',
  imports: [MatIcon, MatButton, MatProgressBar, StatusChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <span class="badge" [class]="'badge tone-' + tone()"><mat-icon aria-hidden="true">{{ icon() }}</mat-icon></span>
      <h2>{{ title() }}</h2>
      @if (!failed()) {
        <span class="count" [attr.aria-label]="count() + ' pozycji'">{{ count() }}</span>
      }
    </header>
    <div class="progress">
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Wczytywanie"/>
      }
    </div>
    <ul class="list-container">
        @for (item of items(); track item.reservation.id) {
          <li>
            <button type="button" class="row" (click)="open.emit(item)">
            <span class="name">
              {{ item.name }}
              @if (item.unpaid) {
                <app-status-chip kind="unpaid"/>
              }
            </span>
              <span class="details">{{ item.details }}</span>
            </button>
            @if (actionLabel()) {
              <button mat-flat-button type="button" class="action" (click)="action.emit(item)">{{ actionLabel() }}
              </button>
            }
          </li>
        } @empty {
          @if (failed()) {
            <li class="empty error" role="alert">Nie udało się wczytać listy.</li>
          } @else if (!loading()) {
            <li class="empty">{{ emptyText() }}</li>
          }
        }
    </ul>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      border-radius: 20px;
      background: var(--mat-sys-surface-container-low);
      overflow: hidden;
    }

    header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 18px 20px 14px;
    }

    h2 {
      flex: 1;
      margin: 0;
      font: var(--mat-sys-title-large);
      font-weight: 700;
    }

    .count {
      font: var(--mat-sys-title-large);
      font-weight: 700;
      color: var(--mat-sys-on-surface-variant);
      font-variant-numeric: tabular-nums;
    }

    .badge {
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border-radius: var(--radius-md);
      border: 1px solid;
    }

    .tone-arrive {
      background: var(--res-arrive-container);
      color: var(--res-on-arrive-container);
      border-color: var(--res-arrive);
    }

    .tone-leave {
      background: var(--res-leave-container);
      color: var(--res-on-leave-container);
      border-color: var(--res-leave);
    }

    .tone-unpaid {
      background: var(--res-unpaid-container);
      color: var(--res-on-unpaid-container);
      border-color: var(--res-unpaid);
    }

    .progress {
      height: 4px;
    }

    /* about six rows are visible, the rest scrolls; a row with a wrapped name may be taller than 78px */
    .list-container {
      display: grid;
      grid-template-rows: repeat(6, auto);
      overflow-y: auto;
      max-height: calc(78px * 6);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding-right: 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .row {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      padding: 14px 20px;
      border: none;
      background: transparent;
      color: var(--mat-sys-on-surface);
      font: inherit;
      text-align: left;
      cursor: pointer;

      &:hover {
        background: color-mix(in srgb, var(--mat-sys-on-surface) 6%, transparent);
      }
    }

    .name {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
      font: var(--mat-sys-title-medium);
      font-weight: 600;
    }

    .details {
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface-variant);
    }

    .action {
      flex: none;
    }

    .error {
      color: var(--mat-sys-error);
    }

    .empty {
      padding: 16px 20px;
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface-variant);
    }

    footer {
      padding: 12px 20px 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  standalone: true
})
export class TodayListCardComponent {
  public readonly title = input.required<string>();
  public readonly tone = input.required<TodayListTone>();
  public readonly items = input.required<readonly TodayListItem[]>();
  //all matching reservations, the card may show fewer
  public readonly count = input.required<number>();
  public readonly loading = input(false);
  public readonly failed = input(false);
  public readonly emptyText = input('Brak.');
  public readonly actionLabel = input<string>();

  public readonly open = output<TodayListItem>();
  public readonly action = output<TodayListItem>();

  protected readonly icon = computed(() => ICONS[this.tone()]);
}
