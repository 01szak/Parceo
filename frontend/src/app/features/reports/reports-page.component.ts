import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked} from '@angular/core';
import {rxResource, toSignal} from '@angular/core/rxjs-interop';
import {map, startWith} from 'rxjs';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatChipListbox, MatChipListboxChange, MatChipOption} from '@angular/material/chips';
import {MatProgressBar} from '@angular/material/progress-bar';
import {ReservationDto, SearchCriteria} from '../../api';
import {ResourceType} from '@core/services/openapiwrappers/service-facade.service';
import {createPagedQuery, PagedQuery} from '@core/services/openapiwrappers/paged-query';
import {CamperPlaceService} from '@core/services/openapiwrappers/CamperPlaceService';
import {PeriodStatistics, StatisticsService} from '@core/services/openapiwrappers/StatisticsService';
import {FormFactoryService} from '@shared/form/FormFactoryService';
import {PageHeaderComponent} from '@shared/ui/page-header/page-header.component';
import {EmptyStateComponent} from '@shared/ui/empty-state/empty-state.component';
import {DateRangeFieldComponent} from '@shared/ui/date-range-field/date-range-field.component';
import {BarChartComponent, ChartBar} from '@shared/ui/charts/bar-chart.component';
import {DonutChartComponent, DonutSlice} from '@shared/ui/charts/donut-chart.component';
import {bucketUnit, buildReport, CountryCount, emptyBuckets, percentChange, ReportPeriod, topCountries} from '@shared/domain/reports';
import {PeriodKind, previousPeriod, reportPeriod} from '@shared/domain/report-period';
import {formatPln} from '@shared/domain/money';
import {countryName} from '@shared/domain/countries';
import {countLabel} from '@shared/domain/plural';
import {nightsBetween, nightsOf} from '@shared/domain/stay-range';
import {toCsv} from '@shared/domain/csv';
import {todayIso} from '@shared/domain/iso-date';
import {criteria} from '@shared/domain/search-criteria';

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

const NO_STATISTICS: PeriodStatistics = {
  revenue: 0,
  revenuePerDay: [],
  nightsSold: 0,
  overallOccupancy: 0,
  occupancyByType: [],
  guestsByCountry: [],
  revenuePerCamperPlace: [],
};

