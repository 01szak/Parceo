import {Component, inject, Type} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {FormButtonsComponent} from '@shared/ui/buttons/form-buttons.component';
import {CommonModule} from '@angular/common';


@Component({
  selector: 'app-popup-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogContent,
    MatDialogTitle,
    FormButtonsComponent
  ],
  templateUrl: './popup-confirmation.component.html',
  styleUrl: './popup-confirmation.component.css'
})
export class PopupConfirmationComponent {
  readonly popupConfirmationRef = inject(MatDialogRef<PopupConfirmationComponent, ConfirmationData>);
  readonly confirmationData = inject<ConfirmationData>(MAT_DIALOG_DATA);

  firstAction = () => this.close();
  secondAction = () => {
    this.confirmationData.action();
    this.firstAction();
  }

  protected defaultTittle: string = "Zatwierdź zmiany";

  close() {
    this.popupConfirmationRef.close();
  }
}

export interface ConfirmationData {
  title?: string | 'Zatwierdź zmiany';
  message?: string;
  component?: Type<any>;
  componentData?: Record<string, any>;
  action: () => void;
}
