import {ChangeDetectorRef, Component, inject, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {
  StatColumnConfig,
  StatisticsPanelComponent
} from '@features/statistics/statistics-page/statistic-panel/statistics-panel.component';
import {Revenue} from '../../../api';

@Component({
  selector: 'revenue-stat',
  imports: [
    StatisticsPanelComponent
  ],
  template: `
    <app-statistic-panel
        [title]="title"
        [displayData]="displayData"
        [getGraphData]="getGraphData"
        [displayedColumns]="columnConfig"
        [xAxisLabel]="'Parcele'"
        [yAxisLabel]="graphMode === 'revenue' ? 'Obrót (zł)' : 'Ilość rezerwacji'"
        [canToggleMode]="true"
        (modeChange)="onModeChange($event)"
    />
  `,
  styles: ``,
  standalone: true
})
export class RevenueStat implements OnInit, OnChanges {
  private cdr = inject(ChangeDetectorRef);

  @Input() data: Revenue[] = [];
  @Input() title = '';

  protected displayData: any[] = [];
  protected columnConfig: StatColumnConfig[] = [];
  protected graphMode: 'revenue' | 'count' = 'revenue';

  ngOnInit() {
    this.connectTables();
  }

  ngOnChanges(changes: SimpleChanges){
    if (changes['data']) {
      this.connectTables();
    }
  }

  onModeChange(mode: 'revenue' | 'count') {
    this.graphMode = mode;
    this.cdr.detectChanges();
  }

  getGraphData = () => {
    return [...this.data]
      .sort((a, b) => {
        const A = this.parseCpIndex(a.cpIndex!);
        const B = this.parseCpIndex(b.cpIndex!);

        return A.num - B.num || A.letter.localeCompare(B.letter);
      })
      .map(r => ({
        name: r.cpIndex,
        value: this.graphMode === 'revenue'
          ? r.revenue
          : (r.count ?? 0)
      }));
  }

  connectTables() {
    const newData: any[] = [];

    const allIndices = new Set([
      ...this.data.map(r => r.cpIndex!),
    ]);

    allIndices.forEach(index => {
      const paidRev = this.data.find(r => r.cpIndex === index)?.revenue ?? 0;
      const countData = this.data.find(c => c.cpIndex === index)?.count ?? 0;

      newData.push({
        camperPlaceNumber: index,
        reservationCount: countData,
        revenue: paidRev + ' zł',
      });
    });

    newData.sort((a, b) => {
      const A = this.parseCpIndex(a.camperPlaceNumber);
      const B = this.parseCpIndex(b.camperPlaceNumber);

      return A.num - B.num || A.letter.localeCompare(B.letter);
    });

    this.displayData = newData;
    this.updateColumnConfig();
    this.cdr.detectChanges();
  }

  private updateColumnConfig() {
    this.columnConfig = [
      { collumnDef: 'camperPlaceNumber', headerCellDef: 'Nr. parceli', sum: 'Suma:' },
      { collumnDef: 'reservationCount', headerCellDef: 'Ilość rezerwacji', sum: this.countResCount() },
      { collumnDef: 'revenue', headerCellDef: 'Obrót', sum: this.countRevenue() + ' zł' },
    ];
  }

  private parseCpIndex(value: string) {
    const match = value.match(/^(\d+)([a-zA-Z]?)$/);
    return {
      num: match ? Number(match[1]) : Number.MAX_SAFE_INTEGER,
      letter: match ? match[2] || '' : ''
    };
  }

  countResCount() {
    return this.data.reduce((sum, row) => sum + (row.count ?? 0), 0);
  }

  countRevenue() {
    return this.data.reduce((sum, row) => sum + (row.revenue ?? 0), 0);
  }
}

export type ReservationDisplayData = {
  camperPlaceNumber: string;
  reservationCount: number;
  revenue: string;
}
