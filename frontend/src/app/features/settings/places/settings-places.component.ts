import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {CamperPlaceDto, CamperPlaceTypeDto} from '../../../api';
import {CamperPlaceService} from '@core/services/openApiWrappers/CamperPlaceService';
import {CamperPlaceTypeService} from '@core/services/openApiWrappers/CamperPlaceTypeService';
import {PopupFormService} from '@core/services/PopupFormService';
import {PopupConfirmationService} from '@core/services/PopupConfirmationService';
import {QuerySort} from '@core/services/openApiWrappers/paged-query';
import {ColumnDef, DataTableComponent, TablePage} from '@shared/ui/data-table/data-table.component';
import {CellDefDirective} from '@shared/ui/data-table/cell-def.directive';
import {EmptyStateComponent} from '@shared/ui/empty-state/empty-state.component';
import {formatPln} from '@shared/domain/money';
import {countLabel} from '@shared/domain/plural';

interface PlaceRow {
  place: CamperPlaceDto;
  index: string;
  type: string;
  price: string;
  ownPrice: boolean;
}

interface TypeRow {
  type: CamperPlaceTypeDto;
  name: string;
  priceValue: number;
  price: string;
  places: number;
  placesLabel: string;
}

const TYPE_COLUMNS: readonly ColumnDef[] = [
  {key: 'name', label: 'Rodzaj', sortField: 'name'},
  {key: 'placesLabel', label: 'Parcele', sortField: 'places'},
  {key: 'price', label: 'Cena za noc', sortField: 'priceValue', align: 'end'},
  {key: 'actions', label: 'Akcje', hideLabel: true},
];

const DEFAULT_TYPE_SORT: QuerySort = {field: 'name', direction: 'ASC'};

const COLUMNS: readonly ColumnDef[] = [
  {key: 'index', label: 'Numer', sortField: 'index'},
  {key: 'type', label: 'Rodzaj', sortField: 'type'},
  {key: 'price', label: 'Cena za noc', sortField: 'price', align: 'end'},
  {key: 'actions', label: 'Akcje', hideLabel: true},
];

const DEFAULT_SORT: QuerySort = {field: 'index', direction: 'ASC'};


