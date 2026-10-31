import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {
  StatColumnConfig,
  StatisticsPanelComponent
} from '@features/statistics/statistics-page/statistic-panel/statistics-panel.component';
import {CountryDistribution} from '../../../api';
import {COUNTRIES} from '@shared/constants/COUNTRIES';

@Component({
  selector: 'guests-per-country-stat',
  imports: [
    StatisticsPanelComponent
  ],
  template: `
    <app-statistic-panel
        [title]="title"
        [displayData]="displayData"
        [getGraphData]="getGraphData"
        [displayedColumns]="columnConfig"
        [xAxisLabel]="'Kraje'"
        [yAxisLabel]="'Ilość gości'"
        [canToggleMode]="false"
    />
  `,
  styles: ``,
  standalone: true
})
export class GuestsPerCountryStat implements OnChanges {

  @Input() data: CountryDistribution[] = [];
  @Input() title = '';

  protected displayData: any[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data) {
      this.mapDataForTable();
    }
  }

  private mapDataForTable() {
    this.displayData = this.data.map(item => {
      const countryObj = COUNTRIES.find(c => c.isoCode === item.countryIsoCode!);
      return {
        country: countryObj?.name || item.countryIsoCode || 'Nieznany',
        isoCode: item.countryIsoCode?.toUpperCase() || '??',
        count: item.usersCount || 0
      };
    });
  }

  getGraphData = () => {
    return this.displayData.map(c => ({
      name: c.isoCode,
      value: c.count
    }));
  }

  protected columnConfig: StatColumnConfig[] = [
    { collumnDef: 'country', headerCellDef: 'Kraj' },
    { collumnDef: 'count', headerCellDef: 'Ilość gości' }
  ];
}
