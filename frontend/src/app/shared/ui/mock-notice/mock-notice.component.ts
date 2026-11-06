import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MatIcon} from '@angular/material/icon';

//MOCK: marks a screen whose data is kept only in this browser until the backend supports it (PLAN.md)
@Component({
  selector: 'app-mock-notice',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-icon aria-hidden="true">info</mat-icon>
    <p>
      <ng-content>Te dane są na razie zapisywane tylko w tej przeglądarce. Inni pracownicy ich nie zobaczą.</ng-content>
    </p>
  `,
  styles: `
    :host {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }

    mat-icon {
      flex: none;
    }

    p {
      margin: 0;
      font: var(--mat-sys-body-large);
    }
  `,
  standalone: true
})
export class MockNoticeComponent {
}
