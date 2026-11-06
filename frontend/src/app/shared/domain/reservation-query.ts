import {SearchCriteria} from '../../api';
import {addDays} from './stay-range';

/*
 * The backend combines criteria strictly from left to right ((a OR b) AND c ...), without brackets,
 * so the only OR group (the text search) always goes first and everything else is joined with AND.
 */

export type ReservationViewId = 'active' | 'coming' | 'lastWeek' | 'recent' | 'unpaid' | 'all';
export type StatusFilter = 'any' | 'stay' | 'arrive' | 'ended' | 'late';
export type PaymentFilter = 'any' | 'paid' | 'unpaid';
export type ArrivalFilter = 'any' | 'lastWeek' | 'lastMonth' | 'nextWeek';

export interface ReservationFilters {
  status: StatusFilter;
  payment: PaymentFilter;
  arrival: ArrivalFilter;
}

export interface ReservationSort {
  //backend property path, e.g. 'checkin', 'guest.lastname'
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface ReservationView {
  id: ReservationViewId;
  label: string;
  sort: ReservationSort;
}

export const NO_FILTERS: ReservationFilters = {status: 'any', payment: 'any', arrival: 'any'};

export const RESERVATION_VIEWS: readonly ReservationView[] = [
  {id: 'active', label: 'Aktywne rezerwacje', sort: {field: 'checkout', direction: 'ASC'}},
  {id: 'coming', label: 'Nadchodzące przyjazdy', sort: {field: 'checkin', direction: 'ASC'}},
  {id: 'lastWeek', label: 'Przyjazdy z ostatniego tygodnia', sort: {field: 'checkin', direction: 'DESC'}},
  {id: 'recent', label: 'Ostatnio dodane', sort: {field: 'createdAt', direction: 'DESC'}},
  {id: 'unpaid', label: 'Nieopłacone', sort: {field: 'checkout', direction: 'ASC'}},
  {id: 'all', label: 'Wszystkie rezerwacje', sort: {field: 'checkin', direction: 'DESC'}},
];

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

export interface FilterGroup<K extends keyof ReservationFilters = keyof ReservationFilters> {
  key: K;
  label: string;
  options: readonly FilterOption<ReservationFilters[K]>[];
}

export const RESERVATION_FILTER_GROUPS: readonly FilterGroup[] = [
  {
    key: 'status', label: 'Status', options: [
      {value: 'any', label: 'Dowolny'},
      {value: 'stay', label: 'Aktywna'},
      {value: 'arrive', label: 'Przyjazd'},
      {value: 'ended', label: 'Zakończona'},
      {value: 'late', label: 'Po terminie'},
    ]
  },
  {
    key: 'payment', label: 'Płatność', options: [
      {value: 'any', label: 'Dowolna'},
      {value: 'paid', label: 'Opłacona'},
      {value: 'unpaid', label: 'Nieopłacona'},
    ]
  },
  {
    key: 'arrival', label: 'Przyjazd', options: [
      {value: 'any', label: 'Dowolny'},
      {value: 'lastWeek', label: 'Ostatni tydzień'},
      {value: 'lastMonth', label: 'Ostatni miesiąc'},
      {value: 'nextWeek', label: 'Następne 7 dni'},
    ]
  },
] as readonly FilterGroup[];

const criterion = (key: string, operation: SearchCriteria['operation'], value: string, extra: Partial<SearchCriteria> = {}): SearchCriteria =>
  ({key, operation, value, joinOperator: 'AND', ...extra});

function arrivalBetween(from: string, to: string): SearchCriteria {
  return criterion('checkin', 'BETWEEN', from, {secondValue: to});
}

function viewCriteria(view: ReservationViewId, today: string): SearchCriteria[] {
  switch (view) {
    case 'active': return [criterion('reservationStatus', 'EQUALS', 'ACTIVE')];
    case 'coming': return [criterion('reservationStatus', 'EQUALS', 'COMING')];
    case 'lastWeek': return [arrivalBetween(addDays(today, -7), today)];
    case 'unpaid': return [criterion('paid', 'EQUALS', 'false')];
    default: return [];
  }
}

function statusCriteria(status: StatusFilter): SearchCriteria[] {
  switch (status) {
    case 'stay': return [criterion('reservationStatus', 'EQUALS', 'ACTIVE')];
    case 'arrive': return [criterion('reservationStatus', 'EQUALS', 'COMING')];
    case 'ended': return [criterion('reservationStatus', 'EQUALS', 'EXPIRED'), criterion('paid', 'EQUALS', 'true')];
    case 'late': return [criterion('reservationStatus', 'EQUALS', 'EXPIRED'), criterion('paid', 'EQUALS', 'false')];
    default: return [];
  }
}

function paymentCriteria(payment: PaymentFilter): SearchCriteria[] {
  return payment === 'any' ? [] : [criterion('paid', 'EQUALS', String(payment === 'paid'))];
}

function arrivalCriteria(arrival: ArrivalFilter, today: string): SearchCriteria[] {
  switch (arrival) {
    case 'lastWeek': return [arrivalBetween(addDays(today, -7), today)];
    case 'lastMonth': return [arrivalBetween(addDays(today, -30), today)];
    case 'nextWeek': return [arrivalBetween(addDays(today, 1), addDays(today, 7))];
    default: return [];
  }
}

//guest's first name, last name or the car registration contain the text (the only OR group, so it goes first)
function searchCriteria(text: string): SearchCriteria[] {
  const value = text.trim();
  if (!value) return [];
  return [
    criterion('firstname', 'LIKE', value, {joinObject: 'guest', joinOperator: undefined}),
    criterion('lastname', 'LIKE', value, {joinObject: 'guest', joinOperator: 'OR'}),
    criterion('carRegistration', 'LIKE', value, {joinObject: 'guest', joinOperator: 'OR'}),
  ];
}

/**
 * Builds the backend search request for the reservation table.
 * @param today the current date (YYYY-MM-DD), relative views and filters are counted from it
 */
export function reservationCriteria(view: ReservationViewId, filters: ReservationFilters, search: string, today: string): SearchCriteria[] {
  return [
    ...searchCriteria(search),
    ...viewCriteria(view, today),
    ...statusCriteria(filters.status),
    ...paymentCriteria(filters.payment),
    ...arrivalCriteria(filters.arrival, today),
  ];
}

export function hasFilters(filters: ReservationFilters): boolean {
  return (Object.keys(filters) as (keyof ReservationFilters)[]).some(key => filters[key] !== 'any');
}

//"Płatność: Nieopłacona" for every filter that is set
export function filterLabels(filters: ReservationFilters): { key: keyof ReservationFilters, label: string }[] {
  return RESERVATION_FILTER_GROUPS
    .filter(group => filters[group.key] !== 'any')
    .map(group => {
      const option = group.options.find(o => o.value === filters[group.key]);
      return {key: group.key, label: `${group.label}: ${option?.label ?? filters[group.key]}`};
    });
}
