import {TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ConfirmationData, PopupConfirmationComponent} from './popup-confirmation.component';

describe('PopupConfirmationComponent', () => {
  function render(data: ConfirmationData) {
    const dialogRef = jasmine.createSpyObj<MatDialogRef<PopupConfirmationComponent>>('MatDialogRef', ['close']);
    TestBed.configureTestingModule({
      imports: [PopupConfirmationComponent],
      providers: [{provide: MAT_DIALOG_DATA, useValue: data}, {provide: MatDialogRef, useValue: dialogRef}],
    });
    const fixture = TestBed.createComponent(PopupConfirmationComponent);
    fixture.detectChanges();
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    return {fixture, dialogRef, buttons};
  }

  it('asks the question and runs the action on confirm', () => {
    const action = jasmine.createSpy('action');
    const {fixture, dialogRef, buttons} = render({title: 'Usunąć rezerwację?', confirmLabel: 'Usuń', tone: 'danger', action});

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Usunąć rezerwację?');
    const confirm = buttons.find(b => b.textContent?.trim() === 'Usuń')!;
    expect(confirm.classList).toContain('danger');

    confirm.click();
    expect(action).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('closes without the action on cancel', () => {
    const action = jasmine.createSpy('action');
    const {dialogRef, buttons} = render({action});

    buttons.find(b => b.textContent?.trim() === 'Anuluj')!.click();
    expect(action).not.toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
