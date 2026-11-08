import {ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection} from '@angular/core';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions} from '@angular/material/form-field';
import {MatIconRegistry} from '@angular/material/icon';
import {ThemeService} from '@core/services/ThemeService';
import {TextSizeService} from '@core/services/TextSizeService';
import {MatPaginatorIntl} from '@angular/material/paginator';
import {PolishPaginatorIntl} from '@core/i18n/polish-paginator-intl';
import {provideMocks} from '@core/mocks/provide-mocks';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {AuthInterceptor} from '@core/interceptors/auth.interceptor';
import {BlobJsonInterceptor} from '@core/interceptors/blob-to-json.interceptor';
import moment from 'moment';
import 'moment/locale/pl'; //month and day names, the week starting on Monday
import {provideMomentDateAdapter} from '@angular/material-moment-adapter';
import {MAT_DATE_LOCALE} from '@angular/material/core';
import {provideApiConfiguration} from './api/api-configuration';

moment.locale('pl');

export const DATE_FORMATS = {
  parse: {
    dateInput: ['DD.MM.YYYY', 'DD.MM.YY'],
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

//one field variant in the whole app; hints take space only when they are shown
const FORM_FIELD_DEFAULTS: MatFormFieldDefaultOptions = {appearance: 'outline', subscriptSizing: 'dynamic'};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: BlobJsonInterceptor, multi: true},
    provideMomentDateAdapter(DATE_FORMATS),
    { provide: MAT_DATE_LOCALE, useValue: 'pl-PL' },
    provideApiConfiguration('/api'),
    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: FORM_FIELD_DEFAULTS},
    {provide: MatPaginatorIntl, useClass: PolishPaginatorIntl},
    //MOCK: data the backend does not provide yet (PLAN.md, "Mocki we frontendzie")
    ...provideMocks(),
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-rounded');
      //apply the stored theme and text size before the first render
      inject(ThemeService);
      inject(TextSizeService);
    }),
  ]
};
