import {Component, inject} from '@angular/core';
import {NewDatePickerComponent} from '@shared/ui/date-picker/new-date-picker.component';
import {StatisticsService} from '@core/services/openApiWrappers/StatisticsService';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {RevenueStat} from '@features/statistics/statistics-page/revenue-stat';
import {CommonModule} from '@angular/common';
import {GuestsPerCountryStat} from '@features/statistics/statistics-page/guests-per-country-stat';

@Component({
  selector: 'statistics',
  imports: [
    CommonModule,
    NewDatePickerComponent,
    RevenueStat,
    GuestsPerCountryStat,
    MatProgressSpinner,
  ],
  styles: `
    .datePicker {
      width: 100%;
      display: flex;
      justify-content: start;
      margin-left: 100px;
    }

    app-new-date-picker {
      width: 100%;
    }
    .tablesWrapper {
      display: flex;
      flex-direction: row;
      padding: 20px;
      gap: 50px;
    }
    .spinnerContainer {
      display: flex;
      justify-content: center;
      padding-top: 10px;
    }
    .stat {
      width: 100%;
    }
  `,
  template: `
    <div class="datePicker">
      <app-new-date-picker (month)="statisticsService.month.set($event)" (year)="statisticsService.year.set($event)"/>
    </div>
    @if (statisticsService.isLoading()) {
      <div class="spinnerContainer">
        <mat-spinner diameter="32"></mat-spinner>
      </div>
    }
    @if (statisticsService.hasError()) {
      <p class="error">Nie udało się pobrać statystyk.</p>
    }
    <!-- the stats stay mounted while loading, otherwise they lose their state (table / graph view) -->
    <div class="tablesWrapper">
      <revenue-stat class="stat"
                    [data]="statisticsService.paidRevenue()"
                    [title]="'Rezerwacje zrealizowane'">
      </revenue-stat>
      <revenue-stat class="stat"
                    [data]="statisticsService.unpaidRevenue()"
                    [title]="'Rezerwacje nieopłacone'">
      </revenue-stat>
      <guests-per-country-stat class="stat"
                     [data]="statisticsService.guestsPerCountry()"
                     [title]="'Rozkład gości na kraje'">
      </guests-per-country-stat>
    </div>
  `,
  standalone: true
})
export class StatisticsPage {
  protected readonly statisticsService = inject(StatisticsService);
}
