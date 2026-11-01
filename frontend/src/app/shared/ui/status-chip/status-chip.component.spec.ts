import {TestBed} from '@angular/core/testing';
import {StatusChipComponent} from './status-chip.component';

describe('StatusChipComponent', () => {
  it('shows the word and the icon of the status, not only a color', () => {
    const fixture = TestBed.createComponent(StatusChipComponent);
    fixture.componentRef.setInput('kind', 'late');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Po terminie');
    expect(element.querySelector('mat-icon')?.textContent?.trim()).toBe('warning');
    expect(element.classList).toContain('tone-late');
  });
});
