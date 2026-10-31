import {computed, inject, Injectable, signal} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {from} from 'rxjs';
import {Api, CountryDistribution, getRevenue, getUserPerCountry, Revenue} from '../../../api';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private readonly api = inject(Api);

  //month is counted from 0 (Date, date picker), the backend counts months from 1
  public readonly month = signal(new Date().getMonth());
  public readonly year = signal(new Date().getFullYear());

  private readonly period = computed(() => ({month: this.month(), year: this.year()}));

  //the result contains two lists: [0] - paid reservations, [1] - unpaid reservations
  public readonly revenueResource = rxResource({
    defaultValue: [] as Revenue[][],
    params: this.period,
    stream: ({params}) => from(this.api.invoke(getRevenue, {month: params.month + 1, year: params.year}))
  });

  public readonly countriesResource = rxResource({
    defaultValue: [] as CountryDistribution[],
    params: this.period,
    stream: ({params}) => from(this.api.invoke(getUserPerCountry, {month: params.month + 1, year: params.year}))
  });

  //value() throws while a resource is in the error state, hence the hasValue() guards
  public readonly paidRevenue = computed(() => this.revenueResource.hasValue() ? this.revenueResource.value()[0] ?? [] : []);
  public readonly unpaidRevenue = computed(() => this.revenueResource.hasValue() ? this.revenueResource.value()[1] ?? [] : []);
  public readonly guestsPerCountry = computed(() => this.countriesResource.hasValue() ? this.countriesResource.value() : []);

  public readonly isLoading = computed(() => this.revenueResource.isLoading() || this.countriesResource.isLoading());
  public readonly hasError = computed(() => !!this.revenueResource.error() || !!this.countriesResource.error());
}
