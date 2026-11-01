import {ChangeDetectionStrategy, Component, input} from '@angular/core';

//the Parceo mark (a plot split into four parcels, one taken) with an optional wordmark
@Component({
  selector: 'app-parceo-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 56 56" aria-hidden="true">
      <rect x="2" y="2" width="52" height="52" rx="14" class="plot"></rect>
      <rect x="12" y="12" width="14" height="14" rx="3" class="taken"></rect>
      <rect x="30" y="12" width="14" height="14" rx="3" class="free"></rect>
      <rect x="12" y="30" width="14" height="14" rx="3" class="free"></rect>
      <rect x="30" y="30" width="14" height="14" rx="3" class="free"></rect>
    </svg>
    @if (showName()) {
      <span class="name">Parceo</span>
    } @else {
      <span class="visually-hidden">Parceo</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
      color: var(--mat-sys-on-surface);
    }

    .plot { fill: var(--mat-sys-primary); }
    .taken { fill: var(--mat-sys-on-primary); }
    .free { fill: none; stroke: var(--mat-sys-on-primary); stroke-width: 3; }

    .name {
      font: var(--mat-sys-title-large);
      font-weight: 700;
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
export class ParceoLogoComponent {
  public readonly size = input(32);
  public readonly showName = input(true);
}
