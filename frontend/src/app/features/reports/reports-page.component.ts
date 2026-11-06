import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {map, startWith} from 'rxjs';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatChipListbox, MatChipOption} from '@angular/material/chips';
import {MatProgressBar} from '@angular/material/progress-bar';
import {ReservationDto, SearchCriteria} from '../../api';
import {ResourceType} from '@core/services/openapiwrappers/service-facade.service';
import {createPagedQuery, PagedQuery} from '@core/services/openapiwrappers/paged-query';
import {CamperPlaceService} from '@core/services/openapiwrappers/CamperPlaceService';
import {FormFactoryService} from '@shared/form/FormFactoryService';
import {PageHeaderComponent} from '@shared/ui/page-header/page-header.component';
import {EmptyStateComponent} from '@shared/ui/empty-state/empty-state.component';
import {DateRangeFieldComponent} from '@shared/ui/date-range-field/date-range-field.component';
import {BarChartComponent, ChartBar} from '@shared/ui/charts/bar-chart.component';
import {DonutChartComponent, DonutSlice} from '@shared/ui/charts/donut-chart.component';
import {buildReport, percentChange, ReportPeriod, topCountries} from '@shared/domain/reports';
import {PeriodKind, previousPeriod, reportPeriod} from '@shared/domain/report-period';
import {formatPln} from '@shared/domain/money';
import {countryName} from '@shared/domain/countries';
import {countLabel} from '@shared/domain/plural';
import {nightsBetween, nightsOf} from '@shared/domain/stay-range';
import {toCsv} from '@shared/domain/csv';
import {todayIso} from '@shared/domain/iso-date';

const PERIODS: readonly { kind: PeriodKind, label: string }[] = [
  {kind: 'thisMonth', label: 'Ten miesiąc'},
  {kind: 'lastMonth', label: 'Poprzedni miesiąc'},
  {kind: 'thisYear', label: 'Ten rok'},
  {kind: 'custom', label: 'Wybierz daty'},
];

const MONTHS_SHORT = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const SLICE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];
//four countries keep their own color, the rest is one "Inne kraje" slice
const DONUT_SLICES = 5;

function overlapping(period: ReportPeriod): SearchCriteria[] {
  return [
    {key: 'checkin', operation: 'LESS_THEN', value: period.to, joinOperator: 'AND'},
    {key: 'checkout', operation: 'GREATER_THEN', value: period.from, joinOperator: 'AND'},
  ];
}

//thousands without grosze for the chart axis: "2 500"
function axisAmount(value: number): string {
  return formatPln(value).replace(/,00 zł$/, '').replace(/,\d\d zł$/, '');
}

