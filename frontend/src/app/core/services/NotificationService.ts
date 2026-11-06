import {inject, Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SnackBarComponent, SnackBarData, SnackBarKind} from '@shared/popups/snack-bar/snack-bar.component';

const DURATION_MS = 5000;
const DEFAULT_SUCCESS = 'Zapisano zmiany';
const DEFAULT_ERROR = 'Coś poszło nie tak. Spróbuj ponownie.';

//panel classes defined in styles.scss (colors through mat.snack-bar-overrides)
const PANEL_CLASS: Record<SnackBarKind, string> = {
  success: 'successSnackBar',
  error: 'errorSnackBar',
  warning: 'warnSnackBar',
};

@Injectable({providedIn: 'root'})
export class NotificationService {

  private readonly snackBar = inject(MatSnackBar);

  //accepts a plain message or the backend's response body ({success: '...'})
  success(message: string | { success?: string } | unknown): void {
    const text = typeof message === 'string'
      ? message
      : (message as { success?: string } | null)?.success ?? DEFAULT_SUCCESS;
    this.open({message: text, kind: 'success'});
  }

  warning(message: string): void {
    this.open({message, kind: 'warning'});
  }

  error(error: unknown): void {
    this.open({message: this.errorMessage(error), kind: 'error'});
  }

  private errorMessage(error: unknown): string {
    const e = error as { error?: unknown, message?: string } | null;
    if (typeof e?.error === 'string' && e.error) return e.error;
    return (e?.error as { message?: string } | undefined)?.message || e?.message || DEFAULT_ERROR;
  }

  private open(data: SnackBarData): void {
    this.snackBar.openFromComponent(SnackBarComponent, {
      data,
      panelClass: PANEL_CLASS[data.kind],
      duration: DURATION_MS,
      horizontalPosition: 'start',
      verticalPosition: 'bottom'
    });
  }
}
