import {ChangeDetectionStrategy, Component, input} from '@angular/core';

//title of a page with an optional description; actions are projected into the right side
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="text">
      <h1>{{ title() }}</h1>
      @if (description()) {
        <p>{{ description() }}</p>
      }
    </div>
    <div class="actions">
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-4);
    }

    .text {
      flex: 1 1 280px;
      min-width: 0;
    }

    h1 {
      margin: 0;
      font: var(--mat-sys-headline-medium);
      color: var(--mat-sys-on-surface);
    }

    p {
      margin: var(--space-1) 0 0;
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface-variant);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
    }

    .actions:empty {
      display: none;
    }
  `,
})
export class PageHeaderComponent {
  public readonly title = input.required<string>();
  public readonly description = input<string>();
}
