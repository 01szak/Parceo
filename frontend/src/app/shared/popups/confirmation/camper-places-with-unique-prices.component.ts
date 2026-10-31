import {Component, Input} from '@angular/core';
import {MatCheckbox} from '@angular/material/checkbox';
import {CamperPlaceDto, CamperPlaceTypeDto} from '../../../api';

@Component({
  selector: 'app-price-change-details',
  standalone: true,
  imports: [
    MatCheckbox
  ],
  template: `
    <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 10px;">
      <!-- Level 0: Global Select All -->
      <div style="display: flex; align-items: center; gap: 8px; padding: 4px 0;">
        <mat-checkbox
          (change)="toggleAll($event.checked)"
          [checked]="isAllSelected()"
          [indeterminate]="isSomeSelected() && !isAllSelected()"/>
        <strong style="color: var(--text-primary)">Zaznacz wszystko</strong>
      </div>

      <div style="max-height: 450px; overflow-y: auto; display: flex; flex-direction: column;">
        @if (rows) {
          @for (e of rowsEntries; track e[0]) {
            @if (e[1].length > 0) {
              <!-- Level 1: Type Group (Indented) -->
              <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0 6px 24px;">
                <mat-checkbox
                  (change)="toggleType(e[0], $event.checked)"
                  [checked]="isTypeAllSelected(e[0])"
                  [indeterminate]="isSomeTypeSelected(e[0]) && !isTypeAllSelected(e[0])"/>
                <span style="font-weight: 600; color: var(--text-primary)">
                  Typ: {{ e[1][0].camperPlaceType!.typeName }}
                  <span style="font-weight: 400; font-size: 0.85rem; color: var(--text-secondary); margin-left: 8px;">
                    (Zmieniana na: <strong style="color: #4caf50;">{{ getNewPrice(e[0]) }} zł</strong>)
                  </span>
                </span>
              </div>

              <!-- Level 2: Specific Places (Further Indented) -->
              @for (item of e[1]; track item.id) {
                <div style="display: flex; align-items: center; gap: 8px; padding: 2px 0 2px 52px;">
                  <mat-checkbox
                    (change)="addId(item.id!, $event.checked)"
                    [checked]="selectedIds.includes(item.id!)"/>
                  <span style="font-size: 0.9rem; color: var(--text-primary)">
                    Indeks: <strong>{{ item.index }}</strong>
                    <span style="font-size: 0.8rem; color: var(--text-secondary); margin-left: 8px;">
                      (Obecna: {{ item.price }} zł)
                    </span>
                  </span>
                </div>
              }
            }
          }
        }
      </div>
    </div>
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
