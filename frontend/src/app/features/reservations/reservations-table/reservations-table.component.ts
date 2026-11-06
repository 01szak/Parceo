import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {debounceTime, distinctUntilChanged} from 'rxjs';
import {MatFormField, MatLabel, MatPrefix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {ReservationDto} from '../../../api';
import {ResourceType} from '@core/services/openApiWrappers/service-facade.service';
import {createPagedQuery, QuerySort} from '@core/services/openApiWrappers/paged-query';
import {ReservationService} from '@core/services/openApiWrappers/ReservationService';
import {PopupFormService} from '@core/services/PopupFormService';
import {PopupConfirmationService} from '@core/services/PopupConfirmationService';
import {SavedFiltersService} from '@core/services/SavedFiltersService';
import {TodayService} from '@core/services/TodayService';
import {ColumnDef, DataTableComponent, TablePage} from '@shared/ui/data-table/data-table.component';
import {CellDefDirective} from '@shared/ui/data-table/cell-def.directive';
import {FilterBarComponent, FilterValues} from '@shared/ui/filter-bar/filter-bar.component';
import {StatusChipComponent} from '@shared/ui/status-chip/status-chip.component';
import {EmptyStateComponent} from '@shared/ui/empty-state/empty-state.component';
import {
  hasFilters,
  NO_FILTERS,
  RESERVATION_FILTER_GROUPS,
  RESERVATION_VIEWS,
  reservationCriteria,
  ReservationFilters,
  ReservationViewId
} from '@shared/domain/reservation-query';
import {showsUnpaidBadge, StayStatus, stayStatus} from '@shared/domain/stay-status';
import {nightsBetween} from '@shared/domain/stay-range';
import {formatPln} from '@shared/domain/money';
import {DateDelimiter, DateFormater} from '@shared/helper/DateFormater';

//one table row: the reservation and its values formatted for display
interface TableRow {
  reservation: ReservationDto;
  guest: string;
  car: string;
  place: string;
  placeType: string;
  checkin: string;
  checkout: string;
  nights: number | '';
  status: StayStatus;
  unpaid: boolean;
  price: string;
}

const SAVED_LIST_ID = 'reservations';
const SEARCH_DEBOUNCE_MS = 300;

const COLUMNS: readonly ColumnDef[] = [
  {key: 'guest', label: 'Gość', sortField: 'guest.lastname'},
  {key: 'place', label: 'Parcela', sortField: 'camperPlace.index'},
  {key: 'checkin', label: 'Przyjazd', sortField: 'checkin'},
  {key: 'checkout', label: 'Wyjazd', sortField: 'checkout'},
  {key: 'nights', label: 'Noce', align: 'end'},
  {key: 'status', label: 'Status', sortField: 'reservationStatus'},
  {key: 'price', label: 'Kwota', sortField: 'price', align: 'end'},
  {key: 'actions', label: 'Akcje', hideLabel: true},
];

//the reservation list with its "Pokaż" views, filters, saved filters, search, sorting and pages
@Component({
    selector: 'app-reservations-table',
    imports: [
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatPrefix,
        MatInput,
        MatIcon,
        MatButton,
        MatIconButton,
        MatMenu,
        MatMenuItem,
        MatMenuTrigger,
        MatMenuContent,
        DataTableComponent,
        CellDefDirective,
        FilterBarComponent,
        StatusChipComponent,
        EmptyStateComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reservations-table.component.html',
    styleUrl: './reservations-table.component.scss',
    standalone: true
})
export class ReservationsTableComponent {
  private readonly reservations = inject(ReservationService);
  private readonly forms = inject(PopupFormService);
  private readonly confirmation = inject(PopupConfirmationService);
  private readonly savedFilters = inject(SavedFiltersService);

  protected readonly query = createPagedQuery<ReservationDto>(ResourceType.RESERVATION);
  protected readonly columns = COLUMNS;
  protected readonly views = RESERVATION_VIEWS;
  protected readonly filterGroups = RESERVATION_FILTER_GROUPS;
  protected readonly saved = this.savedFilters.list<ReservationViewId, ReservationFilters>(SAVED_LIST_ID);

  //a built-in view id or the id of a saved filter
  protected readonly viewId = signal<string>('active');
  protected readonly filters = signal<ReservationFilters>(NO_FILTERS);
  private readonly sortOverride = signal<QuerySort | null>(null);

  protected readonly searchControl = new FormControl('', {nonNullable: true});
  private readonly search = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged()),
    {initialValue: ''}
  );

  private readonly savedView = computed(() => this.saved().find(s => s.id === this.viewId()));
  private readonly baseView = computed(() => {
    const id = this.savedView()?.view ?? this.viewId();
    return RESERVATION_VIEWS.find(v => v.id === id) ?? RESERVATION_VIEWS[0];
  });
  //filters of the saved view, overridden by the ones added on top of it
  private readonly effectiveFilters = computed<ReservationFilters>(() => {
    const base = this.savedView()?.filters ?? NO_FILTERS;
    const extra = this.filters();
    return {
      status: extra.status !== 'any' ? extra.status : base.status,
      payment: extra.payment !== 'any' ? extra.payment : base.payment,
      arrival: extra.arrival !== 'any' ? extra.arrival : base.arrival,
    };
  });

  protected readonly savedViewOptions = computed(() => this.saved().map(s => ({id: s.id, label: s.label})));
  protected readonly filterValues = computed(() => this.filters() as unknown as FilterValues);
  protected readonly narrowed = computed(() => hasFilters(this.effectiveFilters()) || !!this.search().trim());

  //statuses and views ("Aktywne", "Nadchodzące") are counted from today, which moves on at midnight
  private readonly today = inject(TodayService).today;

  protected readonly rows = computed<TableRow[]>(() => {
    const today = this.today();
    return this.query.page().content.map(reservation => ({
      reservation,
      guest: `${reservation.guest?.firstname ?? ''} ${reservation.guest?.lastname ?? ''}`.trim(),
      car: reservation.guest?.carRegistration ?? '',
      place: reservation.camperPlace?.index ?? '',
      placeType: reservation.camperPlace?.camperPlaceType?.typeName ?? '',
      checkin: this.date(reservation.checkin),
      checkout: this.date(reservation.checkout),
      nights: reservation.checkin && reservation.checkout ? nightsBetween(reservation.checkin, reservation.checkout) : '',
      status: stayStatus(reservation, today),
      unpaid: showsUnpaidBadge(reservation, today),
      price: reservation.price === undefined ? '' : formatPln(reservation.price),
    }));
  });

  constructor() {
    effect(() => {
      const criteria = reservationCriteria(this.baseView().id, this.effectiveFilters(), this.search(), this.today());
      const sort = this.sortOverride() ?? this.baseView().sort;
      untracked(() => {
        this.query.criteria.set(criteria);
        this.query.sort.set(sort);
        this.query.pageIndex.set(0);
      });
    });
  }

  protected readonly rowLabel = (row: TableRow) => `Otwórz rezerwację: ${row.guest}, parcela ${row.place}`;

  protected changeView(id: string): void {
    this.viewId.set(id);
    this.filters.set(NO_FILTERS);
    this.sortOverride.set(null);
  }

  protected changeFilters(values: FilterValues): void {
    this.filters.set(values as unknown as ReservationFilters);
  }

  protected saveFilter(label: string): void {
    const saved = this.savedFilters.add(SAVED_LIST_ID, label, this.baseView().id, this.effectiveFilters());
    this.viewId.set(saved.id);
    this.filters.set(NO_FILTERS);
  }

  protected deleteSavedView(id: string): void {
    const label = this.saved().find(s => s.id === id)?.label ?? '';
    this.confirmation.openConfirmationPopup({
      title: 'Usunąć zapisany filtr?',
      message: `Filtr „${label}” zniknie z listy „Pokaż”. Rezerwacje się nie zmienią.`,
      confirmLabel: 'Usuń',
      tone: 'danger',
      action: () => {
        this.savedFilters.remove(SAVED_LIST_ID, id);
        this.changeView('active');
      },
    });
  }

  protected clearAll(): void {
    this.filters.set(NO_FILTERS);
    this.searchControl.setValue('');
    if (this.savedView()) this.changeView('active');
  }

  protected changeSort(sort: QuerySort | null): void {
    this.sortOverride.set(sort);
  }

  protected changePage(page: TablePage): void {
    this.query.pageSize.set(page.pageSize);
    this.query.pageIndex.set(page.pageIndex);
  }

  protected open(row: TableRow): void {
    this.forms.openReservationFormPopup({reservation: row.reservation});
  }

  protected markPaid(row: TableRow): void {
    this.reservations.update({...row.reservation, paid: true}).subscribe();
  }

  protected confirmDelete(row: TableRow): void {
    this.confirmation.openConfirmationPopup({
      title: 'Usunąć rezerwację?',
      message: `${row.guest}, parcela ${row.place}, ${row.checkin} – ${row.checkout}.`,
      confirmLabel: 'Usuń',
      tone: 'danger',
      action: () => this.reservations.delete(row.reservation.id!).subscribe(),
    });
  }

  private date(iso?: string): string {
    return iso ? DateFormater.DDMMYYYY(iso, DateDelimiter.DOT) : '';
  }
}
