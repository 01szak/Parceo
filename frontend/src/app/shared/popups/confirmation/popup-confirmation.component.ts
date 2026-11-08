import {ChangeDetectionStrategy, Component, inject, Type} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {NgComponentOutlet} from '@angular/common';

export type ConfirmationTone = 'default' | 'danger';

export interface ConfirmationData {
  //a question, e.g. "Usunąć rezerwację?"
  title?: string;
  //one sentence on what exactly will happen
  message?: string;
  component?: Type<unknown>;
  componentData?: Record<string, unknown>;
  confirmLabel?: string;
  cancelLabel?: string;
  //'danger' paints the confirm button in the error color (deleting, overriding prices)
  tone?: ConfirmationTone;
  action: () => void;
}

const DEFAULT_TITLE = 'Zapisać zmiany?';
const DEFAULT_CONFIRM_LABEL = 'Tak';
const DEFAULT_CANCEL_LABEL = 'Anuluj';

@Component({
  selector: 'app-popup-confirmation',
  imports: [
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    MatButton,
    NgComponentOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './popup-confirmation.component.html',
  styleUrl: './popup-confirmation.component.css'
})
export class PopupConfirmationComponent {
  private readonly dialogRef = inject(MatDialogRef<PopupConfirmationComponent>);
  protected readonly data = inject<ConfirmationData>(MAT_DIALOG_DATA);

  protected readonly title = this.data.title ?? DEFAULT_TITLE;
  protected readonly confirmLabel = this.data.confirmLabel ?? DEFAULT_CONFIRM_LABEL;
  protected readonly cancelLabel = this.data.cancelLabel ?? DEFAULT_CANCEL_LABEL;
  protected readonly isDanger = this.data.tone === 'danger';

  protected confirm(): void {
    this.data.action();
    this.close();
  }

  protected close(): void {
    this.dialogRef.close();
  }
}
