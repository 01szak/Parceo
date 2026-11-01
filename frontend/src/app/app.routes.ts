import {Routes} from '@angular/router';
import {LoginComponent} from '@features/auth/login.component';
import {RegisterComponent} from '@features/auth/register.component';
import {StatisticsPage} from '@features/statistics/statistics-page/statistics-page';
import {GuestPage} from '@features/guests/guest-page/guest-page.component';
import {ReservationPage} from '@features/reservations/table/reservation-page';
import {CalendarPage} from '@features/reservations/calendar/calendar-page';
import {SettingsPage} from '@features/settings/settings-page/settings-page.component';
import {AppShellComponent} from '@core/layout/app-shell.component';
import {authGuard, guestGuard, HOME_PATH, LOGIN_PATH} from '@core/guards/auth.guard';

const title = (page: string) => `${page} | Parceo`;

export const routes: Routes = [
  {path: LOGIN_PATH, component: LoginComponent, canActivate: [guestGuard], title: title('Logowanie')},
  {path: 'register', component: RegisterComponent},
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      //the reservation table stands in for the "Dziś" page until step 7 of PLAN.md
      {path: HOME_PATH, component: ReservationPage, title: title('Dziś')},
      {path: 'kalendarz', component: CalendarPage, title: title('Kalendarz')},
      {path: 'goscie', component: GuestPage, title: title('Goście')},
      {path: 'raporty', component: StatisticsPage, title: title('Raporty')},
      {path: 'ustawienia', component: SettingsPage, title: title('Ustawienia')},
      {path: '', pathMatch: 'full', redirectTo: HOME_PATH},
    ]
  },

  //addresses of the previous version, kept so old bookmarks keep working
  {path: 'login', redirectTo: LOGIN_PATH},
  {path: 'admin-page/calendar', redirectTo: 'kalendarz'},
  {path: 'admin-page/reservations', redirectTo: HOME_PATH},
  {path: 'admin-page/users', redirectTo: 'goscie'},
  {path: 'admin-page/statistics', redirectTo: 'raporty'},
  {path: 'admin-page/settings', redirectTo: 'ustawienia'},
  {path: 'admin-page', redirectTo: HOME_PATH},
  {path: '**', redirectTo: HOME_PATH},
];
