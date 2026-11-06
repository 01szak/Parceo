import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {OrganisationService} from '@core/services/openApiWrappers/OrganisationService';
import {OrganisationDto} from '../../../api';
import {SettingsCampingComponent} from './settings-camping.component';

describe('SettingsCampingComponent', () => {
  const organisation = signal<OrganisationDto | null>(null);
  const loading = signal(false);
  const failed = signal(false);

  function render(): HTMLElement {
    TestBed.configureTestingModule({
      imports: [SettingsCampingComponent],
      providers: [{
        provide: OrganisationService,
        useValue: {organisation, loading, failed, logoIcon: 'camping'},
      }],
    });
    const fixture = TestBed.createComponent(SettingsCampingComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => {
    organisation.set(null);
    loading.set(false);
    failed.set(false);
  });

  it('shows the campsite details without fields to edit', () => {
    organisation.set({
      id: 1,
      organisationName: 'Leśna Polana',
      address: 'ul. Leśna 1, 76-032 Mielno',
      phoneNumber: '+48 600 100 200',
    });

    const element = render();
    const values = Array.from(element.querySelectorAll('dd')).map(dd => dd.textContent?.trim());

    expect(values).toEqual(['Leśna Polana', 'ul. Leśna 1, 76-032 Mielno', '+48 600 100 200', 'Nie podano']);
    expect(element.querySelector('input, form, button')).toBeNull();
  });

  it('says when the details cannot be loaded', () => {
    failed.set(true);

    const element = render();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Nie udało się wczytać danych kempingu');
    expect(element.querySelector('dl')).toBeNull();
  });
});
