import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {FilterBarComponent, FilterValues} from './filter-bar.component';

describe('FilterBarComponent', () => {
  let fixture: ComponentFixture<FilterBarComponent>;
  let element: HTMLElement;

  function render(filters: FilterValues) {
    TestBed.configureTestingModule({imports: [FilterBarComponent], providers: [provideNoopAnimations()]});
    fixture = TestBed.createComponent(FilterBarComponent);
    fixture.componentRef.setInput('views', [{id: 'active', label: 'Aktywne rezerwacje'}]);
    fixture.componentRef.setInput('activeViewId', 'active');
    fixture.componentRef.setInput('groups', [
      {key: 'payment', label: 'Płatność', options: [{value: 'any', label: 'Dowolna'}, {value: 'unpaid', label: 'Nieopłacona'}]},
    ]);
    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  it('shows applied filters as chips and removes one on its close button', () => {
    render({payment: 'unpaid'});
    const emitted: FilterValues[] = [];
    fixture.componentInstance.filtersChange.subscribe(f => emitted.push(f));

    expect(element.querySelector('mat-chip')?.textContent).toContain('Płatność: Nieopłacona');
    element.querySelector<HTMLButtonElement>('mat-chip button')!.click();
    expect(emitted).toEqual([{payment: 'any'}]);
  });

  it('shows no chips and no save button without filters', () => {
    render({payment: 'any'});
    expect(element.querySelector('mat-chip')).toBeNull();
    expect(element.textContent).not.toContain('Zapisz filtr');
  });
});