function overlapping(period: ReportPeriod): SearchCriteria[] {
  return [
    criteria('checkin', 'LESS_THEN', period.to),
    criteria('checkout', 'GREATER_THEN', period.from),
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
  private readonly statistics = inject(StatisticsService);
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

  private readonly places = this.camperPlaces.camperPlaces;
  private readonly report = computed(() => buildReport(this.current.page().content, this.places(), this.period()));

  private readonly stats = rxResource({
    defaultValue: NO_STATISTICS,
    params: () => this.period(),
    stream: () => this.statistics.getPeriodStatistics(this.period()),
  });

  private readonly previousRevenue = rxResource({
    defaultValue: 0,
    params: () => this.previous(),
    stream: () => this.statistics.getRevenue(this.previous()),
  });

  protected readonly camperPlaceRevenueRows = computed(() => this.stats.value().revenuePerCamperPlace
    .map(r => ({
      index: r.camperPlaceIndex ?? '',
      nightsSold: r.nightsSold ?? 0,
      revenueText: formatPln(r.revenue ?? 0),
      averageText: r.nightsSold ? formatPln((r.revenue ?? 0) / r.nightsSold) : '—',
    }))
    .sort((a, b) => a.index.localeCompare(b.index, 'pl', {numeric: true})));

  protected readonly loading = computed(() =>
    this.current.loading() || this.camperPlaces.unpagedCamperPlaceResource.isLoading()
    || this.stats.isLoading() || this.previousRevenue.isLoading());
  //the previous period only feeds the comparison; until it is here (or when it failed) there is nothing to compare with
  private readonly comparisonReady = computed(() =>
    !this.previousRevenue.isLoading() && this.previousRevenue.status() !== 'error');
  protected readonly failed = computed(() =>
    this.current.failed() || this.camperPlaces.unpagedCamperPlaceResource.status() === 'error'
    || this.stats.status() === 'error');

  protected readonly summary = computed(() => {
    const period = this.period();
    const stats = this.stats.value();
    const change = this.comparisonReady() ? percentChange(stats.revenue, this.previousRevenue.value()) : null;
    const comparison = change === null ? '' : change === 0
      ? `, tyle samo co ${period.comparison}`
      : `, o ${Math.abs(change)}% ${change > 0 ? 'więcej' : 'mniej'} niż ${period.comparison}`;
    return {
      revenue: `${period.phrase} przychód wyniósł ${formatPln(stats.revenue)}${comparison}.`,
      occupancy: `Parcele były zajęte przez ${Math.round(stats.overallOccupancy * 100)}% nocy.`,
    };
  });

  protected readonly tiles = computed(() => {
    const stats = this.stats.value();
    const report = this.report();
    return [
      {label: 'Przychód', value: formatPln(stats.revenue), note: this.previousRevenueNote()},
      {label: 'Sprzedane noce', value: String(stats.nightsSold), note: `na ${countLabel(this.places().length, 'parceli', 'parcelach', 'parcelach')}`},
      {label: 'Obłożenie', value: `${Math.round(stats.overallOccupancy * 100)}%`, note: 'zajętych nocy'},
      {label: 'Nieopłacone', value: formatPln(report.unpaidAmount), note: countLabel(report.unpaidReservations, 'rezerwacja', 'rezerwacje', 'rezerwacji')},
    ];
  });

  private previousRevenueNote(): string {
    if (this.previousRevenue.status() === 'error') return 'brak porównania z poprzednim okresem';
    return `poprzednio ${this.comparisonReady() ? formatPln(this.previousRevenue.value()) : '—'}`;
  }

  /*
   * The backend returns only the buckets that had a transaction, so they are merged into a zero-filled
   * series spanning the whole period - otherwise the chart would have gaps instead of empty days.
   */
  private readonly revenueBuckets = computed(() => {
    const period = this.period();
    const unit = bucketUnit(period);
    const buckets = emptyBuckets(period, unit);
    const indexOf = new Map(buckets.map((bucket, i) => [bucket.start, i]));
    this.stats.value().revenuePerDay.forEach(entry => {
      const i = indexOf.get(entry.day ?? '');
      if (i !== undefined) buckets[i].amount += entry.revenue ?? 0;
    });
    return {buckets, unit};
  });

  protected readonly chartTitle = computed(() =>
    this.revenueBuckets().unit === 'day' ? 'Przychód dzień po dniu' : 'Przychód miesiąc po miesiącu');

  protected readonly chartBars = computed<ChartBar[]>(() => {
    const {buckets, unit} = this.revenueBuckets();
    return buckets.map((bucket, i) => {
      const day = Number(bucket.start.slice(8, 10));
      const month = Number(bucket.start.slice(5, 7));
      const daily = unit === 'day';
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

  protected readonly typeRows = computed(() => this.stats.value().occupancyByType
    .map(type => ({
      typeName: type.typeName ?? '',
      occupancyPercent: Math.round((type.occupancy ?? 0) * 100),
    }))
    .sort((a, b) => a.typeName.localeCompare(b.typeName, 'pl')));

  protected readonly totals = computed(() => {
    const rows = this.stats.value().revenuePerCamperPlace;
    const nights = rows.reduce((sum, r) => sum + (r.nightsSold ?? 0), 0);
    const revenue = rows.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
    return {
      places: rows.length,
      nights,
      average: nights ? formatPln(revenue / nights) : '—',
      revenue: formatPln(revenue),
    };
  });

  private readonly countries = computed<CountryCount[]>(() => this.stats.value().guestsByCountry
    .map(c => ({country: c.country ?? '', guests: c.guestCount ?? 0}))
    .sort((a, b) => b.guests - a.guests));

  protected readonly countrySlices = computed<DonutSlice[]>(() =>
    topCountries(this.countries(), DONUT_SLICES).map((c, i) => ({
      key: c.country ?? 'other',
      label: c.country === null ? 'Inne kraje' : countryName(c.country) || 'Nie podano',
      value: c.guests,
      color: c.country === null ? 'var(--chart-other)' : SLICE_COLORS[i],
    })));
  protected readonly guestsCount = (count: number) => countLabel(count, 'gość', 'gości', 'gości');

  constructor() {
    //set right away, otherwise the first request would ask for every reservation before the effect runs
    this.current.criteria.set(overlapping(this.period()));
    effect(() => {
      const current = overlapping(this.period());
      untracked(() => this.setCriteria(this.current, current));
    });
  }

  protected choosePeriod(change: MatChipListboxChange): void {
    const kind = change.value as PeriodKind | undefined;
    if (kind) {
      this.kind.set(kind);
    } else {
      //clicking the selected chip deselects it; a period is always chosen, so select it again
      change.source.value = this.kind();
    }
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
