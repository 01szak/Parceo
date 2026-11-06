import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MAT_SNACK_BAR_DATA, MatSnackBarLabel} from '@angular/material/snack-bar';
import {MatIcon} from '@angular/material/icon';

export type SnackBarKind = 'success' | 'error' | 'warning';

export interface SnackBarData {
  message: string;
  kind: SnackBarKind;
}

const ICONS: Record<SnackBarKind, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
};

@Component({
  selector: 'app-snack-bar',
  imports: [MatSnackBarLabel, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './snack-bar.component.html',
  styleUrl: './snack-bar.component.css'
})
export class SnackBarComponent {
  protected readonly data = inject<SnackBarData>(MAT_SNACK_BAR_DATA);
  protected readonly icon = ICONS[this.data.kind];
}
