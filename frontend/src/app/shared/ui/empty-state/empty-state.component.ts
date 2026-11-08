import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatIcon} from '@angular/material/icon';

//shown instead of an empty list: says what is missing and offers the next step (projected action)
@Component({
  selector: 'app-empty-state',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (icon()) {
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
    }
    <p class="title">{{ title() }}</p>
    @if (message()) {
      <p class="message">{{ message() }}</p>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-8) var(--space-4);
      text-align: center;
    }

    mat-icon {
      width: 40px;
      height: 40px;
      font-size: 40px;
      color: var(--mat-sys-on-surface-variant);
    }

    p {
      margin: 0;
      max-width: 48ch;
    }

    .title {
      font: var(--mat-sys-title-medium);
      color: var(--mat-sys-on-surface);
    }

    .message {
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class EmptyStateComponent {
  public readonly title = input.required<string>();
  public readonly message = input<string>();
  public readonly icon = input<string>();
}
