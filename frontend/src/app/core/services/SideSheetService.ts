import {inject, Injectable} from '@angular/core';
import {ComponentType} from '@angular/cdk/portal';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BreakpointObserver} from '@angular/cdk/layout';

const SHEET_WIDTH = '560px';
const PHONE_QUERY = '(max-width: 599.98px)';

/**
 * Opens a form as a side sheet: glued to the right edge, full height, the page stays visible under the scrim.
 * On a phone the sheet takes the whole screen.
 */
@Injectable({providedIn: 'root'})
export class SideSheetService {
  private readonly dialog = inject(MatDialog);
  private readonly breakpoints = inject(BreakpointObserver);

  open<C, D = unknown, R = unknown>(component: ComponentType<C>, data?: D): MatDialogRef<C, R> {
    const fullScreen = this.breakpoints.isMatched(PHONE_QUERY);
    return this.dialog.open<C, D, R>(component, {
      data,
      panelClass: fullScreen ? ['side-sheet', 'side-sheet-full'] : 'side-sheet',
      position: {top: '0', right: '0'},
      width: fullScreen ? '100vw' : SHEET_WIDTH,
      maxWidth: '100vw',
      height: '100dvh',
      maxHeight: '100dvh',
      autoFocus: 'first-tabbable',
    });
  }
}
