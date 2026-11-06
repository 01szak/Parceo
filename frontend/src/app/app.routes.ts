import {Routes} from '@angular/router';
import {LoginComponent} from '@features/auth/login.component';
import {StatisticsPage} from '@features/statistics/statistics-page/statistics-page';
import {CalendarPageComponent} from '@features/calendar/calendar-page.component';
import {SettingsPage} from '@features/settings/settings-page/settings-page.component';
import {SettingsPlacesComponent} from '@features/settings/places/settings-places.component';
import {SettingsAppearanceComponent} from '@features/settings/appearance/settings-appearance.component';
import {AppShellComponent} from '@core/layout/app-shell.component';
import {TodayPageComponent} from '@features/today/today-page.component';
import {authGuard, guestGuard, HOME_PATH, LOGIN_PATH} from '@core/guards/auth.guard';

const title = (page: string) => `${page} | Parceo`;

export const routes: Routes = [
  {path: LOGIN_PATH, component: LoginComponent, canActivate: [guestGuard], title: title('Logowanie')},
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {path: HOME_PATH, component: TodayPageComponent, title: title('Dziś')},
      {path: 'kalendarz', component: CalendarPageComponent, title: title('Kalendarz')},
      {path: 'raporty', component: StatisticsPage, title: title('Raporty')},
      {
        path: 'ustawienia', component: SettingsPage, children: [
          {path: 'parcele', component: SettingsPlacesComponent, title: title('Parcele i ceny')},
          {path: 'wyglad', component: SettingsAppearanceComponent, title: title('Wygląd')},
          {path: '', pathMatch: 'full', redirectTo: 'parcele'},
        ]
      },
      {path: '', pathMatch: 'full', redirectTo: HOME_PATH},
    ]
  },

  //addresses of the previous version, kept so old bookmarks keep working
  {path: 'login', redirectTo: LOGIN_PATH},
  {path: 'admin-page/calendar', redirectTo: 'kalendarz'},
  {path: 'admin-page/reservations', redirectTo: HOME_PATH},
  {path: 'admin-page/users', redirectTo: HOME_PATH},
  {path: 'admin-page/statistics', redirectTo: 'raporty'},
  {path: 'admin-page/settings', redirectTo: 'ustawienia'},
  {path: 'admin-page', redirectTo: HOME_PATH},
  {path: '**', redirectTo: HOME_PATH},
];
