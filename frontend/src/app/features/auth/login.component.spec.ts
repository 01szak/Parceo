import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {LoginComponent} from './login.component';

describe('LoginComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    });
  });

  it('shows Polish errors for empty fields instead of sending the form', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    const errors = Array.from(element.querySelectorAll('mat-error')).map(e => e.textContent?.trim());
    expect(errors).toEqual(['Podaj login.', 'Podaj hasło.']);
  });
});
