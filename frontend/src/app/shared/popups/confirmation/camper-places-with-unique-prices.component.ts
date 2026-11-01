import {Component, Input} from '@angular/core';
import {MatCheckbox} from '@angular/material/checkbox';
import {CamperPlaceDto, CamperPlaceTypeDto} from '../../../api';
import {formatPln} from '@shared/domain/money';

@Component({
  selector: 'app-price-change-details',
  imports: [
    MatCheckbox
  ],
  template: `
    <div class="list">
      <mat-checkbox class="all" (change)="toggleAll($event.checked)" [checked]="isAllSelected()"
                    [indeterminate]="isSomeSelected() && !isAllSelected()">
        Zaznacz wszystkie
      </mat-checkbox>

      <div class="scroll">
        @for (e of rowsEntries; track e[0]) {
          @if (e[1].length > 0) {
            <mat-checkbox class="type" (change)="toggleType(e[0], $event.checked)" [checked]="isTypeAllSelected(e[0])"
                          [indeterminate]="isSomeTypeSelected(e[0]) && !isTypeAllSelected(e[0])">
              <span class="name">{{ e[1][0].camperPlaceType!.typeName }}</span>
              <span class="detail">nowa cena: <strong>{{ price(getNewPrice(e[0])) }}</strong></span>
            </mat-checkbox>

            @for (item of e[1]; track item.id) {
              <mat-checkbox class="place" (change)="addId(item.id!, $event.checked)" [checked]="selectedIds.includes(item.id!)">
                Parcela {{ item.index }}
                <span class="detail">teraz: {{ price(item.price) }}</span>
              </mat-checkbox>
            }
          }
        }
      </div>
    </div>
  `,
  styles: `
    .list {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      margin-top: var(--space-3);
    }

    .scroll {
      max-height: 450px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .all {
      font-weight: 700;
    }

    .type {
      padding-left: var(--space-6);
    }

    .place {
      padding-left: 52px;
    }

    .name {
      font-weight: 600;
    }

    .detail {
      margin-left: var(--space-2);
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
  `
})
export class CamperPlacesWithUniquePricesComponent {
  private _rows: Record<number, CamperPlaceDto[]> | null = null;
  @Input() set rows(val: Record<number, CamperPlaceDto[]> | null) {
    this._rows = val;
    this.rowsEntries = Object.entries(val || {}).map(([key, value]) => [Number(key), value]);
  }
  get rows() { return this._rows; }

  @Input() selectedIds: number[] = [];
  @Input() updatedTypes: CamperPlaceTypeDto[] = [];

  protected rowsEntries: [number, CamperPlaceDto[]][] = [];

  protected price(amount: number): string {
    return formatPln(amount);
  }

  protected getNewPrice(typeId: number): number {
    return this.updatedTypes.find(t => t.id === typeId)?.price ?? 0;
  }

  private getAllIds(): number[] {
    return this.rowsEntries.flatMap(([_, items]) => items.map(i => i.id!));
  }

  private getTypeIds(typeId: number): number[] {
    const entry = this.rowsEntries.find(([id]) => id === typeId);
    return entry ? entry[1].map(i => i.id!) : [];
  }

  protected isAllSelected(): boolean {
    const allIds = this.getAllIds();
    return allIds.length > 0 && allIds.every(id => this.selectedIds.includes(id));
  }

  protected isSomeSelected(): boolean {
    const allIds = this.getAllIds();
    return allIds.some(id => this.selectedIds.includes(id));
  }

  protected isTypeAllSelected(typeId: number): boolean {
    const typeIds = this.getTypeIds(typeId);
    return typeIds.length > 0 && typeIds.every(id => this.selectedIds.includes(id));
  }

  protected isSomeTypeSelected(typeId: number): boolean {
    const typeIds = this.getTypeIds(typeId);
    return typeIds.some(id => this.selectedIds.includes(id));
  }

  protected toggleAll(checked: boolean) {
    const allIds = this.getAllIds();
    if (checked) {
      allIds.forEach(id => {
        if (!this.selectedIds.includes(id)) this.selectedIds.push(id);
      });
    } else {
      allIds.forEach(id => {
        const idx = this.selectedIds.indexOf(id);
        if (idx > -1) this.selectedIds.splice(idx, 1);
      });
    }
  }

  protected toggleType(typeId: number, checked: boolean) {
    const typeIds = this.getTypeIds(typeId);
    if (checked) {
      typeIds.forEach(id => {
        if (!this.selectedIds.includes(id)) this.selectedIds.push(id);
      });
    } else {
      typeIds.forEach(id => {
        const idx = this.selectedIds.indexOf(id);
        if (idx > -1) this.selectedIds.splice(idx, 1);
      });
    }
  }

  protected addId(id: number, checked: boolean) {
    if (checked) {
      if (!this.selectedIds.includes(id)) {
        this.selectedIds.push(id);
      }
    } else {
      const idIndex = this.selectedIds.indexOf(id);
      if (idIndex > -1) this.selectedIds.splice(idIndex, 1);
    }
  }
}
