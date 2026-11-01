import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {CamperPlaceDto} from '../../api';
import {formatPln} from '@shared/domain/money';
import {nightsLabel} from '@shared/domain/stay-range';
import {EmptyStateComponent} from '@shared/ui/empty-state/empty-state.component';

export interface FreeParcel {
  place: CamperPlaceDto;
  //nights in a row the place stays free from the chosen day (capped)
  freeNights: number;
}

export interface FreeParcelsDialogData {
  //"Poniedziałek, 02.11.2026"
  dayLabel: string;
  totalPlaces: number;
  parcels: FreeParcel[];
  //the cap of freeNights: "co najmniej N nocy" when reached
  horizon: number;
}

//free parcels of one night; closes with the place chosen with "Rezerwuj"
@Component({
  selector: 'app-free-parcels-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButton, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.dayLabel }}</h2>
    <mat-dialog-content>
      <p class="lead">Wolne {{ data.parcels.length }} z {{ data.totalPlaces }} parcel na tę noc.</p>
      @if (data.parcels.length) {
        <table>
          <thead>
            <tr><th>Parcela</th><th>Rodzaj</th><th class="end">Cena za noc</th><th>Wolna</th><th><span class="visually-hidden">Akcja</span></th></tr>
          </thead>
          <tbody>
            @for (parcel of data.parcels; track parcel.place.id) {
              <tr>
                <td class="strong">Parcela {{ parcel.place.index }}</td>
                <td>{{ parcel.place.camperPlaceType.typeName }}</td>
                <td class="end">{{ price(parcel.place) }}</td>
                <td>{{ freeLabel(parcel) }}</td>
                <td class="end"><button mat-flat-button type="button" (click)="book(parcel.place)">Rezerwuj</button></td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <app-empty-state icon="event_busy" title="Wszystkie parcele są zajęte." message="Wybierz inny dzień." />
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Zamknij</button>
    </mat-dialog-actions>
  `,
  styles: `
    .lead {
      margin: 0 0 var(--space-4);
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface-variant);
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      padding: 10px 12px;
      text-align: left;
      font: var(--mat-sys-title-small);
      color: var(--mat-sys-on-surface-variant);
      border-bottom: 1px solid var(--mat-sys-outline);
      white-space: nowrap;
    }

    td {
      padding: 8px 12px;
      height: 44px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
    }

    .end {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .strong {
      font-weight: 600;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }
  `,
})
export class FreeParcelsDialogComponent {
  protected readonly data = inject<FreeParcelsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<FreeParcelsDialogComponent, CamperPlaceDto>);

  protected price(place: CamperPlaceDto): string {
    const price = place.price ?? place.camperPlaceType?.price;
    return price === undefined ? '—' : formatPln(price);
  }

  protected freeLabel(parcel: FreeParcel): string {
    if (parcel.freeNights >= this.data.horizon) return `co najmniej ${nightsLabel(parcel.freeNights)}`;
    return parcel.freeNights === 1 ? 'tylko tę noc' : nightsLabel(parcel.freeNights);
  }

  protected book(place: CamperPlaceDto): void {
    this.dialogRef.close(place);
  }
}
