import {Injectable, inject} from '@angular/core';
import {from, Observable} from 'rxjs';
import {Api, getRevenuePerCamperPlace, RevenuePerCamperPlace} from '../../../api';

//read-only reporting calls backing the Raporty page; dates are YYYY-MM-DD, both inclusive on the backend
@Injectable({providedIn: 'root'})
export class StatisticsService {
  private readonly api = inject(Api);

  public getRevenuePerCamperPlace(fromDate: string, toDate: string): Observable<RevenuePerCamperPlace[]> {
    return from(this.api.invoke(getRevenuePerCamperPlace, {from: fromDate, to: toDate}));
  }
}
