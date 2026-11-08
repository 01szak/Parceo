import {TestBed} from '@angular/core/testing';
import {MAT_SNACK_BAR_DATA} from '@angular/material/snack-bar';
import {SnackBarComponent, SnackBarData} from './snack-bar.component';

describe('SnackBarComponent', () => {
  it('shows the message with the icon of its kind', () => {
    const data: SnackBarData = {message: 'Zapisano rezerwację', kind: 'error'};
    TestBed.configureTestingModule({
      imports: [SnackBarComponent],
      providers: [{provide: MAT_SNACK_BAR_DATA, useValue: data}],
    });
    const fixture = TestBed.createComponent(SnackBarComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Zapisano rezerwację');
    expect(element.querySelector('mat-icon')?.textContent?.trim()).toBe('error');
  });
});
