import {ChangeDetectionStrategy, Component, computed, input, signal} from '@angular/core';

export interface ChartBar {
  key: string;
  //axis label under the bar; empty to skip (e.g. only every 5th day is labelled)
  tick: string;
  value: number;
  //tooltip and table: "05.10.2026", "1 250,00 zł"
  title: string;
  valueText: string;
}

const TICK_COUNT = 4;
const PLOT_HEIGHT = 240;

//1, 2, 2.5 or 5 times a power of ten, so the axis reads 0 / 1 000 / 2 000 / 3 000;
//whole numbers only, so small values (an empty period) do not read 0 / 0 / 0 / 0 / 1
export function niceStep(max: number): number {
  const raw = max / TICK_COUNT;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map(m => m * magnitude).find(step => step >= raw && Number.isInteger(step)) ?? 1;
}

/**
 * One series of vertical bars in the primary color with a value axis, a tooltip on hover
 * and a visually hidden table with every value for screen readers.
 */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart" role="img" [attr.aria-label]="label()">
      <div class="axis" aria-hidden="true">
        @for (tick of ticks(); track tick.value) {
          <div class="gridline" [style.bottom.px]="tick.position">
            <span class="tick-label">{{ tick.text }}</span>
          </div>
        }
      </div>
      <div class="bars" aria-hidden="true">
        @for (bar of bars(); track bar.key; let i = $index) {
          <div class="slot" (mouseenter)="hovered.set(i)" (mouseleave)="hovered.set(-1)">
            <div class="bar" [class.dim]="hovered() !== -1 && hovered() !== i" [style.height.px]="height(bar.value)"></div>
            @if (hovered() === i) {
              <div class="tooltip" [style.bottom.px]="height(bar.value) + 8">
                <strong>{{ bar.valueText }}</strong>
                <span>{{ bar.title }}</span>
              </div>
            }
            <span class="bar-tick">{{ bar.tick }}</span>
          </div>
        }
      </div>
    </div>
    <table class="visually-hidden">
      <caption>{{ label() }}</caption>
      <tbody>
        @for (bar of bars(); track bar.key) {
          <tr><th scope="row">{{ bar.title }}</th><td>{{ bar.valueText }}</td></tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    :host {
      display: block;
    }

    .chart {
      position: relative;
      height: 272px;
      padding-left: 72px;
    }

    .axis {
      position: absolute;
      inset: 0 0 32px 0;
    }

    .gridline {
      position: absolute;
      left: 72px;
      right: 0;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .tick-label {
      position: absolute;
      right: calc(100% + 8px);
      transform: translateY(-50%);
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .bars {
      position: relative;
      height: 240px;
      display: flex;
      align-items: flex-end;
      gap: 3px;
    }

    .slot {
      position: relative;
      flex: 1;
      min-width: 0;
      height: 100%;
      display: flex;
      align-items: flex-end;
    }

    .bar {
      width: 100%;
      min-height: 1px;
      border-radius: 4px 4px 0 0;
      background: var(--mat-sys-primary);
      transition: opacity 150ms cubic-bezier(.2, 0, 0, 1);

      &.dim {
        opacity: 0.45;
      }
    }

    .bar-tick {
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      white-space: nowrap;
    }

    .tooltip {
      position: absolute;
      z-index: 2;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      background: var(--mat-sys-inverse-surface);
      color: var(--mat-sys-inverse-on-surface);
      font: var(--mat-sys-body-medium);
      white-space: nowrap;
      pointer-events: none;

      strong {
        font-variant-numeric: tabular-nums;
      }
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `,
})
export class BarChartComponent {
  public readonly bars = input.required<readonly ChartBar[]>();
  //what the chart shows, e.g. "Przychód dzień po dniu"
  public readonly label = input.required<string>();
  public readonly formatTick = input<(value: number) => string>(value => String(value));

  protected readonly hovered = signal(-1);

  private readonly step = computed(() => niceStep(Math.max(...this.bars().map(b => b.value), 1)));
  private readonly axisMax = computed(() => this.step() * TICK_COUNT);

  protected readonly ticks = computed(() => Array.from({length: TICK_COUNT + 1}, (_, i) => {
    const value = i * this.step();
    return {value, text: this.formatTick()(value), position: value / this.axisMax() * PLOT_HEIGHT};
  }));

  protected height(value: number): number {
    return Math.round(value / this.axisMax() * PLOT_HEIGHT);
  }
}