@Component({
  selector: 'app-reports-page',
  imports: [
    MatButton,
    MatIcon,
    MatChipListbox,
    MatChipOption,
    MatProgressBar,
    PageHeaderComponent,
    EmptyStateComponent,
    DateRangeFieldComponent,
    BarChartComponent,
    DonutChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.scss',
})
export class ReportsPageComponent {
  private readonly camperPlaces = inject(CamperPlaceService);
  private readonly today = todayIso();

  protected readonly periods = PERIODS;
  protected readonly kind = signal<PeriodKind>('thisMonth');
  protected readonly customRange = inject(FormFactoryService).buildStayRange();
  private readonly customValue = toSignal(this.customRange.valueChanges.pipe(
    startWith(null),
    map(() => {
      const {start, end} = this.customRange.getRawValue();
      return start?.isValid() && end?.isValid() && end.isAfter(start)
        ? {from: start.format('YYYY-MM-DD'), to: end.format('YYYY-MM-DD')}
        : undefined;
    }),
  ));

  protected readonly period = computed(() => reportPeriod(this.kind(), this.today, this.customValue()));
  private readonly previous = computed(() => previousPeriod(this.kind(), this.period()));
  protected readonly waitingForDates = computed(() => this.kind() === 'custom' && !this.customValue());

  private readonly current = createPagedQuery<ReservationDto>(ResourceType.RESERVATION, {unpaged: true});
  private readonly before = createPagedQuery<ReservationDto>(ResourceType.RESERVATION, {unpaged: true});

  private readonly places = this.camperPlaces.camperPlaces;
  protected readonly report = computed(() => buildReport(this.current.page().content, this.places(), this.period()));
  private readonly previousReport = computed(() => buildReport(this.before.page().content, this.places(), this.previous()));

  protected readonly loading = computed(() => this.current.loading() || this.before.loading());
  protected readonly failed = computed(() => this.current.failed() || this.camperPlaces.unpagedCamperPlaceResource.status() === 'error');

  protected readonly summary = computed(() => {
    const period = this.period();
    const report = this.report();
    const change = percentChange(report.revenue, this.previousReport().revenue);
    const comparison = change === null ? '' : change === 0
      ? `, tyle samo co ${period.comparison}`
      : `, o ${Math.abs(change)}% ${change > 0 ? 'więcej' : 'mniej'} niż ${period.comparison}`;
    return {
      revenue: `${period.phrase} przychód wyniósł ${formatPln(report.revenue)}${comparison}.`,
      occupancy: `Parcele były zajęte przez ${Math.round(report.occupancy * 100)}% nocy.`,
    };
  });

  protected readonly tiles = computed(() => {
    const report = this.report();
    return [
      {label: 'Przychód', value: formatPln(report.revenue), note: `poprzednio ${formatPln(this.previousReport().revenue)}`},
      {label: 'Sprzedane noce', value: String(report.nights), note: `na ${countLabel(this.places().length, 'parceli', 'parcelach', 'parcelach')}`},
      {label: 'Obłożenie', value: `${Math.round(report.occupancy * 100)}%`, note: 'zajętych nocy'},
      {label: 'Nieopłacone', value: formatPln(report.unpaidAmount), note: countLabel(report.unpaidReservations, 'rezerwacja', 'rezerwacje', 'rezerwacji')},
    ];
  });

  protected readonly chartTitle = computed(() =>
    this.report().bucketUnit === 'day' ? 'Przychód dzień po dniu' : 'Przychód miesiąc po miesiącu');

  protected readonly chartBars = computed<ChartBar[]>(() => {
    const {buckets, bucketUnit} = this.report();
    return buckets.map((bucket, i) => {
      const day = Number(bucket.start.slice(8, 10));
      const month = Number(bucket.start.slice(5, 7));
      const daily = bucketUnit === 'day';
      return {
        key: bucket.start,
        tick: daily ? (i === 0 || day % 5 === 0 ? `${day}.${String(month).padStart(2, '0')}` : '') : MONTHS_SHORT[month - 1],
        value: bucket.amount,
        title: daily ? `${bucket.start.slice(8, 10)}.${bucket.start.slice(5, 7)}.${bucket.start.slice(0, 4)}` : `${MONTHS_SHORT[month - 1]} ${bucket.start.slice(0, 4)}`,
        valueText: formatPln(bucket.amount),
      };
    });
  });
  protected readonly formatAxis = axisAmount;

  protected readonly typeRows = computed(() => this.report().byType.map(type => ({
    ...type,
    occupancyPercent: Math.round(type.occupancy * 100),
    revenueText: formatPln(type.revenue),
    averageText: type.nights ? formatPln(type.revenue / type.nights) : '—',
  })));

  protected readonly totals = computed(() => {
    const report = this.report();
    return {
      places: this.places().length,
      nights: report.nights,
      average: report.nights ? formatPln(report.revenue / report.nights) : '—',
      revenue: formatPln(report.revenue),
    };
  });

  protected readonly countrySlices = computed<DonutSlice[]>(() =>
    topCountries(this.report().countries, DONUT_SLICES).map((c, i) => ({
      key: c.country ?? 'other',
      label: c.country === null ? 'Inne kraje' : countryName(c.country) || 'Nie podano',
      value: c.guests,
      color: c.country === null ? 'var(--chart-other)' : SLICE_COLORS[i],
    })));
  protected readonly guestsCount = (count: number) => countLabel(count, 'gość', 'gości', 'gości');

  constructor() {
    effect(() => {
      const current = overlapping(this.period());
      const before = overlapping(this.previous());
      untracked(() => {
        this.setCriteria(this.current, current);
        this.setCriteria(this.before, before);
      });
    });
  }

  protected choosePeriod(kind: PeriodKind | null): void {
    if (kind) this.kind.set(kind);
  }

  protected downloadCsv(): void {
    const period = this.period();
    const rows = this.current.page().content
      .filter(r => r.checkin && r.checkout)
      .map(r => {
        const all = nightsBetween(r.checkin, r.checkout);
        const inside = nightsOf(r.checkin, r.checkout).filter(n => n >= period.from && n < period.to).length;
        const amount = all ? (r.price ?? 0) * inside / all : 0;
        return [
          `${r.guest?.firstname ?? ''} ${r.guest?.lastname ?? ''}`.trim(),
          r.camperPlace?.index ?? '',
          r.camperPlace?.camperPlaceType?.typeName ?? '',
          r.checkin,
          r.checkout,
          inside,
          formatPln(amount).replace(' zł', ''),
          r.paid ? 'tak' : 'nie',
        ];
      })
      .filter(row => Number(row[5]) > 0);
    const csv = toCsv(['Gość', 'Parcela', 'Rodzaj', 'Przyjazd', 'Wyjazd', 'Noce w okresie', 'Przychód w okresie (zł)', 'Opłacona'], rows);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    link.download = `parceo-raport-${period.from}-${period.to}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private setCriteria(query: PagedQuery<ReservationDto>, criteria: SearchCriteria[]): void {
    if (JSON.stringify(query.criteria()) !== JSON.stringify(criteria)) query.criteria.set(criteria);
  }
}
