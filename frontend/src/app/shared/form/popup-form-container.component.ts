import {Component, inject, Input} from '@angular/core';
import {MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {FormButtonsComponent} from '@shared/ui/buttons/form-buttons.component';
import {ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-popup-form-container',
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    FormButtonsComponent,
    ReactiveFormsModule
  ],
  styles: `
  mat-dialog-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem !important;
    max-height: 60vh;
    color: #ffffff !important;
  }

  .deleteIcon {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 10;
  }

  h2[mat-dialog-title] {
    margin: 0;
    text-align: center;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary) !important;
    padding: 1rem !important;
  }
  `,
  template: `
    @if (isUpdate && deleteAction) {
      <div class="deleteIcon">
        <i (click)="deleteAction()" class="fa-regular fa-trash-can"></i>
      </div>
    }
    <h2 mat-dialog-title>{{ formTitle }}</h2>

    <mat-dialog-content>
      <ng-content></ng-content>
    </mat-dialog-content>

    <mat-dialog-actions style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); justify-content: flex-end;">
      <app-form-buttons style="width: 100%"
        [firstAction]="closeAction"
        [secondAction]="proceedAction"
      />
    </mat-dialog-actions>
  `,
})
export class PopupFormContainer {
  @Input() formTitle = '';
  @Input() proceedAction!: () => void;
  @Input() deleteAction: (() => void) | null = null;
  @Input() isUpdate = false;

  private readonly dialogRef = inject(MatDialogRef);
  protected closeAction = () => this.dialogRef.close();
}
