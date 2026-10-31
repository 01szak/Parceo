import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmationData, PopupConfirmationComponent} from '@shared/popups/confirmation/popup-confirmation.component';

@Injectable({providedIn: "root"})
export class PopupConfirmationService {

  readonly popupConfirmation: MatDialog = inject(MatDialog);

  /**
   * Opens a confirmation popup.
   * Can be used as simple (message, action) or with full configuration (ConfirmationData).
   */
  openConfirmationPopup(messageOrData: string | ConfirmationData, action?: () => void) {
    let confirmationData: ConfirmationData;

    if (typeof messageOrData === 'string') {
      confirmationData = {
        message: messageOrData,
        action: action!
      };
    } else {
      confirmationData = messageOrData;
    }

    this.popupConfirmation.open(PopupConfirmationComponent, {
      data: confirmationData,
      width: 'auto',
      maxWidth: '600px',
      minWidth: '350px'
    });
  }
}