//Ustawienia › Parcele i ceny: price list of the types and every parcel with its own price marked
@Component({
  selector: 'app-settings-places',
  imports: [MatButton, MatIconButton, MatIcon, MatTooltip, DataTableComponent, CellDefDirective, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-places.component.html',
  styleUrl: './settings-places.component.scss',
})
export class SettingsPlacesComponent {
  private readonly camperPlaces = inject(CamperPlaceService);
  private readonly types = inject(CamperPlaceTypeService);
  private readonly forms = inject(PopupFormService);
  private readonly confirmation = inject(PopupConfirmationService);

  protected readonly columns = COLUMNS;
  protected readonly typesLoading = this.types.pageResource.isLoading;
  protected readonly placesLoading = this.camperPlaces.unpagedCamperPlaceResource.isLoading;

  protected readonly typeColumns = TYPE_COLUMNS;
  protected readonly typeSort = signal<QuerySort | null>(DEFAULT_TYPE_SORT);
  protected readonly typePageIndex = signal(0);
  protected readonly typePageSize = signal(25);

  private readonly allTypeRows = computed<TypeRow[]>(() => {
    const counts = new Map<number, number>();
    this.camperPlaces.camperPlaces().forEach(p => {
      const id = p.camperPlaceType?.id;
      if (id !== undefined) counts.set(id, (counts.get(id) ?? 0) + 1);
    });
    return (this.types.page().content as CamperPlaceTypeDto[]).map(type => {
      const places = counts.get(type.id!) ?? 0;
      return {
        type,
        name: type.typeName ?? '',
        priceValue: type.price ?? 0,
        places,
        placesLabel: countLabel(places, 'parcela', 'parcele', 'parcel'),
        price: type.price === undefined ? '—' : formatPln(type.price),
      };
    });
  });

  private readonly sortedTypeRows = computed(() => {
    const sort = this.typeSort() ?? DEFAULT_TYPE_SORT;
    const direction = sort.direction === 'ASC' ? 1 : -1;
    const value = (row: TypeRow) => row[sort.field as 'name' | 'places' | 'priceValue'];
    return [...this.allTypeRows()].sort((a, b) => {
      const x = value(a), y = value(b);
      const order = typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x).localeCompare(String(y), 'pl', {numeric: true});
      return order * direction;
    });
  });

  protected readonly typeTotal = computed(() => this.allTypeRows().length);
  protected readonly typeRows = computed(() => {
    const start = this.typePageIndex() * this.typePageSize();
    return this.sortedTypeRows().slice(start, start + this.typePageSize());
  });

  protected readonly typeRowLabel = (row: TypeRow) => `Zmień rodzaj ${row.name}`;

  protected changeTypeSort(sort: QuerySort | null): void {
    this.typeSort.set(sort);
    this.typePageIndex.set(0);
  }

  protected changeTypePage(page: TablePage): void {
    this.typePageSize.set(page.pageSize);
    this.typePageIndex.set(page.pageIndex);
  }

  //the list is small (one camping), so sorting and paging happen in the browser
  protected readonly sort = signal<QuerySort | null>(DEFAULT_SORT);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);

  private readonly allRows = computed<PlaceRow[]>(() => this.camperPlaces.camperPlaces().map(place => {
    const typePrice = place.camperPlaceType?.price;
    const price = place.price ?? typePrice;
    return {
      place,
      index: place.index ?? '',
      type: place.camperPlaceType?.typeName ?? '',
      price: price === undefined ? '—' : formatPln(price),
      ownPrice: place.price !== undefined && place.price !== null && place.price !== typePrice,
    };
  }));

  private readonly sortedRows = computed(() => {
    const sort = this.sort() ?? DEFAULT_SORT;
    const direction = sort.direction === 'ASC' ? 1 : -1;
    const value = (row: PlaceRow): string | number =>
      sort.field === 'price' ? (row.place.price ?? row.place.camperPlaceType?.price ?? 0) : row[sort.field as 'index' | 'type'];
    return [...this.allRows()].sort((a, b) => {
      const x = value(a), y = value(b);
      const order = typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x).localeCompare(String(y), 'pl', {numeric: true});
      return order * direction;
    });
  });

  protected readonly total = computed(() => this.allRows().length);
  protected readonly rows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sortedRows().slice(start, start + this.pageSize());
  });

  protected readonly placeRowLabel = (row: PlaceRow) => `Zmień parcelę ${row.index}`;

  protected changeSort(sort: QuerySort | null): void {
    this.sort.set(sort);
    this.pageIndex.set(0);
  }

  protected changePage(page: TablePage): void {
    this.pageSize.set(page.pageSize);
    this.pageIndex.set(page.pageIndex);
  }

  protected addType(): void {
    this.forms.openCamperPlaceTypeFormPopup();
  }

  protected editType(type: CamperPlaceTypeDto): void {
    this.forms.openCamperPlaceTypeFormPopup({camperPlaceType: type});
  }

  protected deleteType(row: TypeRow): void {
    this.confirmation.openConfirmationPopup({
      title: 'Usunąć rodzaj parcel?',
      message: `Rodzaj „${row.name}” zniknie z cennika.`,
      confirmLabel: 'Usuń',
      tone: 'danger',
      action: () => this.types.delete(row.type.id!).subscribe(),
    });
  }

  protected addPlace(): void {
    this.forms.openCamperPlaceFormPopup();
  }

  protected editPlace(row: PlaceRow): void {
    this.forms.openCamperPlaceFormPopup({camperPlace: row.place});
  }

  protected deletePlace(row: PlaceRow): void {
    this.confirmation.openConfirmationPopup({
      title: 'Usunąć parcelę?',
      message: `Parcela ${row.index} zniknie z kalendarza i cennika.`,
      confirmLabel: 'Usuń',
      tone: 'danger',
      action: () => this.camperPlaces.delete(row.place.id!).subscribe(),
    });
  }
}
