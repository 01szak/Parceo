import {computed, inject, Signal, signal, WritableSignal} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {Page} from '@core/models/Page';
import {SearchCriteria} from '../../../api';
import {ResourceType, ServiceFacade} from './service-facade.service';
import {DataVersionService} from './data-version.service';
import {emptyPage, safePage} from './page-utils';

export interface QuerySort {
  //backend property path, e.g. 'checkin' or 'guest.lastname'
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface PagedQueryOptions {
  pageSize?: number;
  sort?: QuerySort | null;
  //every matching row in one response (e.g. the occupancy of the next weeks); paging signals are ignored
  unpaged?: boolean;
}

//the state of one list: owned by the component that shows it, never shared through a root service
export interface PagedQuery<T> {
  readonly criteria: WritableSignal<SearchCriteria[]>;
  readonly pageIndex: WritableSignal<number>;
  readonly pageSize: WritableSignal<number>;
  readonly sort: WritableSignal<QuerySort | null>;
  readonly page: Signal<Page<T>>;
  readonly loading: Signal<boolean>;
  readonly failed: Signal<boolean>;
  reload(): void;
}

export const DEFAULT_PAGE_SIZE = 10;

/**
 * Creates a server-side paged query of the given resource type. Must be called in an injection context
 * (a field initializer of a component). The query reloads when its criteria, page or sort change
 * and after any change of that resource type (DataVersionService).
 */
export function createPagedQuery<T>(type: ResourceType, options: PagedQueryOptions = {}): PagedQuery<T> {
  const facade = inject(ServiceFacade);
  const version = inject(DataVersionService).version(type);

  const criteria = signal<SearchCriteria[]>([]);
  const pageIndex = signal(0);
  const pageSize = signal(options.pageSize ?? DEFAULT_PAGE_SIZE);
  const sort = signal<QuerySort | null>(options.sort ?? null);

  const resource = rxResource({
    defaultValue: emptyPage<T>(),
    params: () => ({
      criteria: criteria(),
      page: pageIndex(),
      size: pageSize(),
      sort: sort(),
      version: version(),
    }),
    stream: ({params}) => facade.findBy(
      type,
      options.unpaged ? null : {page: params.page, size: params.size, sort: params.sort ? [params.sort.field, params.sort.direction] : []},
      {searchCriteria: params.criteria}
    ),
  });

  return {
    criteria,
    pageIndex,
    pageSize,
    sort,
    page: computed(() => safePage(resource)),
    loading: resource.isLoading,
    failed: computed(() => resource.status() === 'error'),
    reload: () => resource.reload(),
  };
}
