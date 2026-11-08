import {ChangeDetectionStrategy, Component, computed, contentChildren, input, output, TemplateRef} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {MatSort, MatSortHeader, Sort} from '@angular/material/sort';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {MatProgressBar} from '@angular/material/progress-bar';
import {CellContext, CellDefDirective} from './cell-def.directive';
import {QuerySort} from '@core/services/openapiwrappers/paged-query';
import {EmptyStateComponent} from '@shared/ui/empty-state/empty-state.component';

export interface ColumnDef {
  key: string;
  label: string;
  //backend property to sort by; columns without it are not sortable
  sortField?: string;
  align?: 'start' | 'end';
  //a visually hidden header (e.g. the actions column)
  hideLabel?: boolean;
}

export interface TablePage {
  pageIndex: number;
  pageSize: number;
}

export const PAGE_SIZES = [10, 25, 50];

/**
 * A server-side paged and sorted table. The parent owns the data (rows, total, sort, page)
 * and reacts to the outputs; custom cells come as <ng-template appCell="key" let-row>.
 * The toolbar is projected with [tableToolbar], a custom empty state with [tableEmpty].
 */
const INTERACTIVE = 'button, a, input, select, textarea, [role="button"], [role="checkbox"], [role="menuitem"]';

@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet, MatTableModule, MatSort, MatSortHeader, MatPaginator, MatProgressBar, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T> {
  public readonly columns = input.required<readonly ColumnDef[]>();
  public readonly rows = input.required<readonly T[]>();
  public readonly total = input(0);
  public readonly pageIndex = input(0);
  public readonly pageSize = input(10);
  public readonly sort = input<QuerySort | null>(null);
  public readonly loading = input(false);
  public readonly failed = input(false);
  public readonly clickableRows = input(true);
  //read by screen readers for a clickable row, e.g. "Otwórz rezerwację Anny Nowak"
  public readonly rowLabel = input<(row: T) => string>(() => 'Otwórz');

  public readonly pageChange = output<TablePage>();
  public readonly sortChange = output<QuerySort | null>();
  public readonly rowClick = output<T>();

  private readonly cellDefs = contentChildren(CellDefDirective);

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly columnKeys = computed(() => this.columns().map(c => c.key));
  protected readonly cellTemplates = computed(() => {
    const templates = new Map<string, TemplateRef<CellContext<T>>>();
    this.cellDefs().forEach(def => templates.set(def.appCell(), def.template as TemplateRef<CellContext<T>>));
    return templates;
  });

  protected readonly activeSortKey = computed(() => {
    const sort = this.sort();
    return sort ? this.columns().find(c => c.sortField === sort.field)?.key ?? '' : '';
  });
  protected readonly activeSortDirection = computed(() => this.sort()?.direction === 'DESC' ? 'desc' : this.sort() ? 'asc' : '');

  protected value(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  protected onSort(event: Sort): void {
    const column = this.columns().find(c => c.key === event.active);
    if (!column?.sortField || !event.direction) {
      this.sortChange.emit(null);
      return;
    }
    this.sortChange.emit({field: column.sortField, direction: event.direction === 'asc' ? 'ASC' : 'DESC'});
  }

  protected onPage(event: PageEvent): void {
    this.pageChange.emit({pageIndex: event.pageIndex, pageSize: event.pageSize});
  }

  //a click or Enter on a control inside a cell (edit, delete, menu, checkbox) belongs to that control, not to the row
  protected onRowClick(row: T, event: Event): void {
    if (!this.clickableRows()) return;
    const rowElement = event.currentTarget as HTMLElement;
    const control = (event.target as HTMLElement).closest(INTERACTIVE);
    if (control && control !== rowElement && rowElement.contains(control)) return;
    this.rowClick.emit(row);
  }
}
