import {Injectable, inject} from '@angular/core';
import {forkJoin, from, Observable} from 'rxjs';
import {
  Api,
  getGuestPerCountryDistribution,
  getNightsSold,
  getOccupancyByCamperPlaceType,
  getOverallOccupancy,
  getRevenue,
  getRevenuePerCamperPlace,
  getRevenuePerDay,
  GuestCountPerCountry,
  OccupancyPerCamperPlaceType,
  RevenuePerCamperPlace,
  RevenuePerDay,
} from '../../../api';
import {bucketUnit, ReportPeriod} from '@shared/domain/reports';
import {addDays} from '@shared/domain/stay-range';

export interface PeriodStatistics {
  revenue: number;
  revenuePerDay: RevenuePerDay[];
  nightsSold: number;
  overallOccupancy: number;
  occupancyByType: OccupancyPerCamperPlaceType[];
  guestsByCountry: GuestCountPerCountry[];
  revenuePerCamperPlace: RevenuePerCamperPlace[];
}

function inclusiveRange(period: ReportPeriod): { from: string, to: string } {
  return {from: period.from, to: addDays(period.to, -1)};
}

//read-only reporting calls backing the Raporty page; dates are YYYY-MM-DD, both inclusive on the backend
@Injectable({providedIn: 'root'})
export class StatisticsService {
  private readonly api = inject(Api);

  public getPeriodStatistics(period: ReportPeriod): Observable<PeriodStatistics> {
    const range = inclusiveRange(period);
    return forkJoin({
      revenue: this.api.invoke(getRevenue, range),
      //the backend groups in the very unit the chart draws, so a 10-year period is ~120 rows, not ~3650
      revenuePerDay: this.api.invoke(getRevenuePerDay,
        {...range, granularity: bucketUnit(period) === 'month' ? 'MONTH' : 'DAY'}),
      nightsSold: this.api.invoke(getNightsSold, range),
      overallOccupancy: this.api.invoke(getOverallOccupancy, range),
      occupancyByType: this.api.invoke(getOccupancyByCamperPlaceType, range),
      guestsByCountry: this.api.invoke(getGuestPerCountryDistribution, range),
      revenuePerCamperPlace: this.api.invoke(getRevenuePerCamperPlace, range),
    });
  }

  public getRevenue(period: ReportPeriod): Observable<number> {
    return from(this.api.invoke(getRevenue, inclusiveRange(period)));
  }
}
