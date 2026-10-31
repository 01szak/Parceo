import {inject, Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SnackBarComponent} from '@shared/popups/snack-bar/snack-bar.component';

@Injectable({providedIn: 'root'})
export class NotificationService {

  private snackBar = inject(MatSnackBar);

  success(message: string | { success: string } | any): void {
    const msg = typeof message === 'string' ? message : (message?.success || 'Operacja zakończona sukcesem');
    this.snackBar.openFromComponent(SnackBarComponent, {
      data: msg,
      panelClass: 'successSnackBar',
      duration: 5000,
      horizontalPosition: 'start',
      verticalPosition: 'top'
    });
  }

  error(error: any): void {
    const msg =
      (typeof error?.error === 'string' && error.error)
      || error?.message
      || error?.error?.message
      || 'Coś poszło nie tak';
    this.snackBar.openFromComponent(SnackBarComponent, {
      data: msg,
      panelClass: 'errorSnackBar',
      duration: 5000,
      horizontalPosition: 'start',
      verticalPosition: 'top'
    });
  }
}
