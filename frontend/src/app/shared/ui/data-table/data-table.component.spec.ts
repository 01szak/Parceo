import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {DataTableComponent} from './data-table.component';
import {QuerySort} from '@core/services/openApiWrappers/paged-query';

interface Row {
  name: string;
  amount: string;
}

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent<Row>>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [DataTableComponent], providers: [provideNoopAnimations()]});
    fixture = TestBed.createComponent(DataTableComponent<Row>);
    fixture.componentRef.setInput('columns', [
      {key: 'name', label: 'Gość', sortField: 'guest.lastname'},
      {key: 'amount', label: 'Kwota', align: 'end'},
    ]);
    fixture.componentRef.setInput('rows', [{name: 'Anna Nowak', amount: '390,00 zł'}, {name: 'Jan Kowalski', amount: '120,00 zł'}]);
    fixture.componentRef.setInput('total', 2);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('renders a row per item', () => {
    const rows = element.querySelectorAll('tr.mat-mdc-row');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Anna Nowak');
  });

  it('emits the backend field when a sortable header is clicked', () => {
    const sorts: (QuerySort | null)[] = [];
    fixture.componentInstance.sortChange.subscribe(s => sorts.push(s));
    element.querySelector<HTMLElement>('th[mat-sort-header] .mat-sort-header-container')!.click();
    expect(sorts).toEqual([{field: 'guest.lastname', direction: 'ASC'}]);
  });

  it('emits the clicked row', () => {
    const clicked: Row[] = [];
    fixture.componentInstance.rowClick.subscribe(r => clicked.push(r));
    element.querySelector<HTMLElement>('tr.mat-mdc-row')!.click();
    expect(clicked[0].name).toBe('Anna Nowak');
  });

  it('shows an error state when loading failed', () => {
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('failed', true);
    fixture.detectChanges();
    expect(element.textContent).toContain('Nie udało się wczytać danych.');
  });
});
