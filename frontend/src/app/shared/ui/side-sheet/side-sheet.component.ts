import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatDialogClose, MatDialogTitle} from '@angular/material/dialog';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

/**
 * Layout of every side sheet: a header with the title and the close button, scrolling content
 * and a footer that stays visible (projected with the [sheetFooter] attribute).
 */
@Component({
  selector: 'app-side-sheet',
  imports: [MatDialogTitle, MatDialogClose, MatIconButton, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h2 mat-dialog-title>{{ title() }}</h2>
      @if (deletable()) {
        <button mat-icon-button type="button" class="delete" [attr.aria-label]="deleteLabel()" (click)="deleteClicked.emit()">
          <mat-icon>delete</mat-icon>
        </button>
      }
      <button mat-icon-button type="button" mat-dialog-close aria-label="Zamknij">
        <mat-icon>close</mat-icon>
      </button>
    </header>

    <div class="content">
      <ng-content />
    </div>

    <footer>
      <ng-content select="[sheetFooter]" />
    </footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
    }

    header {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      padding: 20px 20px 12px 28px;
    }

    h2 {
      flex: 1;
      margin: 0;
      padding: 0;
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface);
    }

    h2::before {
      display: none;
    }

    .delete {
      color: var(--mat-sys-error);
    }

    .content {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 0 28px var(--space-6);
    }

    footer {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: 18px 28px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-low);
    }

    footer:empty {
      display: none;
    }
  `,
})
export class SideSheetComponent {
  public readonly title = input.required<string>();
  public readonly deletable = input(false);
  public readonly deleteLabel = input('Usuń');
  public readonly deleteClicked = output<void>();
}
