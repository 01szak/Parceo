import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {AuthInterceptor} from '@core/interceptors/auth.interceptor';
import {BlobJsonInterceptor} from '@core/interceptors/blob-to-json.interceptor';
import moment from 'moment';
import {provideMomentDateAdapter} from '@angular/material-moment-adapter';
import {MAT_DATE_LOCALE} from '@angular/material/core';
import {provideApiConfiguration} from './api/api-configuration';

moment.locale('pl');

export const DATE_FORMATS = {
  parse: {
    dateInput: 'DD.MM.YY',
  },
  display: {
    dateInput: 'DD.MM.YY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

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
  ]
};
