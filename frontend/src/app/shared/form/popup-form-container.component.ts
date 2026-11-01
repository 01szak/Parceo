import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatDialogClose} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {SideSheetComponent} from '@shared/ui/side-sheet/side-sheet.component';

//frame of an edit form opened in a side sheet: title, optional delete, "Anuluj" and the primary save action
@Component({
  selector: 'app-popup-form-container',
  imports: [SideSheetComponent, MatButton, MatDialogClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-side-sheet [title]="formTitle()" [deletable]="canDelete()" (deleteClicked)="deleteAction()?.()">
      <ng-content />
      <div sheetFooter class="footer">
        <div class="summary"><ng-content select="[formSummary]" /></div>
        <span class="spacer"></span>
        <button mat-button type="button" mat-dialog-close>Anuluj</button>
        <button mat-flat-button type="button" [disabled]="saveDisabled()" (click)="proceedAction()()">{{ saveLabel() }}</button>
      </div>
    </app-side-sheet>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .footer {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
    }

    .summary {
      flex: 1;
      min-width: 0;
    }

    .spacer {
      flex: 1;
    }

    .summary:empty {
      display: none;
    }

    @media (max-width: 599.98px) {
      .footer {
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .summary {
        flex-basis: 100%;
      }
    }
  `,
})
export class PopupFormContainer {
  public readonly formTitle = input.required<string>();
  public readonly proceedAction = input.required<() => void>();
  public readonly deleteAction = input<(() => void) | null>(null);
  public readonly isUpdate = input(false);
  public readonly saveLabel = input('Zapisz');
  public readonly saveDisabled = input(false);

  protected readonly canDelete = computed(() => this.isUpdate() && !!this.deleteAction());
}
