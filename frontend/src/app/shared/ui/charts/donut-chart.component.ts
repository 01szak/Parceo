import {ChangeDetectionStrategy, Component, computed, input, signal} from '@angular/core';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  //a CSS color, e.g. var(--chart-1); slices are colored in a fixed order, never by rank
  color: string;
}

const RADIUS = 84;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
//a thin gap of the surface color between slices
const GAP = 2;

/**
 * A donut with the total in the middle and a legend with values and shares. Colors alone never carry
 * the meaning: every slice is also named in the legend. Hovering a slice or a legend row highlights it.
 */
@Component({
  selector: 'app-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="donut">
      <svg viewBox="0 0 220 220" role="img" [attr.aria-label]="ariaLabel()">
        @for (slice of arcs(); track slice.key; let i = $index) {
          <circle cx="110" cy="110" [attr.r]="radius" fill="none"
                  [attr.stroke]="slice.color" [attr.stroke-width]="hovered() === i ? 44 : 36"
                  [attr.stroke-dasharray]="slice.dash" [attr.stroke-dashoffset]="slice.offset"
                  (mouseenter)="hovered.set(i)" (mouseleave)="hovered.set(-1)" />
        }
      </svg>
      <div class="center" aria-hidden="true">
        <span class="center-value">{{ centerValue() }}</span>
        <span class="center-label">{{ centerLabel() }}</span>
      </div>
    </div>

    <ul class="legend">
      @for (slice of arcs(); track slice.key; let i = $index) {
        <li [class.active]="hovered() === i" (mouseenter)="hovered.set(i)" (mouseleave)="hovered.set(-1)">
          <span class="swatch" [style.background]="slice.color"></span>
          <span class="name">{{ slice.label }}</span>
          <span class="value">{{ valueLabel()(slice.value) }}</span>
          <span class="share">{{ slice.percent }}%</span>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-6);
    }

    .donut {
      position: relative;
      width: 220px;
      height: 220px;
      flex: none;
    }

    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    circle {
      transition: stroke-width 150ms cubic-bezier(.2, 0, 0, 1);
    }

    .center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      pointer-events: none;
    }

    .center-value {
      font: var(--mat-sys-headline-medium);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .center-label {
      max-width: 120px;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }

    .legend {
      flex: 1 1 220px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: grid;
      grid-template-columns: 14px minmax(0, 1fr) auto 52px;
      align-items: center;
      gap: var(--space-3);
      height: 44px;
      padding: 0 var(--space-2);
      border-radius: var(--radius-sm);

      &.active {
        background: var(--mat-sys-surface-container-highest);
      }
    }

    .swatch {
      width: 14px;
      height: 14px;
      border-radius: 4px;
    }

    .name {
      font-weight: 600;
    }

    .value {
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface-variant);
      font-variant-numeric: tabular-nums;
    }

    .share {
      text-align: right;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class DonutChartComponent {
  public readonly slices = input.required<readonly DonutSlice[]>();
  //"7 gości", "1 gość": the caller knows how to decline its unit
  public readonly valueLabel = input<(value: number) => string>(value => String(value));
  //shown in the middle when nothing is hovered, e.g. "gości w październiku"
  public readonly totalLabel = input('');

  protected readonly radius = RADIUS;
  protected readonly hovered = signal(-1);

  private readonly total = computed(() => this.slices().reduce((sum, s) => sum + s.value, 0));

  protected readonly arcs = computed(() => {
    const total = this.total() || 1;
    let offset = 0;
    return this.slices().map(slice => {
      const length = slice.value / total * CIRCUMFERENCE;
      const arc = {
        ...slice,
        percent: Math.round(slice.value / total * 100),
        dash: `${Math.max(length - GAP, 0)} ${CIRCUMFERENCE}`,
        offset: -offset,
      };
      offset += length;
      return arc;
    });
  });

  protected readonly centerValue = computed(() => {
    const slice = this.arcs()[this.hovered()];
    return slice ? `${slice.percent}%` : String(this.total());
  });

  protected readonly centerLabel = computed(() => this.arcs()[this.hovered()]?.label ?? this.totalLabel());

  protected readonly ariaLabel = computed(() =>
    this.arcs().map(s => `${s.label}: ${this.valueLabel()(s.value)}, ${s.percent}%`).join('; '));
}
