import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {DayAvailability} from '@shared/domain/occupancy';

const WEEKDAYS_SHORT = ['nd', 'pon', 'wt', 'śr', 'czw', 'pt', 'sob'];

export type StripRange = 14 | 30;

//one tile per night with the number of free parcels; a tile opens the list of those parcels
@Component({
  selector: 'app-free-parcels-strip',
  imports: [MatButtonToggleGroup, MatButtonToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <div class="title">
        <h2>Wolne parcele</h2>
        <p>Kliknij dzień, żeby zobaczyć, które parcele są wolne.</p>
      </div>
      <mat-button-toggle-group [value]="range()" (change)="rangeChange.emit($event.value)" aria-label="Okres">
        <mat-button-toggle [value]="14">2 tygodnie</mat-button-toggle>
        <mat-button-toggle [value]="30">Miesiąc</mat-button-toggle>
      </mat-button-toggle-group>
    </header>

    <div class="days" role="list">
      @for (tile of tiles(); track tile.day.date) {
        <button type="button" class="day" role="listitem" [class.full]="tile.free === 0"
                [attr.aria-label]="tile.aria" (click)="daySelected.emit(tile.day)">
          <span class="weekday">{{ tile.weekday }}</span>
          <span class="date">{{ tile.date }}</span>
          <span class="free">{{ tile.free }}</span>
          <span class="weekday">wolne</span>
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-3);
    }

    .title {
      flex: 1 1 240px;
    }

    h2 {
      margin: 0;
      font: var(--mat-sys-headline-small);
      font-weight: 700;
    }

    p {
      margin: 2px 0 0;
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface-variant);
    }

    .days {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 6px;
    }

    .day {
      flex: none;
      width: 92px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 12px 8px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-lowest);
      color: var(--mat-sys-on-surface);
      font: inherit;
      cursor: pointer;

      &:hover {
        border-color: var(--mat-sys-primary);
      }

      &.full .free {
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .weekday {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }

    .date {
      font: var(--mat-sys-title-small);
      font-variant-numeric: tabular-nums;
    }

    .free {
      font: var(--mat-sys-headline-medium);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class FreeParcelsStripComponent {
  public readonly days = input.required<readonly DayAvailability[]>();
  public readonly range = input.required<StripRange>();

  public readonly rangeChange = output<StripRange>();
  public readonly daySelected = output<DayAvailability>();

  protected readonly tiles = computed(() => this.days().map((day, index) => {
    const [, month, dayOfMonth] = day.date.split('-');
    const weekday = index === 0 ? 'dziś' : WEEKDAYS_SHORT[new Date(`${day.date}T12:00:00`).getDay()];
    const free = day.freePlaceIds.length;
    return {day, weekday, date: `${dayOfMonth}.${month}`, free, aria: `${dayOfMonth}.${month}: ${free} wolnych parcel`};
  }));
}
