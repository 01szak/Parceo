import {computed, inject, Injectable} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {tap} from 'rxjs';
import {DEFAULT_DISPLAY_SETTINGS, DisplaySettings, DisplaySettingsApi} from '@core/mocks/display-settings.mock';

//the user's display settings (served by DisplaySettingsApi, a MOCK for now); defaults until they are loaded
@Injectable({providedIn: 'root'})
export class DisplaySettingsService {
  private readonly api = inject(DisplaySettingsApi);

  private readonly resource = rxResource({
    defaultValue: DEFAULT_DISPLAY_SETTINGS,
    stream: () => this.api.get(),
  });

  public readonly settings = computed(() => this.resource.hasValue() ? this.resource.value() : DEFAULT_DISPLAY_SETTINGS);
  public readonly calendarDays = computed(() => this.settings().calendarDays);
  public readonly calendarScrollDays = computed(() => this.settings().calendarScrollDays);

  public save(settings: DisplaySettings) {
    return this.api.save(settings).pipe(tap(saved => this.resource.set(saved)));
  }
}
